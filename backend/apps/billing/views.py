from datetime import timedelta
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
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
    permission_classes = [IsAuthenticated]

    def get(self, request):
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

        with transaction.atomic():
            wallet, _ = Wallet.objects.select_for_update().get_or_create(
                user=request.user
            )

            if wallet.balance < plan.price:
                shortage = plan.price - wallet.balance
                return api_error(
                    f"موجودی کیف پول شما کافی نیست (کمبود: {shortage:,} تومان). لطفاً ابتدا حساب خود را شارژ کنید.",
                    data={
                        "insufficientBalance": True,
                        "requiredAmount": plan.price,
                        "currentBalance": wallet.balance,
                        "shortage": shortage,
                    },
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            wallet.balance -= plan.price
            wallet.save(update_fields=["balance", "updated_at"])

            tx = WalletTransaction.objects.create(
                wallet=wallet,
                amount=plan.price,
                type=WalletTransaction.TxType.PAYMENT,
                status=WalletTransaction.Status.SUCCESS,
                description=f"خرید {plan.name} ({plan.duration_months} ماهه)",
            )

            now = timezone.now()
            sub = UserSubscription.objects.filter(user=request.user).first()
            if sub and sub.expire_date > now:
                remaining_days = max(0, (sub.expire_date - now).days)
                sub.plan = plan
                sub.plan_name = plan.name
                sub.expire_date = sub.expire_date + timedelta(days=plan.duration_days)
                sub.total_days = remaining_days + plan.duration_days
                sub.is_trial = False
                sub.save()
            elif sub:
                sub.plan = plan
                sub.plan_name = plan.name
                sub.started_at = now
                sub.expire_date = now + timedelta(days=plan.duration_days)
                sub.total_days = plan.duration_days
                sub.is_trial = False
                sub.save()
            else:
                sub = UserSubscription.objects.create(
                    user=request.user,
                    plan=plan,
                    plan_name=plan.name,
                    started_at=now,
                    expire_date=now + timedelta(days=plan.duration_days),
                    total_days=plan.duration_days,
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
            message=f"{plan.name} با موفقیت فعال شد!",
        )