from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.common.responses import api_success, api_error
from apps.orders.models import Order
from apps.orders.realtime import broadcast_kitchen_event, broadcast_menu_event
from apps.restaurants.models import Restaurant
from apps.restaurants.views import get_user_restaurant
from .models import TableReservation
from .serializers import TableReservationSerializer


def build_tables_status_snapshot(restaurant: Restaurant):
    table_count = max(int(restaurant.table_count or 0), 0)

    # میزهایی که سفارش باز دارند رزرو / اشغال محسوب می‌شوند
    open_orders = (
        Order.objects.filter(restaurant=restaurant)
        .exclude(status__in=[Order.Status.COMPLETED, Order.Status.CANCELLED])
        .select_related("stage")
        .order_by("-created_at")
    )
    open_orders_by_table = {}
    for o in open_orders:
        if o.table_number not in open_orders_by_table:
            open_orders_by_table[o.table_number] = o

    # رزروهای فعال (در انتظار تایید یا تایید شده)
    active_reservations = TableReservation.objects.filter(
        restaurant=restaurant,
        status__in=[
            TableReservation.Status.PENDING,
            TableReservation.Status.CONFIRMED,
        ],
    ).order_by("-created_at")
    reservations_by_table = {}
    for r in active_reservations:
        if r.table_number not in reservations_by_table:
            reservations_by_table[r.table_number] = r

    tables = []
    for num in range(1, table_count + 1):
        open_order = open_orders_by_table.get(num)
        active_res = reservations_by_table.get(num)

        if open_order:
            state = "occupied"
        elif active_res:
            state = "reserved"
        else:
            state = "available"

        tables.append(
            {
                "tableNumber": num,
                "state": state,
                "activeOrder": (
                    {
                        "id": str(open_order.id),
                        "orderNumber": open_order.order_number,
                        "status": open_order.status,
                        "stageName": (
                            open_order.stage.name
                            if open_order.stage
                            else "در حال پردازش"
                        ),
                        "totalPrice": open_order.total_price,
                    }
                    if open_order
                    else None
                ),
                "reservation": (
                    TableReservationSerializer(active_res).data
                    if active_res
                    else None
                ),
            }
        )

    return {
        "tableCount": table_count,
        "tables": tables,
    }


def broadcast_tables_snapshot(
    restaurant: Restaurant,
    extra_kitchen_event=None,
    extra_kitchen_data=None,
):
    snapshot = build_tables_status_snapshot(restaurant)
    broadcast_menu_event(restaurant.slug, "tables_updated", snapshot)
    broadcast_kitchen_event(restaurant.id, "tables_updated", snapshot)
    if extra_kitchen_event:
        broadcast_kitchen_event(
            restaurant.id, extra_kitchen_event, extra_kitchen_data or {}
        )
    return snapshot


class PublicTablesStatusView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, slug):
        restaurant = get_object_or_404(Restaurant, slug__iexact=slug)
        return api_success(build_tables_status_snapshot(restaurant))


class PublicReservationCreateView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        slug = str(request.data.get("restaurantSlug", "")).strip()
        table_number = int(request.data.get("tableNumber") or 0)
        customer_name = str(request.data.get("customerName", "")).strip()
        customer_mobile = str(request.data.get("customerMobile", "")).strip()
        guests_count = max(int(request.data.get("guestsCount") or 2), 1)
        reservation_time = str(request.data.get("reservationTime", "")).strip()
        notes = str(request.data.get("notes", "")).strip()

        if not slug:
            return api_error("آدرس مجموعه نامعتبر است.")

        restaurant = get_object_or_404(Restaurant, slug__iexact=slug)
        table_count = int(restaurant.table_count or 0)

        if table_number < 1 or (table_count > 0 and table_number > table_count):
            return api_error("لطفاً یک شماره میز معتبر انتخاب کنید.")

        if len(customer_name) < 2:
            return api_error("لطفاً نام و نام خانوادگی خود را وارد کنید.")

        if len(customer_mobile) < 10:
            return api_error("لطفاً شماره تماس معتبر وارد کنید.")

        with transaction.atomic():
            has_open_order = (
                Order.objects.filter(
                    restaurant=restaurant, table_number=table_number
                )
                .exclude(
                    status__in=[Order.Status.COMPLETED, Order.Status.CANCELLED]
                )
                .exists()
            )
            if has_open_order:
                return api_error(
                    f"میز شماره {table_number} در حال حاضر دارای سفارش باز است و امکان رزرو ندارد."
                )

            has_active_res = TableReservation.objects.filter(
                restaurant=restaurant,
                table_number=table_number,
                status__in=[
                    TableReservation.Status.PENDING,
                    TableReservation.Status.CONFIRMED,
                ],
            ).exists()
            if has_active_res:
                return api_error(
                    f"میز شماره {table_number} لحظاتی پیش رزرو شد. لطفاً میز دیگری انتخاب کنید."
                )

            reservation = TableReservation.objects.create(
                restaurant=restaurant,
                table_number=table_number,
                customer_name=customer_name,
                customer_mobile=customer_mobile,
                guests_count=guests_count,
                reservation_time=reservation_time,
                notes=notes,
                source=TableReservation.Source.CUSTOMER,
                status=TableReservation.Status.PENDING,
            )

        serialized_res = TableReservationSerializer(reservation).data
        broadcast_tables_snapshot(
            restaurant,
            extra_kitchen_event="reservation_created",
            extra_kitchen_data=serialized_res,
        )

        return api_success(
            serialized_res,
            message=f"رزرو میز شماره {table_number} با موفقیت ثبت شد.",
            status_code=status.HTTP_201_CREATED,
        )


class ManageReservationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "مجموعه‌ای یافت نشد.", status_code=status.HTTP_404_NOT_FOUND
            )

        snapshot = build_tables_status_snapshot(restaurant)
        recent_reservations = TableReservation.objects.filter(
            restaurant=restaurant
        ).order_by("-created_at")[:50]

        return api_success(
            {
                **snapshot,
                "reservations": TableReservationSerializer(
                    recent_reservations, many=True
                ).data,
            }
        )

    def post(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "مجموعه‌ای یافت نشد.", status_code=status.HTTP_404_NOT_FOUND
            )

        table_number = int(request.data.get("tableNumber") or 0)
        customer_name = str(request.data.get("customerName", "")).strip()
        customer_mobile = str(request.data.get("customerMobile", "")).strip()
        guests_count = max(int(request.data.get("guestsCount") or 2), 1)
        reservation_time = str(request.data.get("reservationTime", "")).strip()
        notes = str(request.data.get("notes", "")).strip()

        table_count = int(restaurant.table_count or 0)
        if table_number < 1 or (table_count > 0 and table_number > table_count):
            return api_error("شماره میز انتخاب‌شده معتبر نیست.")

        if len(customer_name) < 2 or len(customer_mobile) < 10:
            return api_error("نام و نام خانوادگی و شماره تماس معتبر الزامی است.")

        with transaction.atomic():
            has_open_order = (
                Order.objects.filter(
                    restaurant=restaurant, table_number=table_number
                )
                .exclude(
                    status__in=[Order.Status.COMPLETED, Order.Status.CANCELLED]
                )
                .exists()
            )
            if has_open_order:
                return api_error(
                    f"میز شماره {table_number} دارای سفارش باز است و رزرو محسوب می‌شود."
                )

            has_active_res = TableReservation.objects.filter(
                restaurant=restaurant,
                table_number=table_number,
                status__in=[
                    TableReservation.Status.PENDING,
                    TableReservation.Status.CONFIRMED,
                ],
            ).exists()
            if has_active_res:
                return api_error(
                    f"میز شماره {table_number} در حال حاضر رزرو است."
                )

            reservation = TableReservation.objects.create(
                restaurant=restaurant,
                table_number=table_number,
                customer_name=customer_name,
                customer_mobile=customer_mobile,
                guests_count=guests_count,
                reservation_time=reservation_time,
                notes=notes,
                source=TableReservation.Source.MANUAL,
                status=TableReservation.Status.CONFIRMED,
            )

        serialized_res = TableReservationSerializer(reservation).data
        broadcast_tables_snapshot(
            restaurant,
            extra_kitchen_event="reservation_updated",
            extra_kitchen_data=serialized_res,
        )

        return api_success(
            serialized_res,
            message=f"میز شماره {table_number} برای {customer_name} رزرو شد.",
            status_code=status.HTTP_201_CREATED,
        )


class ManageReservationStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, reservation_id):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "مجموعه‌ای یافت نشد.", status_code=status.HTTP_404_NOT_FOUND
            )

        reservation = get_object_or_404(
            TableReservation, id=reservation_id, restaurant=restaurant
        )
        new_status = str(request.data.get("status", "")).strip().lower()
        allowed = [
            TableReservation.Status.CONFIRMED,
            TableReservation.Status.CANCELLED,
            TableReservation.Status.COMPLETED,
        ]
        if new_status not in allowed:
            return api_error("وضعیت ارسالی نامعتبر است.")

        reservation.status = new_status
        reservation.save(update_fields=["status", "updated_at"])

        serialized_res = TableReservationSerializer(reservation).data
        broadcast_tables_snapshot(
            restaurant,
            extra_kitchen_event="reservation_updated",
            extra_kitchen_data=serialized_res,
        )

        return api_success(
            serialized_res, message="وضعیت رزرو میز بروزرسانی شد."
        )