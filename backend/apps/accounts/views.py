import random
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.responses import api_success, api_error
from apps.restaurants.views import get_user_restaurant
from .models import User, OTPCode
from .serializers import (
    LoginSerializer,
    CompleteProfileSerializer,
    TeamMemberSerializer,
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    access_str = str(refresh.access_token)
    refresh_str = str(refresh)
    return {
        "token": access_str,
        "access": access_str,
        "accessToken": access_str,
        "refresh": refresh_str,
        "refreshToken": refresh_str,
        "role": user.role,
    }


def user_has_restaurant(user):
    target_owner = user if user.role == User.Role.OWNER else user.owner
    return (
        target_owner.restaurants.exists()
        if target_owner and hasattr(target_owner, "restaurants")
        else False
    )


def create_and_send_otp(mobile, purpose):
    code = str(random.randint(100000, 999999))
    OTPCode.objects.create(
        mobile=mobile,
        code=code,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=2),
    )
    print("\n" + "=" * 45)
    print(f"📲 OTP [{purpose}] for {mobile}: {code}")
    print("=" * 45 + "\n")
    return code


class SendOTPView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        mobile = str(request.data.get("mobile", "")).strip()
        if len(mobile) != 11 or not mobile.startswith("09"):
            return api_error(
                "شماره موبایل معتبر وارد کنید (مثلاً 09123456789)."
            )

        code = create_and_send_otp(mobile, OTPCode.Purpose.REGISTER)
        payload = {"mobile": mobile}
        if settings.DEBUG:
            payload["dev_otp"] = code
        return api_success(payload, message="کد تایید ارسال شد.")


class VerifyOTPView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        mobile = str(request.data.get("mobile", "")).strip()
        code = str(request.data.get("code", "")).strip()

        otp_obj = (
            OTPCode.objects.filter(
                mobile=mobile,
                code=code,
                purpose=OTPCode.Purpose.REGISTER,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not otp_obj or otp_obj.is_expired():
            return api_error("کد وارد شده نامعتبر یا منقضی شده است.")

        otp_obj.is_verified = True
        otp_obj.is_used = True
        otp_obj.save()

        user, _ = User.objects.get_or_create(
            mobile=mobile,
            defaults={"role": User.Role.OWNER},
        )
        tokens = get_tokens_for_user(user)

        return api_success(
            {
                **tokens,
                "user": {
                    "id": str(user.id),
                    "name": user.full_name or "کاربر عزیز",
                    "mobile": user.mobile,
                    "role": user.role,
                    "hasContact": user.has_contact,
                    "hasRestaurant": user_has_restaurant(user),
                },
            },
            message="ورود با موفقیت انجام شد.",
        )


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error(
                "شماره موبایل یا رمز عبور اشتباه است.",
                serializer.errors,
                status.HTTP_401_UNAUTHORIZED,
            )

        user = serializer.validated_data["user"]
        tokens = get_tokens_for_user(user)
        return api_success(
            {
                **tokens,
                "user": {
                    "id": str(user.id),
                    "name": user.full_name or "همکار عزیز",
                    "mobile": user.mobile,
                    "role": user.role,
                    "hasContact": user.has_contact,
                    "hasRestaurant": user_has_restaurant(user),
                },
            },
            message="ورود با موفقیت انجام شد.",
        )


class CompleteProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CompleteProfileSerializer(
            request.user, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return api_error("اطلاعات وارد شده نامعتبر است.", serializer.errors)

        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return api_success(
            {
                **tokens,
                "user": {
                    "id": str(user.id),
                    "name": user.full_name,
                    "mobile": user.mobile,
                    "email": user.email,
                    "role": user.role,
                    "hasContact": user.has_contact,
                    "hasRestaurant": user_has_restaurant(user),
                },
            },
            message="اطلاعات حساب با موفقیت تکمیل شد.",
        )

    put = post


class DashboardStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return api_success(
            {
                "id": str(user.id),
                "name": user.full_name or "همکار عزیز",
                "mobile": user.mobile,
                "role": user.role,
                "hasContact": user.has_contact,
                "hasRestaurant": user_has_restaurant(user),
            }
        )


class ForgotPasswordRequestView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        mobile = str(request.data.get("mobile", "")).strip()
        if len(mobile) != 11 or not mobile.startswith("09"):
            return api_error("شماره موبایل وارد شده معتبر نیست.")

        user = User.objects.filter(mobile=mobile).first()
        if not user:
            return api_error(
                "کاربری با این شماره موبایل یافت نشد.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        if not user.is_active:
            return api_error(
                "حساب کاربری شما غیرفعال شده است.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        code = create_and_send_otp(mobile, OTPCode.Purpose.RESET)
        payload = {"mobile": mobile}
        if settings.DEBUG:
            payload["dev_otp"] = code
        return api_success(payload, message="کد بازیابی رمز عبور ارسال شد.")


class ForgotPasswordVerifyView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        mobile = str(request.data.get("mobile", "")).strip()
        code = str(request.data.get("code", "")).strip()

        if not mobile or not code:
            return api_error("شماره موبایل و کد تایید الزامی است.")

        otp_obj = (
            OTPCode.objects.filter(
                mobile=mobile,
                code=code,
                purpose=OTPCode.Purpose.RESET,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )
        if not otp_obj or otp_obj.is_expired():
            return api_error("کد بازیابی نامعتبر یا منقضی شده است.")

        otp_obj.is_verified = True
        otp_obj.save(update_fields=["is_verified"])
        return api_success({"verified": True}, message="کد تایید شد.")


class ForgotPasswordResetView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        mobile = str(request.data.get("mobile", "")).strip()
        code = str(request.data.get("code", "")).strip()
        new_password = str(
            request.data.get("newPassword")
            or request.data.get("new_password")
            or request.data.get("password")
            or ""
        ).strip()

        if len(new_password) < 6:
            return api_error("رمز عبور جدید باید حداقل ۶ کاراکتر باشد.")

        otp_qs = OTPCode.objects.filter(
            mobile=mobile,
            purpose=OTPCode.Purpose.RESET,
            is_used=False,
        )
        if code:
            otp_qs = otp_qs.filter(code=code)
        else:
            otp_qs = otp_qs.filter(is_verified=True)

        otp_obj = otp_qs.order_by("-created_at").first()
        if not otp_obj or otp_obj.is_expired():
            return api_error("اعتبار کد بازیابی به پایان رسیده است.")

        user = get_object_or_404(User, mobile=mobile)
        user.set_password(new_password)
        user.save(update_fields=["password"])

        otp_obj.is_used = True
        otp_obj.save(update_fields=["is_used"])
        return api_success(message="رمز عبور با موفقیت تغییر کرد.")


class StaffListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        owner = (
            request.user
            if request.user.role == User.Role.OWNER
            else request.user.owner
        )
        if not owner:
            return api_success([])

        members = [owner] + list(
            User.objects.filter(owner=owner).order_by("-created_at")
        )
        data = [
            {
                "id": str(m.id),
                "name": m.full_name or "بدون نام",
                "lastName": "",
                "mobile": m.mobile,
                "role": m.role,
                "isActive": m.is_active,
                "createdAt": (
                    m.created_at.isoformat() if m.created_at else None
                ),
            }
            for m in members
        ]
        return api_success(data)

    def post(self, request):
        if request.user.role != User.Role.OWNER:
            return api_error(
                "فقط مدیر کل می‌تواند عضو جدید اضافه کند.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error("ابتدا اطلاعات مجموعه خود را ثبت کنید.")

        first_name = str(request.data.get("name", "")).strip()
        last_name = str(request.data.get("lastName", "")).strip()
        full_name = f"{first_name} {last_name}".replace("-", "").strip()
        mobile = str(request.data.get("mobile", "")).strip()
        password = str(request.data.get("password", "")).strip()
        role = str(request.data.get("role", "")).strip().lower()

        allowed_roles = [
            User.Role.CASHIER,
            User.Role.KITCHEN,
            User.Role.WAITER,
        ]
        if role not in allowed_roles:
            return api_error("نقش انتخاب‌شده معتبر نیست.")

        if not full_name or len(mobile) != 11 or len(password) < 6:
            return api_error(
                "نام، موبایل ۱۱ رقمی و رمز حداقل ۶ کاراکتری الزامی است."
            )

        if User.objects.filter(mobile=mobile).exists():
            return api_error("این شماره موبایل قبلاً در سیستم ثبت شده است.")

        staff_user = User.objects.create_user(
            mobile=mobile,
            password=password,
            full_name=full_name,
            role=role,
            owner=request.user,
            is_active=True,
        )

        return api_success(
            {
                "id": str(staff_user.id),
                "name": staff_user.full_name,
                "lastName": "",
                "mobile": staff_user.mobile,
                "role": staff_user.role,
                "isActive": staff_user.is_active,
                "createdAt": staff_user.created_at.isoformat(),
            },
            message="همکار جدید با موفقیت اضافه شد.",
            status_code=status.HTTP_201_CREATED,
        )


class StaffToggleActiveView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, staff_id):
        if request.user.role != User.Role.OWNER:
            return api_error(
                "فقط مدیر کل می‌تواند وضعیت پرسنل را تغییر دهد.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        staff_user = get_object_or_404(User, id=staff_id, owner=request.user)
        staff_user.is_active = not staff_user.is_active
        staff_user.save(update_fields=["is_active"])

        return api_success(
            {
                "id": str(staff_user.id),
                "isActive": staff_user.is_active,
            },
            message="وضعیت همکار بروزرسانی شد.",
        )


class TeamListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != User.Role.OWNER:
            return api_error(
                "دسترسی غیرمجاز.", status_code=status.HTTP_403_FORBIDDEN
            )
        members = User.objects.filter(owner=request.user).order_by(
            "-created_at"
        )
        serializer = TeamMemberSerializer(members, many=True)
        return api_success(serializer.data)

    def post(self, request):
        if request.user.role != User.Role.OWNER:
            return api_error(
                "دسترسی غیرمجاز.", status_code=status.HTTP_403_FORBIDDEN
            )
        serializer = TeamMemberSerializer(
            data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            return api_error("خطا در ثبت عضو جدید.", serializer.errors)
        serializer.save()
        return api_success(
            serializer.data,
            message="عضو جدید اضافه شد.",
            status_code=status.HTTP_201_CREATED,
        )


class TeamDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, member_id):
        if request.user.role != User.Role.OWNER:
            return api_error(
                "دسترسی غیرمجاز.", status_code=status.HTTP_403_FORBIDDEN
            )
        member = get_object_or_404(User, id=member_id, owner=request.user)
        serializer = TeamMemberSerializer(
            member, data=request.data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            return api_error("خطا در ویرایش اطلاعات.", serializer.errors)
        serializer.save()
        return api_success(serializer.data, message="اطلاعات عضو ویرایش شد.")

    def delete(self, request, member_id):
        if request.user.role != User.Role.OWNER:
            return api_error(
                "دسترسی غیرمجاز.", status_code=status.HTTP_403_FORBIDDEN
            )
        member = get_object_or_404(User, id=member_id, owner=request.user)
        member.delete()
        return api_success(message="عضو تیم حذف شد.")


class TeamToggleActiveView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, member_id):
        if request.user.role != User.Role.OWNER:
            return api_error(
                "دسترسی غیرمجاز.", status_code=status.HTTP_403_FORBIDDEN
            )
        member = get_object_or_404(User, id=member_id, owner=request.user)
        member.is_active = not member.is_active
        member.save()
        return api_success(
            {"id": str(member.id), "isActive": member.is_active},
            message="وضعیت کارمند تغییر کرد.",
        )