import uuid
from django.conf import settings
from django.db import models, transaction
from django.utils import timezone


class Wallet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wallet",
    )
    balance = models.PositiveBigIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"کیف پول {self.user.mobile} - موجودی: {self.balance:,} تومان"


class WalletTransaction(models.Model):
    class TxType(models.TextChoices):
        DEPOSIT = "deposit", "واریز / شارژ کیف پول"
        PAYMENT = "payment", "پرداخت / خرید اشتراک"
        WITHDRAWAL = "withdrawal", "برداشت"

    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار تایید ادمین"
        SUCCESS = "success", "موفق (تایید شده)"
        FAILED = "failed", "ناموفق / رد شده"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    amount = models.PositiveBigIntegerField()
    type = models.CharField(
        max_length=20,
        choices=TxType.choices,
        default=TxType.DEPOSIT,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    receipt_image = models.ImageField(
        upload_to="wallet/receipts/%Y/%m/",
        blank=True,
        null=True,
        verbose_name="تصویر رسید واریزی",
    )
    description = models.CharField(max_length=255, blank=True, default="")
    admin_note = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="توضیح ادمین (در صورت رد رسید)",
    )
    is_credited = models.BooleanField(default=False, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "تراکنش کیف پول"
        verbose_name_plural = "تراکنش‌های کیف پول"

    def save(self, *args, **kwargs):
        with transaction.atomic():
            if self.type == self.TxType.DEPOSIT:
                if self.status == self.Status.SUCCESS and not self.is_credited:
                    Wallet.objects.filter(pk=self.wallet_id).update(
                        balance=models.F("balance") + self.amount
                    )
                    self.is_credited = True
                elif self.status != self.Status.SUCCESS and self.is_credited:
                    Wallet.objects.filter(
                        pk=self.wallet_id, balance__gte=self.amount
                    ).update(balance=models.F("balance") - self.amount)
                    self.is_credited = False

            super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.wallet.user.mobile} | {self.amount:,} تومان | {self.get_status_display()}"


class SubscriptionPlan(models.Model):
    class Tier(models.TextChoices):
        BASIC = "basic", "پایه (Basic)"
        STANDARD = "standard", "استاندارد (Standard)"
        PLUS = "plus", "پلاس (Plus)"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tier = models.CharField(
        max_length=20,
        choices=Tier.choices,
        default=Tier.BASIC,
        verbose_name="سطح پلن",
    )
    name = models.CharField(max_length=120, verbose_name="نام پلن")
    duration_months = models.PositiveIntegerField(
        default=3, verbose_name="مدت پیش‌فرض (ماه)"
    )
    duration_days = models.PositiveIntegerField(
        default=90, verbose_name="مدت پیش‌فرض (روز)"
    )
    price = models.PositiveBigIntegerField(
        default=0, verbose_name="قیمت پایه / ۳ ماهه (تومان)"
    )
    price_3m = models.PositiveBigIntegerField(
        default=0, verbose_name="قیمت ۳ ماهه (تومان)"
    )
    price_6m = models.PositiveBigIntegerField(
        default=0, verbose_name="قیمت ۶ ماهه (تومان)"
    )
    price_9m = models.PositiveBigIntegerField(
        default=0, verbose_name="قیمت ۹ ماهه (تومان)"
    )
    description = models.TextField(
        blank=True, default="", verbose_name="توضیحات کوتاه پلن"
    )
    features = models.TextField(
        blank=True,
        default="",
        verbose_name="ویژگی‌ها (هر ویژگی در یک خط)",
    )
    icon = models.CharField(
        max_length=50,
        default="Store",
        verbose_name="نام آیکون (Package / Store / Crown)",
    )
    badge_text = models.CharField(
        max_length=60,
        blank=True,
        default="",
        verbose_name="متن برچسب (مثلاً: محبوب‌ترین انتخاب)",
    )
    is_popular = models.BooleanField(
        default=False, verbose_name="پلن ویژه (هایلایت نارنجی)"
    )
    is_active = models.BooleanField(default=True, verbose_name="فعال برای نمایش")
    sort_order = models.PositiveIntegerField(default=0, verbose_name="ترتیب نمایش")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "price_3m", "price"]
        verbose_name = "پلن اشتراک"
        verbose_name_plural = "پلن‌های اشتراک"

    def save(self, *args, **kwargs):
        if self.price_3m == 0 and self.price > 0:
            self.price_3m = self.price
        elif self.price == 0 and self.price_3m > 0:
            self.price = self.price_3m
        super().save(*args, **kwargs)

    def get_price_for_months(self, months: int) -> int:
        if months == 3 and self.price_3m > 0:
            return int(self.price_3m)
        if months == 6 and self.price_6m > 0:
            return int(self.price_6m)
        if months == 9 and self.price_9m > 0:
            return int(self.price_9m)
        if self.duration_months == months and self.price > 0:
            return int(self.price)
        base_3m = self.price_3m if self.price_3m > 0 else self.price
        multiplier = max(months // 3, 1)
        return int(base_3m * multiplier)

    def __str__(self):
        return f"{self.name} ({self.get_tier_display()})"


class UserSubscription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription",
        verbose_name="مالک مجموعه",
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subscriptions",
        verbose_name="پلن انتخاب‌شده",
    )
    plan_name = models.CharField(
        max_length=120, blank=True, default="", verbose_name="نام پلن"
    )
    total_days = models.PositiveIntegerField(
        default=90, verbose_name="کل روزهای دوره"
    )
    is_trial = models.BooleanField(default=False, verbose_name="نسخه آزمایشی")
    started_at = models.DateTimeField(
        default=timezone.now, verbose_name="تاریخ شروع"
    )
    expire_date = models.DateTimeField(verbose_name="تاریخ انقضا")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "اشتراک کاربر"
        verbose_name_plural = "اشتراک‌های کاربران"

    def __str__(self):
        return f"{self.user.mobile} - {self.plan_name}"


class PaymentCardSetting(models.Model):
    card_number = models.CharField(
        max_length=20, verbose_name="شماره کارت (۱۶ رقم بدون خط تیره)"
    )
    card_holder = models.CharField(
        max_length=120, verbose_name="نام و نام خانوادگی صاحب کارت"
    )
    bank_name = models.CharField(
        max_length=80, default="بانک سامان", verbose_name="نام بانک"
    )
    is_active = models.BooleanField(
        default=True, verbose_name="کارت فعال برای نمایش به کاربران"
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین بروزرسانی")

    class Meta:
        verbose_name = "شماره کارت واریز"
        verbose_name_plural = "شماره کارت‌های واریز"

    def save(self, *args, **kwargs):
        self.card_number = "".join(ch for ch in str(self.card_number) if ch.isdigit())
        if self.is_active:
            PaymentCardSetting.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.card_holder} - {self.card_number} ({self.bank_name})"