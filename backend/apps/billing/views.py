from datetime import timedelta
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated , AllowAny
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.common.responses import api_success, api_error
from apps.restaurants.views import get_user_restaurant
from .models import (
    Wallet,
    WalletTransaction,
    SubscriptionPlan,
    UserSubscription,
    PaymentCardSetting,
)
from .serializers import (
    WalletTransactionSerializer,
    SubscriptionPlanSerializer,
    UserSubscriptionSerializer,
)


DESTINATION_CARD = {
    "cardNumber": "6219861944703734",
    "cardHolder": "زهرا محمدولی",
    "bankName": "بانک سامان",
}


def ensure_default_subscription_plans():
    if SubscriptionPlan.objects.exists():
        return

    defaults = [
        {
            "tier": SubscriptionPlan.Tier.BASIC,
            "name": "پایه",
            "duration_months": 3,
            "duration_days": 90,
            "price": 450000,
            "price_3m": 450000,
            "price_6m": 800000,
            "price_9m": 1100000,
            "description": "شروعی عالی برای کافه‌ها و مجموعه‌های کوچک.",
            "features": (
                "ثبت تا ۵۰ آیتم منو\n"
                "قالب منوی دیجیتال هوشمند\n"
                "ساخت بارکد QR اختصاصی میزها\n"
                "پشتیبانی آنلاین"
            ),
            "icon": "Package",
            "badge_text": "",
            "is_popular": False,
            "sort_order": 1,
        },
        {
            "tier": SubscriptionPlan.Tier.STANDARD,
            "name": "استاندارد",
            "duration_months": 3,
            "duration_days": 90,
            "price": 750000,
            "price_3m": 750000,
            "price_6m": 1400000,
            "price_9m": 2000000,
            "description": "ایده‌آل برای رستوران‌های رو به رشد با سفارش‌گیری زنده.",
            "features": (
                "ثبت آیتم و دسته‌بندی بی‌نهایت\n"
                "شخصی‌سازی کامل رنگ، لوگو و قالب منو\n"
                "سیستم رزرو آنلاین و وضعیت زنده میزها\n"
                "درگاه پرداخت اختصاصی و کیف پول"
            ),
            "icon": "Store",
            "badge_text": "محبوب‌ترین انتخاب",
            "is_popular": True,
            "sort_order": 2,
        },
        {
            "tier": SubscriptionPlan.Tier.PLUS,
            "name": "پلاس",
            "duration_months": 3,
            "duration_days": 90,
            "price": 1200000,
            "price_3m": 1200000,
            "price_6m": 2200000,
            "price_9m": 3100000,
            "description": "امکانات کامل برای مجموعه‌های حرفه‌ای، صنعتی و شعب.",
            "features": (
                "تمامی امکانات پلن استاندارد\n"
                "پنل زنده آشپزخانه (KDS) و مراحل پخت\n"
                "تعریف نقش‌های پرسنل (صندوق‌دار، سرآشپز، گارسون)\n"
                "گزارشات جامع مالی و چاپ صورت‌حساب رسمی"
            ),
            "icon": "Crown",
            "badge_text": "کامل‌ترین بسته",
            "is_popular": False,
            "sort_order": 3,
        },
    ]

    for item in defaults:
        SubscriptionPlan.objects.create(**item)


def get_or_create_user_wallet(user):
    target_owner = user if user.role == User.Role.OWNER else user.owner
    if not target_owner:
        return None
    wallet, _ = Wallet.objects.get_or_create(user=target_owner)
    return wallet


class WalletDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet = get_or_create_user_wallet(request.user)
        if not wallet:
            return api_error("کیف پول یافت نشد.", status_code=status.HTTP_404_NOT_FOUND)

        active_card = PaymentCardSetting.objects.filter(is_active=True).first()
        card_data = (
            {
                "cardNumber": active_card.card_number,
                "cardHolder": active_card.card_holder,
                "bankName": active_card.bank_name,
            }
            if active_card
            else DESTINATION_CARD
        )

        return api_success(
            {
                "balance": wallet.balance,
                **card_data,
            }
        )


class WalletTransactionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet = get_or_create_user_wallet(request.user)
        if not wallet:
            return api_error("کیف پول یافت نشد.", status_code=status.HTTP_404_NOT_FOUND)

        transactions = wallet.transactions.all()
        serializer = WalletTransactionSerializer(transactions, many=True)
        return api_success(serializer.data)


class WalletTopUpReceiptView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if request.user.role != User.Role.OWNER:
            return api_error(
                "فقط مدیر مجموعه می‌تواند کیف پول را شارژ کند.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        wallet = get_or_create_user_wallet(request.user)
        if not wallet:
            return api_error("کیف پول یافت نشد.", status_code=status.HTTP_404_NOT_FOUND)

        raw_amount = str(request.data.get("amount", "")).strip()
        try:
            amount = int(raw_amount)
        except ValueError:
            return api_error("مبلغ وارد شده معتبر نیست.")

        if amount < 10000:
            return api_error("حداقل مبلغ شارژ ۱۰,۰۰۰ تومان می‌باشد.")

        receipt_file = request.FILES.get("receipt") or request.FILES.get("file")
        if not receipt_file:
            return api_error("لطفاً تصویر رسید واریزی را آپلود کنید.")

        if receipt_file.size > 10 * 1024 * 1024:
            return api_error("حجم فایل رسید نباید بیشتر از ۱۰ مگابایت باشد.")

        tx = WalletTransaction.objects.create(
            wallet=wallet,
            amount=amount,
            type=WalletTransaction.TxType.DEPOSIT,
            status=WalletTransaction.Status.PENDING,
            receipt_image=receipt_file,
            description="شارژ کیف پول (کارت به کارت)",
        )

        return api_success(
            WalletTransactionSerializer(tx).data,
            message="رسید واریزی ثبت شد و پس از تایید ادمین به موجودی شما اضافه می‌شود.",
            status_code=status.HTTP_201_CREATED,
        )


class SubscriptionPlanListView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        ensure_default_subscription_plans()
        plans = SubscriptionPlan.objects.filter(is_active=True)
        serializer = SubscriptionPlanSerializer(plans, many=True)
        return api_success(serializer.data)


class CurrentSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "برای مشاهده اشتراک‌ها، ابتدا باید اطلاعات مجموعه خود را ثبت کنید.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        target_owner = (
            request.user if request.user.role == User.Role.OWNER else request.user.owner
        )
        wallet = get_or_create_user_wallet(request.user)
        wallet_balance = wallet.balance if wallet else 0

        sub = UserSubscription.objects.filter(user=target_owner).first()
        if not sub:
            return api_success(
                {
                    "hasSubscription": False,
                    "walletBalance": wallet_balance,
                }
            )

        data = UserSubscriptionSerializer(sub).data
        data["hasSubscription"] = True
        data["walletBalance"] = wallet_balance
        return api_success(data)


class PurchaseSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != User.Role.OWNER:
            return api_error(
                "فقط مدیر مجموعه می‌تواند اشتراک خریداری کند.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "ابتدا اطلاعات مجموعه خود را ثبت کنید.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        plan_id = request.data.get("planId")
        if not plan_id:
            return api_error("شناسه پلن انتخاب‌شده ارسال نشده است.")

        plan = get_object_or_404(SubscriptionPlan, id=plan_id, is_active=True)

        raw_months = request.data.get("durationMonths")
        if raw_months is not None and str(raw_months).strip() != "":
            try:
                duration_months = int(raw_months)
            except (TypeError, ValueError):
                return api_error("مدت زمان اشتراک نامعتبر است.")
            if duration_months not in (3, 6, 9):
                return api_error("مدت اشتراک فقط می‌تواند ۳، ۶ یا ۹ ماهه باشد.")
        else:
            duration_months = (
                plan.duration_months if plan.duration_months in (3, 6, 9) else 3
            )

        charge_amount = plan.get_price_for_months(duration_months)
        duration_days = duration_months * 30
        plan_display_name = f"پلن {plan.name} ({duration_months} ماهه)"

        if charge_amount <= 0:
            return api_error("مبلغ این دوره برای پلن انتخاب‌شده تنظیم نشده است.")

        with transaction.atomic():
            wallet, _ = Wallet.objects.select_for_update().get_or_create(
                user=request.user
            )

            if wallet.balance < charge_amount:
                shortage = charge_amount - wallet.balance
                return api_error(
                    f"موجودی کیف پول شما کافی نیست (کمبود: {shortage:,} تومان). لطفاً ابتدا حساب خود را شارژ کنید.",
                    data={
                        "insufficientBalance": True,
                        "requiredAmount": charge_amount,
                        "currentBalance": wallet.balance,
                        "shortage": shortage,
                    },
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            wallet.balance -= charge_amount
            wallet.save(update_fields=["balance", "updated_at"])

            tx = WalletTransaction.objects.create(
                wallet=wallet,
                amount=charge_amount,
                type=WalletTransaction.TxType.PAYMENT,
                status=WalletTransaction.Status.SUCCESS,
                description=f"خرید {plan_display_name}",
            )

            now = timezone.now()
            sub = UserSubscription.objects.filter(user=request.user).first()
            if sub and sub.expire_date > now:
                remaining_days = max(0, (sub.expire_date - now).days)
                sub.plan = plan
                sub.plan_name = plan_display_name
                sub.expire_date = sub.expire_date + timedelta(days=duration_days)
                sub.total_days = remaining_days + duration_days
                sub.is_trial = False
                sub.save()
            elif sub:
                sub.plan = plan
                sub.plan_name = plan_display_name
                sub.started_at = now
                sub.expire_date = now + timedelta(days=duration_days)
                sub.total_days = duration_days
                sub.is_trial = False
                sub.save()
            else:
                sub = UserSubscription.objects.create(
                    user=request.user,
                    plan=plan,
                    plan_name=plan_display_name,
                    started_at=now,
                    expire_date=now + timedelta(days=duration_days),
                    total_days=duration_days,
                    is_trial=False,
                )

        sub_data = UserSubscriptionSerializer(sub).data
        sub_data["hasSubscription"] = True
        sub_data["walletBalance"] = wallet.balance

        return api_success(
            {
                "subscription": sub_data,
                "walletBalance": wallet.balance,
                "transaction": WalletTransactionSerializer(tx).data,
            },
            message=f"{plan_display_name} با موفقیت فعال شد!",
        )