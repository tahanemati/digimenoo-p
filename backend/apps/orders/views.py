from datetime import datetime, timedelta
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.common.responses import api_success, api_error
from apps.menu.models import Product
from apps.reservations.views import broadcast_tables_snapshot
from apps.restaurants.models import Restaurant
from apps.restaurants.views import get_user_restaurant
from .models import (
    KitchenStage,
    Order,
    OrderItem,
    TableServiceCall,
    ensure_default_stages,
)
from .realtime import (
    broadcast_kitchen_event,
    broadcast_order_event,
    broadcast_menu_event,
)
from .serializers import (
    KitchenStageSerializer,
    PublicOrderCreateSerializer,
    OrderSerializer,
    TableServiceCallSerializer,
)


class PublicOrderCreateView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PublicOrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error("اطلاعات سفارش نامعتبر است.", serializer.errors)

        data = serializer.validated_data
        restaurant = get_object_or_404(
            Restaurant, slug__iexact=data["restaurantSlug"]
        )

        if not restaurant.ordering_enabled:
            return api_error(
                "ثبت سفارش آنلاین در حال حاضر برای این مجموعه غیرفعال است.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if (
            restaurant.table_count > 0
            and data["tableNumber"] > restaurant.table_count
        ):
            return api_error("شماره میز وارد شده معتبر نیست.")

        stages = ensure_default_stages(restaurant)
        first_stage = stages[0] if stages else None

        with transaction.atomic():
            total_price = 0
            order_items_to_create = []

            for item_data in data["items"]:
                product = (
                    Product.objects.select_for_update()
                    .filter(id=item_data["productId"], restaurant=restaurant)
                    .first()
                )
                if not product:
                    return api_error(
                        "یکی از محصولات انتخاب‌شده در منو یافت نشد."
                    )

                qty = item_data["quantity"]
                if not product.is_available_in_menu or (
                    product.stock is not None and product.stock < qty
                ):
                    return api_error(
                        f"موجودی محصول «{product.name_fa}» کافی نیست."
                    )

                if product.stock is not None:
                    product.stock -= qty
                    product.save(update_fields=["stock", "updated_at"])

                total_price += product.price * qty
                order_items_to_create.append(
                    OrderItem(
                        product=product,
                        product_name_fa=product.name_fa,
                        product_name_en=product.name_en,
                        unit_price=product.price,
                        quantity=qty,
                        notes=item_data.get("notes", "").strip(),
                    )
                )

            order = Order.objects.create(
                restaurant=restaurant,
                stage=first_stage,
                table_number=data["tableNumber"],
                customer_name=data.get("customerName", "").strip(),
                customer_mobile=data.get("customerMobile", "").strip(),
                status=Order.Status.PENDING,
                payment_method=Order.PaymentMethod.CASHIER,
                payment_status=Order.PaymentStatus.PENDING,
                total_price=total_price,
            )

            for oi in order_items_to_create:
                oi.order = order
            OrderItem.objects.bulk_create(order_items_to_create)

        serialized_order = OrderSerializer(order).data
        broadcast_kitchen_event(
            restaurant.id, "order_created", serialized_order
        )
        broadcast_tables_snapshot(restaurant)

        return api_success(
            serialized_order,
            message="سفارش شما با موفقیت ثبت شد.",
            status_code=status.HTTP_201_CREATED,
        )


class PublicOrderStatusView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)
        return api_success(OrderSerializer(order).data)


class PublicCallWaiterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        slug = str(request.data.get("restaurantSlug", "")).strip()
        table_number = request.data.get("tableNumber")
        message = str(request.data.get("message", "")).strip()

        if not slug or not table_number:
            return api_error("اطلاعات میز نامعتبر است.")

        restaurant = get_object_or_404(Restaurant, slug__iexact=slug)
        if not restaurant.call_waiter_enabled:
            return api_error(
                "امکان احضار گارسون در این مجموعه فعال نیست.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        call = TableServiceCall.objects.create(
            restaurant=restaurant,
            table_number=int(table_number),
            call_type=TableServiceCall.CallType.WAITER,
            message=message or "درخواست حضور گارسون بر سر میز",
        )
        serialized_call = TableServiceCallSerializer(call).data
        broadcast_kitchen_event(
            restaurant.id, "service_call_created", serialized_call
        )

        return api_success(
            serialized_call,
            message="درخواست شما برای گارسون ارسال شد.",
            status_code=status.HTTP_201_CREATED,
        )


class PublicCallChefView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        slug = str(request.data.get("restaurantSlug", "")).strip()
        table_number = request.data.get("tableNumber")
        message = str(request.data.get("message", "")).strip()

        if not slug or not table_number:
            return api_error("اطلاعات میز نامعتبر است.")

        restaurant = get_object_or_404(Restaurant, slug__iexact=slug)
        if not restaurant.call_chef_enabled:
            return api_error(
                "امکان ارسال پیام به سرآشپز در این مجموعه فعال نیست.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        call = TableServiceCall.objects.create(
            restaurant=restaurant,
            table_number=int(table_number),
            call_type=TableServiceCall.CallType.CHEF,
            message=message or "درخواست ارتباط با سرآشپز",
        )
        serialized_call = TableServiceCallSerializer(call).data
        broadcast_kitchen_event(
            restaurant.id, "service_call_created", serialized_call
        )

        return api_success(
            serialized_call,
            message="پیام شما به آشپزخانه ارسال شد.",
            status_code=status.HTTP_201_CREATED,
        )


class KitchenStagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "مجموعه‌ای یافت نشد.", status_code=status.HTTP_404_NOT_FOUND
            )

        stages = ensure_default_stages(restaurant)
        return api_success(KitchenStageSerializer(stages, many=True).data)

    def put(self, request):
        if str(request.user.role).lower() not in ["owner", "kitchen"]:
            return api_error(
                "شما دسترسی تغییر مراحل پخت را ندارید.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "مجموعه‌ای یافت نشد.", status_code=status.HTTP_404_NOT_FOUND
            )

        items = (
            request.data
            if isinstance(request.data, list)
            else request.data.get("stages", [])
        )
        if not items:
            return api_error("حداقل یک مرحله پخت باید وجود داشته باشد.")

        with transaction.atomic():
            existing_map = {
                str(s.id): s
                for s in KitchenStage.objects.filter(restaurant=restaurant)
            }
            kept_ids = []

            for idx, item in enumerate(items):
                raw_id = str(item.get("id") or "").strip()
                name = str(item.get("name") or "مرحله").strip() or "مرحله"
                description = str(item.get("description") or "").strip()
                color = str(item.get("color") or "amber").strip() or "amber"

                if raw_id and raw_id in existing_map:
                    stage_obj = existing_map[raw_id]
                    stage_obj.name = name
                    stage_obj.description = description
                    stage_obj.color = color
                    stage_obj.order_index = idx
                    stage_obj.save(
                        update_fields=[
                            "name",
                            "description",
                            "color",
                            "order_index",
                        ]
                    )
                    kept_ids.append(stage_obj.id)
                else:
                    new_stage = KitchenStage.objects.create(
                        restaurant=restaurant,
                        name=name,
                        description=description,
                        color=color,
                        order_index=idx,
                    )
                    kept_ids.append(new_stage.id)

            first_kept = (
                KitchenStage.objects.filter(
                    restaurant=restaurant, id__in=kept_ids
                )
                .order_by("order_index")
                .first()
            )

            deleted_qs = KitchenStage.objects.filter(
                restaurant=restaurant
            ).exclude(id__in=kept_ids)
            if first_kept and deleted_qs.exists():
                Order.objects.filter(
                    restaurant=restaurant, stage__in=deleted_qs
                ).update(stage=first_kept)
            deleted_qs.delete()

        updated_stages = list(
            KitchenStage.objects.filter(restaurant=restaurant).order_by(
                "order_index", "id"
            )
        )
        serialized_stages = KitchenStageSerializer(
            updated_stages, many=True
        ).data

        broadcast_kitchen_event(
            restaurant.id, "stages_updated", {"stages": serialized_stages}
        )
        broadcast_menu_event(
            restaurant.slug, "stages_updated", {"stages": serialized_stages}
        )

        active_orders = Order.objects.filter(restaurant=restaurant).exclude(
            status__in=[Order.Status.COMPLETED, Order.Status.CANCELLED]
        )
        for active_order in active_orders:
            broadcast_order_event(
                active_order.id,
                "order_updated",
                OrderSerializer(active_order).data,
            )

        return api_success(
            serialized_stages, message="مراحل پخت بروزرسانی شد."
        )


class KitchenOrdersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "مجموعه‌ای یافت نشد.", status_code=status.HTTP_404_NOT_FOUND
            )

        role = str(request.user.role).lower()
        stages = ensure_default_stages(restaurant)
        first_stage = stages[0] if stages else None

        calls_qs = TableServiceCall.objects.filter(
            restaurant=restaurant, status=TableServiceCall.Status.PENDING
        )
        if role == "kitchen":
            calls_qs = calls_qs.filter(
                call_type=TableServiceCall.CallType.CHEF
            )
        elif role == "waiter":
            calls_qs = calls_qs.filter(
                call_type=TableServiceCall.CallType.WAITER
            )

        pending_calls = calls_qs.order_by("-created_at")

        if role == "waiter":
            return api_success(
                {
                    "role": role,
                    "orders": [],
                    "stages": [],
                    "calls": TableServiceCallSerializer(
                        pending_calls, many=True
                    ).data,
                    "accounting": None,
                }
            )

        active_orders = (
            Order.objects.filter(restaurant=restaurant)
            .exclude(
                status__in=[Order.Status.COMPLETED, Order.Status.CANCELLED]
            )
            .prefetch_related("items")
            .order_by("created_at")
        )

        for o in active_orders:
            if not o.stage_id and first_stage:
                o.stage = first_stage
                o.save(update_fields=["stage"])

        all_orders_today = (
            Order.objects.filter(restaurant=restaurant)
            .exclude(status=Order.Status.CANCELLED)
            .prefetch_related("items")
        )

        total_sales = sum(o.total_price for o in all_orders_today)
        paid_sales = sum(
            o.total_price
            for o in all_orders_today
            if o.payment_status == Order.PaymentStatus.PAID
        )
        unpaid_sales = total_sales - paid_sales
        paid_count = sum(
            1
            for o in all_orders_today
            if o.payment_status == Order.PaymentStatus.PAID
        )
        unpaid_count = sum(
            1
            for o in all_orders_today
            if o.payment_status != Order.PaymentStatus.PAID
        )

        accounting_summary = {
            "totalOrders": all_orders_today.count(),
            "totalSales": total_sales,
            "paidSales": paid_sales,
            "unpaidSales": unpaid_sales,
            "paidCount": paid_count,
            "unpaidCount": unpaid_count,
        }

        return api_success(
            {
                "role": role,
                "orders": OrderSerializer(active_orders, many=True).data,
                "stages": KitchenStageSerializer(stages, many=True).data,
                "calls": TableServiceCallSerializer(
                    pending_calls, many=True
                ).data,
                "accounting": accounting_summary,
            }
        )


class KitchenOrderStageUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, order_id, stage_id):
        if str(request.user.role).lower() not in ["owner", "kitchen"]:
            return api_error(
                "شما دسترسی تغییر مرحله سفارش را ندارید.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "مجموعه‌ای یافت نشد.", status_code=status.HTTP_404_NOT_FOUND
            )

        order = get_object_or_404(Order, id=order_id, restaurant=restaurant)
        target_stage = get_object_or_404(
            KitchenStage, id=stage_id, restaurant=restaurant
        )

        stages = list(
            KitchenStage.objects.filter(restaurant=restaurant).order_by(
                "order_index", "id"
            )
        )
        stage_ids = [s.id for s in stages]
        idx = (
            stage_ids.index(target_stage.id)
            if target_stage.id in stage_ids
            else 0
        )

        if idx == 0:
            new_status = Order.Status.PENDING
        elif idx >= len(stages) - 1:
            new_status = Order.Status.READY
        else:
            new_status = Order.Status.PREPARING

        order.stage = target_stage
        order.status = new_status
        order.save(update_fields=["stage", "status", "updated_at"])

        serialized = OrderSerializer(order).data
        broadcast_kitchen_event(restaurant.id, "order_updated", serialized)
        broadcast_order_event(order.id, "order_updated", serialized)
        return api_success(serialized)


class KitchenOrderCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        if str(request.user.role).lower() not in ["owner", "kitchen"]:
            return api_error(
                "شما دسترسی بایگانی سفارش را ندارید.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "مجموعه‌ای یافت نشد.", status_code=status.HTTP_404_NOT_FOUND
            )

        order = get_object_or_404(Order, id=order_id, restaurant=restaurant)
        order.status = Order.Status.COMPLETED
        order.save(update_fields=["status", "updated_at"])

        serialized = OrderSerializer(order).data
        broadcast_kitchen_event(
            restaurant.id, "order_completed", {"id": str(order.id)}
        )
        broadcast_order_event(order.id, "order_updated", serialized)
        broadcast_tables_snapshot(restaurant)

        return api_success(
            {"id": str(order.id)}, message="سفارش تحویل و بایگانی شد."
        )


class KitchenOrderPayView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        if str(request.user.role).lower() not in ["owner", "cashier"]:
            return api_error(
                "فقط صندوق‌دار یا مدیر می‌تواند تسویه حساب ثبت کند.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "مجموعه‌ای یافت نشد.", status_code=status.HTTP_404_NOT_FOUND
            )

        order = get_object_or_404(Order, id=order_id, restaurant=restaurant)
        order.payment_status = Order.PaymentStatus.PAID
        order.save(update_fields=["payment_status", "updated_at"])

        serialized = OrderSerializer(order).data
        broadcast_kitchen_event(restaurant.id, "order_updated", serialized)
        return api_success(serialized, message="تسویه حساب ثبت شد.")


class ResolveServiceCallView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, call_id):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "مجموعه‌ای یافت نشد.", status_code=status.HTTP_404_NOT_FOUND
            )

        call = get_object_or_404(
            TableServiceCall, id=call_id, restaurant=restaurant
        )
        call.status = TableServiceCall.Status.HANDLED
        call.save(update_fields=["status"])

        broadcast_kitchen_event(
            restaurant.id, "service_call_resolved", {"id": str(call.id)}
        )
        return api_success(
            {"id": str(call.id)}, message="درخواست میز رسیدگی شد."
        )


# ==========================================
# گزارشات جامع مالی، فروش محصولات و تراکنش‌ها
# ==========================================
JALALI_MONTHS = [
    "",
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
]


def gregorian_to_jalali(gy: int, gm: int, gd: int):
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    gy2 = gy + 1 if gm > 2 else gy
    days = (
        355666
        + (365 * gy)
        + ((gy2 + 3) // 4)
        - ((gy2 + 99) // 100)
        + ((gy2 + 399) // 400)
        + gd
        + g_d_m[gm - 1]
    )
    jy = -1595 + (33 * (days // 12053))
    days %= 12053
    jy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        jy += (days - 1) // 365
        days = (days - 1) % 365
    if days < 186:
        jm = 1 + (days // 31)
        jd = 1 + (days % 31)
    else:
        jm = 7 + ((days - 186) // 30)
        jd = 1 + ((days - 186) % 30)
    return jy, jm, jd


class FinancialReportsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = str(request.user.role).lower()
        if role not in ["owner", "cashier"]:
            return api_error(
                "شما دسترسی مشاهده گزارشات مالی را ندارید.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "مجموعه‌ای یافت نشد.", status_code=status.HTTP_404_NOT_FOUND
            )

        period = str(request.query_params.get("period", "daily")).lower()
        start_param = str(request.query_params.get("start_date", "")).strip()
        end_param = str(request.query_params.get("end_date", "")).strip()

        now_local = timezone.localtime(timezone.now())
        cur_jy, cur_jm, cur_jd = gregorian_to_jalali(
            now_local.year, now_local.month, now_local.day
        )

        base_qs = (
            Order.objects.filter(restaurant=restaurant)
            .exclude(status=Order.Status.CANCELLED)
            .prefetch_related(
                "items", "items__product", "items__product__category"
            )
            .order_by("-created_at")
        )

        filtered_orders = []
        period_label = ""

        if period == "custom" and start_param and end_param:
            try:
                start_dt = timezone.make_aware(
                    datetime.strptime(start_param, "%Y-%m-%d").replace(
                        hour=0, minute=0, second=0
                    )
                )
                end_dt = timezone.make_aware(
                    datetime.strptime(end_param, "%Y-%m-%d").replace(
                        hour=23, minute=59, second=59
                    )
                )
                filtered_orders = list(
                    base_qs.filter(created_at__range=(start_dt, end_dt))
                )
                s_jy, s_jm, s_jd = gregorian_to_jalali(
                    start_dt.year, start_dt.month, start_dt.day
                )
                e_jy, e_jm, e_jd = gregorian_to_jalali(
                    end_dt.year, end_dt.month, end_dt.day
                )
                period_label = f"از {s_jy}/{s_jm:02d}/{s_jd:02d} تا {e_jy}/{e_jm:02d}/{e_jd:02d}"
            except ValueError:
                return api_error("فرمت تاریخ نامعتبر است.")
        elif period == "yearly":
            start_approx = now_local - timedelta(days=370)
            candidates = base_qs.filter(created_at__gte=start_approx)
            for o in candidates:
                ldt = timezone.localtime(o.created_at)
                jy, _, _ = gregorian_to_jalali(ldt.year, ldt.month, ldt.day)
                if jy == cur_jy:
                    filtered_orders.append(o)
            period_label = f"گزارش سالانه — سال {cur_jy}"
        elif period == "monthly":
            start_approx = now_local - timedelta(days=35)
            candidates = base_qs.filter(created_at__gte=start_approx)
            for o in candidates:
                ldt = timezone.localtime(o.created_at)
                jy, jm, _ = gregorian_to_jalali(ldt.year, ldt.month, ldt.day)
                if jy == cur_jy and jm == cur_jm:
                    filtered_orders.append(o)
            period_label = f"گزارش ماهانه — {JALALI_MONTHS[cur_jm]} {cur_jy}"
        else:
            period = "daily"
            start_of_today = now_local.replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            end_of_today = now_local.replace(
                hour=23, minute=59, second=59, microsecond=999999
            )
            filtered_orders = list(
                base_qs.filter(created_at__range=(start_of_today, end_of_today))
            )
            period_label = f"گزارش روزانه — {cur_jd} {JALALI_MONTHS[cur_jm]} {cur_jy}"

        total_sales = 0
        paid_sales = 0
        unpaid_sales = 0
        online_sales = 0
        cashier_sales = 0
        total_items_sold = 0

        product_stats: dict = {}
        chart_buckets: dict = {}

        if period == "daily":
            for h in range(8, 24):
                label = f"{h:02d}:00"
                chart_buckets[label] = {"label": label, "sales": 0, "orders": 0}
        elif period == "monthly":
            max_days = 31 if cur_jm <= 6 else 30
            for d in range(1, max_days + 1):
                label = f"{d} {JALALI_MONTHS[cur_jm]}"
                chart_buckets[d] = {"label": label, "sales": 0, "orders": 0}
        elif period == "yearly":
            for m in range(1, 13):
                label = JALALI_MONTHS[m]
                chart_buckets[m] = {"label": label, "sales": 0, "orders": 0}

        transactions = []

        for order in filtered_orders:
            amount = int(order.total_price or 0)
            total_sales += amount

            if order.payment_status == Order.PaymentStatus.PAID:
                paid_sales += amount
            else:
                unpaid_sales += amount

            if order.payment_method == Order.PaymentMethod.ONLINE:
                online_sales += amount
            else:
                cashier_sales += amount

            ldt = timezone.localtime(order.created_at)
            jy, jm, jd = gregorian_to_jalali(ldt.year, ldt.month, ldt.day)

            if period == "daily":
                h_key = f"{ldt.hour:02d}:00"
                if h_key not in chart_buckets:
                    chart_buckets[h_key] = {
                        "label": h_key,
                        "sales": 0,
                        "orders": 0,
                    }
                chart_buckets[h_key]["sales"] += amount
                chart_buckets[h_key]["orders"] += 1
            elif period == "monthly":
                if jd in chart_buckets:
                    chart_buckets[jd]["sales"] += amount
                    chart_buckets[jd]["orders"] += 1
            elif period == "yearly":
                if jm in chart_buckets:
                    chart_buckets[jm]["sales"] += amount
                    chart_buckets[jm]["orders"] += 1
            else:
                d_key = f"{jm:02d}/{jd:02d}"
                if d_key not in chart_buckets:
                    chart_buckets[d_key] = {
                        "label": d_key,
                        "sales": 0,
                        "orders": 0,
                    }
                chart_buckets[d_key]["sales"] += amount
                chart_buckets[d_key]["orders"] += 1

            items_list = list(order.items.all())
            items_summary_parts = []

            for item in items_list:
                qty = int(item.quantity or 1)
                item_rev = int(item.unit_price or 0) * qty
                total_items_sold += qty
                p_name = item.product_name_fa or "محصول"
                items_summary_parts.append(f"{p_name} (×{qty})")

                cat_name = "عمومی"
                if item.product and getattr(item.product, "category", None):
                    cat_name = (
                        getattr(item.product.category, "name_fa", None)
                        or getattr(item.product.category, "name", None)
                        or "عمومی"
                    )

                p_key = str(item.product_id) if item.product_id else p_name
                if p_key not in product_stats:
                    product_stats[p_key] = {
                        "id": p_key,
                        "name": p_name,
                        "categoryName": cat_name,
                        "unitPrice": int(item.unit_price or 0),
                        "quantitySold": 0,
                        "totalRevenue": 0,
                        "orderIds": set(),
                    }

                product_stats[p_key]["quantitySold"] += qty
                product_stats[p_key]["totalRevenue"] += item_rev
                product_stats[p_key]["orderIds"].add(str(order.id))

            transactions.append(
                {
                    "id": str(order.id),
                    "orderNumber": order.order_number,
                    "tableNumber": order.table_number,
                    "customerName": order.customer_name or "مهمان",
                    "totalPrice": amount,
                    "paymentMethod": order.payment_method,
                    "paymentStatus": order.payment_status,
                    "status": order.status,
                    "jalaliDate": f"{jy}/{jm:02d}/{jd:02d}",
                    "time": ldt.strftime("%H:%M"),
                    "itemsSummary": "، ".join(items_summary_parts),
                }
            )

        products_list = []
        for p in product_stats.values():
            rev_share = (
                round((p["totalRevenue"] / total_sales) * 100, 1)
                if total_sales > 0
                else 0
            )
            qty_share = (
                round((p["quantitySold"] / total_items_sold) * 100, 1)
                if total_items_sold > 0
                else 0
            )
            products_list.append(
                {
                    "id": p["id"],
                    "name": p["name"],
                    "categoryName": p["categoryName"],
                    "unitPrice": p["unitPrice"],
                    "quantitySold": p["quantitySold"],
                    "totalRevenue": p["totalRevenue"],
                    "ordersCount": len(p["orderIds"]),
                    "revenueShare": rev_share,
                    "quantityShare": qty_share,
                }
            )

        products_list.sort(
            key=lambda x: (x["quantitySold"], x["totalRevenue"]), reverse=True
        )

        total_orders = len(filtered_orders)
        avg_order_value = (
            round(total_sales / total_orders) if total_orders > 0 else 0
        )

        return api_success(
            {
                "restaurantName": restaurant.name,
                "period": period,
                "periodLabel": period_label,
                "generatedAt": f"{cur_jy}/{cur_jm:02d}/{cur_jd:02d} - {now_local.strftime('%H:%M')}",
                "summary": {
                    "totalSales": total_sales,
                    "paidSales": paid_sales,
                    "unpaidSales": unpaid_sales,
                    "onlineSales": online_sales,
                    "cashierSales": cashier_sales,
                    "totalOrders": total_orders,
                    "totalItemsSold": total_items_sold,
                    "averageOrderValue": avg_order_value,
                },
                "chartData": list(chart_buckets.values()),
                "products": products_list,
                "transactions": transactions,
            }
        )