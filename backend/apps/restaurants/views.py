import re
from django.db.models import F, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.billing.entitlements import (
    get_entitlements_for_owner,
    get_template_required_tier,
    grant_trial_subscription,
    normalize_template_code,
    TIER_LABELS,
)
from apps.common.responses import api_success, api_error
from apps.orders.models import Order, ensure_default_stages
from apps.orders.serializers import KitchenStageSerializer
from .models import Restaurant
from .serializers import (
    RestaurantSerializer,
    CreateRestaurantSerializer,
    CompleteRestaurantSerializer,
    RestaurantSettingsSerializer,
    RestaurantBrandingSerializer,
)


def _is_truthy(val) -> bool:
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        return val.strip().lower() in ("true", "1", "yes")
    return bool(val)


def get_user_restaurant(user):
    target_owner = user if user.role == User.Role.OWNER else user.owner
    if not target_owner:
        return None
    return target_owner.restaurants.first()


class CheckSlugView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        slug = str(request.query_params.get("slug", "")).strip().lower()
        if len(slug) < 3 or not re.match(r"^[a-z0-9-]+$", slug):
            return api_error(
                "آدرس انگلیسی باید حداقل ۳ کاراکتر (حروف انگلیسی، عدد یا -) باشد."
            )

        reserved = {
            "admin",
            "api",
            "login",
            "register",
            "dashboard",
            "mine",
            "settings",
            "complete",
            "branding",
            "logo",
            "check-slug",
        }
        if slug in reserved:
            return api_error("این آدرس رزرو شده است؛ نام دیگری انتخاب کنید.")

        existing_own = request.user.restaurants.first()
        qs = Restaurant.objects.filter(slug__iexact=slug)
        if existing_own:
            qs = qs.exclude(pk=existing_own.pk)

        if qs.exists():
            return api_error("این آدرس انگلیسی قبلاً ثبت شده است.")

        return api_success(
            {"available": True, "slug": slug}, message="آدرس آزاد است."
        )


class RestaurantCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != User.Role.OWNER:
            return api_error(
                "فقط مدیر می‌تواند مجموعه ثبت کند.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        existing = request.user.restaurants.first()
        if existing:
            serializer = CreateRestaurantSerializer(
                existing, data=request.data, partial=True
            )
            if not serializer.is_valid():
                return api_error(
                    "اطلاعات ثبت مجموعه نامعتبر است.", serializer.errors
                )
            restaurant = serializer.save()
            ensure_default_stages(restaurant)
            grant_trial_subscription(request.user, days=7)
            data = RestaurantSerializer(restaurant).data
            data["subscription"] = get_entitlements_for_owner(restaurant.owner)
            return api_success(
                data,
                message="اطلاعات اولیه مجموعه به‌روزرسانی شد.",
            )

        serializer = CreateRestaurantSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(
                "اطلاعات ثبت مجموعه نامعتبر است.", serializer.errors
            )

        restaurant = serializer.save(owner=request.user)
        ensure_default_stages(restaurant)
        grant_trial_subscription(request.user, days=7)
        data = RestaurantSerializer(restaurant).data
        data["subscription"] = get_entitlements_for_owner(restaurant.owner)
        return api_success(
            data,
            message="مجموعه با موفقیت ثبت شد و ۷ روز اشتراک رایگان پلاس برای شما فعال گردید.",
            status_code=status.HTTP_201_CREATED,
        )


class MyRestaurantView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "هنوز رستورانی ثبت نشده است.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        data = RestaurantSerializer(restaurant).data

        now_local = timezone.localtime(timezone.now())
        start_of_today = now_local.replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end_of_today = now_local.replace(
            hour=23, minute=59, second=59, microsecond=999999
        )

        valid_orders = Order.objects.filter(restaurant=restaurant).exclude(
            status=Order.Status.CANCELLED
        )
        today_orders = valid_orders.filter(
            created_at__range=(start_of_today, end_of_today)
        )

        today_sales = (
            today_orders.aggregate(total=Sum("total_price"))["total"] or 0
        )
        total_sales = (
            valid_orders.aggregate(total=Sum("total_price"))["total"] or 0
        )
        paid_sales = (
            valid_orders.filter(
                payment_status=Order.PaymentStatus.PAID
            ).aggregate(total=Sum("total_price"))["total"]
            or 0
        )
        active_orders_count = valid_orders.exclude(
            status=Order.Status.COMPLETED
        ).count()

        data["todaySales"] = today_sales
        data["todayOrdersCount"] = today_orders.count()
        data["totalSales"] = total_sales
        data["totalOrdersCount"] = valid_orders.count()
        data["paidSales"] = paid_sales
        data["activeOrdersCount"] = active_orders_count
        data["subscription"] = get_entitlements_for_owner(restaurant.owner)

        return api_success(data)


class CompleteRestaurantView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "ابتدا نام و آدرس مجموعه را ثبت کنید.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        serializer = CompleteRestaurantSerializer(
            restaurant, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return api_error("اطلاعات تکمیلی نامعتبر است.", serializer.errors)

        serializer.save()
        return api_success(
            RestaurantSerializer(restaurant).data,
            message="اطلاعات مجموعه با موفقیت تکمیل شد.",
        )


class RestaurantSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "رستوران یافت نشد.", status_code=status.HTTP_404_NOT_FOUND
            )

        ent = get_entitlements_for_owner(restaurant.owner)
        if not ent["hasActiveSubscription"]:
            return api_error(
                "اشتراک شما منقضی یا غیرفعال شده است. برای تغییر تنظیمات ابتدا اشتراک تهیه کنید.",
                data={"code": "UPGRADE_REQUIRED", "requiredTier": "basic"},
                status_code=status.HTTP_403_FORBIDDEN,
            )

        features = ent["features"]
        req_bilingual = request.data.get("bilingual")
        req_ordering = request.data.get(
            "orderingEnabled", request.data.get("ordering_enabled")
        )
        req_waiter = request.data.get(
            "callWaiterEnabled", request.data.get("call_waiter_enabled")
        )
        req_chef = request.data.get(
            "callChefEnabled", request.data.get("call_chef_enabled")
        )

        if (
            req_bilingual is not None
            and _is_truthy(req_bilingual)
            and not features.get("bilingual")
        ):
            return api_error(
                "قابلیت منوی دو زبانه از پلن استاندارد به بالا فعال است.",
                data={
                    "code": "UPGRADE_REQUIRED",
                    "feature": "bilingual",
                    "requiredTier": "standard",
                },
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if (
            req_ordering is not None
            and _is_truthy(req_ordering)
            and not features.get("onlineOrdering")
        ):
            return api_error(
                "قابلیت سفارش‌دهی آنلاین از منو در پلن استاندارد و پلاس فعال است.",
                data={
                    "code": "UPGRADE_REQUIRED",
                    "feature": "onlineOrdering",
                    "requiredTier": "standard",
                },
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if (
            req_waiter is not None
            and _is_truthy(req_waiter)
            and not features.get("callWaiter")
        ):
            return api_error(
                "قابلیت درخواست گارسون در پلن استاندارد و پلاس فعال است.",
                data={
                    "code": "UPGRADE_REQUIRED",
                    "feature": "callWaiter",
                    "requiredTier": "standard",
                },
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if (
            req_chef is not None
            and _is_truthy(req_chef)
            and not features.get("callChef")
        ):
            return api_error(
                "قابلیت درخواست سرآشپز در پلن استاندارد و پلاس فعال است.",
                data={
                    "code": "UPGRADE_REQUIRED",
                    "feature": "callChef",
                    "requiredTier": "standard",
                },
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = RestaurantSettingsSerializer(
            restaurant, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return api_error("خطا در ذخیره تنظیمات.", serializer.errors)

        serializer.save()
        data = RestaurantSerializer(restaurant).data
        data["subscription"] = ent
        return api_success(data, message="تنظیمات با موفقیت ذخیره شد.")


class RestaurantLogoUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "رستوران یافت نشد.", status_code=status.HTTP_404_NOT_FOUND
            )

        file_obj = request.FILES.get("file")
        if not file_obj:
            return api_error("فایل لوگو ارسال نشده است.")

        restaurant.logo = file_obj
        restaurant.save()
        restaurant.logo_url = restaurant.logo.url
        restaurant.save(update_fields=["logo_url"])

        return api_success(
            {"logoUrl": restaurant.logo.url, "url": restaurant.logo.url},
            message="لوگو با موفقیت آپلود شد.",
        )


class RestaurantBrandingView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "رستوران یافت نشد.", status_code=status.HTTP_404_NOT_FOUND
            )

        ent = get_entitlements_for_owner(restaurant.owner)
        if not ent["hasActiveSubscription"]:
            return api_error(
                "اشتراک شما فعال نیست. برای تغییر قالب ابتدا اشتراک تهیه کنید.",
                data={"code": "UPGRADE_REQUIRED", "requiredTier": "basic"},
                status_code=status.HTTP_403_FORBIDDEN,
            )

        payload = (
            request.data.copy()
            if hasattr(request.data, "copy")
            else dict(request.data)
        )
        raw_theme = payload.get("theme")
        if raw_theme:
            theme_code = normalize_template_code(raw_theme)
            if theme_code not in ent["allowedTemplates"]:
                req_tier = get_template_required_tier(theme_code)
                req_label = TIER_LABELS.get(req_tier, req_tier)
                return api_error(
                    f"این قالب در پلن فعلی شما قفل است و از پلن «{req_label}» به بالا در دسترس می‌باشد.",
                    data={
                        "code": "UPGRADE_REQUIRED",
                        "feature": "template",
                        "templateCode": theme_code,
                        "requiredTier": req_tier,
                    },
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            payload["theme"] = theme_code

        serializer = RestaurantBrandingSerializer(
            restaurant, data=payload, partial=True
        )
        if not serializer.is_valid():
            return api_error("خطا در ذخیره برندینگ.", serializer.errors)

        serializer.save()
        data = RestaurantSerializer(restaurant).data
        data["subscription"] = ent
        return api_success(data, message="ظاهر و قالب منو ذخیره شد.")


class PublicRestaurantDetailView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, slug):
        restaurant = get_object_or_404(Restaurant, slug__iexact=slug)
        Restaurant.objects.filter(pk=restaurant.pk).update(
            live_views=F("live_views") + 1
        )
        restaurant.refresh_from_db()

        ent = get_entitlements_for_owner(restaurant.owner)
        features = ent["features"]
        allowed_templates = ent["allowedTemplates"]

        data = RestaurantSerializer(restaurant).data

        # هماهنگ‌سازی خروجی منوی عمومی با دسترسی‌های پلن فعال مجموعه
        if not features.get("bilingual"):
            data["bilingual"] = False
        if not features.get("onlineOrdering"):
            data["orderingEnabled"] = False
        if not features.get("callWaiter"):
            data["callWaiterEnabled"] = False
        if not features.get("callChef"):
            data["callChefEnabled"] = False

        current_theme = normalize_template_code(data.get("theme"))
        if allowed_templates and current_theme not in allowed_templates:
            data["theme"] = allowed_templates[0]

        data["subscriptionActive"] = ent["hasActiveSubscription"]
        data["subscriptionTier"] = ent["tier"]

        stages = ensure_default_stages(restaurant)
        data["kitchenStages"] = KitchenStageSerializer(stages, many=True).data
        return api_success(data)


class RestaurantTemplatesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        restaurant = get_user_restaurant(request.user)
        ent = (
            get_entitlements_for_owner(restaurant.owner)
            if restaurant
            else {"allowedTemplates": []}
        )
        allowed = set(ent.get("allowedTemplates", []))

        templates = []
        for i in range(1, 16):
            code = f"template_{i}"
            req_tier = get_template_required_tier(code)
            templates.append(
                {
                    "code": code,
                    "name": f"قالب منو {i}",
                    "thumbnailUrl": "",
                    "requiredTier": req_tier,
                    "requiredTierLabel": TIER_LABELS.get(req_tier, ""),
                    "isLocked": code not in allowed,
                }
            )
        return api_success(templates)