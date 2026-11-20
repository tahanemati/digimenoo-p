import re
from django.db.models import F, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.accounts.models import User
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
            return api_success(
                RestaurantSerializer(restaurant).data,
                message="اطلاعات اولیه مجموعه به‌روزرسانی شد.",
            )

        serializer = CreateRestaurantSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(
                "اطلاعات ثبت مجموعه نامعتبر است.", serializer.errors
            )

        restaurant = serializer.save(owner=request.user)
        ensure_default_stages(restaurant)
        return api_success(
            RestaurantSerializer(restaurant).data,
            message="مجموعه با موفقیت ثبت شد.",
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

        serializer = RestaurantSettingsSerializer(
            restaurant, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return api_error("خطا در ذخیره تنظیمات.", serializer.errors)

        serializer.save()
        return api_success(
            RestaurantSerializer(restaurant).data,
            message="تنظیمات با موفقیت ذخیره شد.",
        )


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

        serializer = RestaurantBrandingSerializer(
            restaurant, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return api_error("خطا در ذخیره برندینگ.", serializer.errors)

        serializer.save()
        return api_success(
            RestaurantSerializer(restaurant).data,
            message="ظاهر و قالب منو ذخیره شد.",
        )


class PublicRestaurantDetailView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, slug):
        restaurant = get_object_or_404(Restaurant, slug__iexact=slug)
        Restaurant.objects.filter(pk=restaurant.pk).update(
            live_views=F("live_views") + 1
        )
        restaurant.refresh_from_db()
        data = RestaurantSerializer(restaurant).data
        stages = ensure_default_stages(restaurant)
        data["kitchenStages"] = KitchenStageSerializer(stages, many=True).data
        return api_success(data)


class RestaurantTemplatesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        templates = [
            {
                "code": f"template_{i}",
                "name": f"قالب منو {i}",
                "thumbnailUrl": "",
            }
            for i in range(1, 16)
        ]
        return api_success(templates)