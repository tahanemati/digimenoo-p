from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Wallet,
    WalletTransaction,
    SubscriptionPlan,
    UserSubscription,
    PaymentCardSetting,
)


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("user", "formatted_balance", "updated_at")
    search_fields = ("user__mobile", "user__full_name")

    @admin.display(description="موجودی فعلی")
    def formatted_balance(self, obj):
        return f"{obj.balance:,} تومان"


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "user_info",
        "formatted_amount",
        "type",
        "status",
        "receipt_thumbnail",
        "created_at",
    )
    list_filter = ("status", "type", "created_at")
    search_fields = ("wallet__user__mobile", "wallet__user__full_name", "description")
    readonly_fields = ("receipt_large_preview", "is_credited", "created_at", "updated_at")
    actions = ["approve_selected_transactions", "reject_selected_transactions"]

    @admin.display(description="کاربر")
    def user_info(self, obj):
        name = obj.wallet.user.full_name or "بدون نام"
        return f"{name} ({obj.wallet.user.mobile})"

    @admin.display(description="مبلغ")
    def formatted_amount(self, obj):
        return f"{obj.amount:,} تومان"

    @admin.display(description="تصویر رسید")
    def receipt_thumbnail(self, obj):
        if obj.receipt_image:
            return format_html(
                '<a href="{}" target="_blank"><img src="{}" style="width:52px;height:52px;object-fit:cover;border-radius:8px;border:1px solid #cbd5e1;" /></a>',
                obj.receipt_image.url,
                obj.receipt_image.url,
            )
        return "—"

    @admin.display(description="پیش‌نمایش بزرگ رسید")
    def receipt_large_preview(self, obj):
        if obj.receipt_image:
            return format_html(
                '<a href="{}" target="_blank"><img src="{}" style="max-width:360px;border-radius:12px;border:1px solid #cbd5e1;" /></a>',
                obj.receipt_image.url,
                obj.receipt_image.url,
            )
        return "فایلی آپلود نشده است"

    @admin.action(description="✅ تایید رسیدهای انتخاب‌شده و شارژ کیف پول")
    def approve_selected_transactions(self, request, queryset):
        count = 0
        for tx in queryset.filter(status=WalletTransaction.Status.PENDING):
            tx.status = WalletTransaction.Status.SUCCESS
            tx.save()
            count += 1
        self.message_user(request, f"{count} تراکنش تایید و به موجودی کیف پول اضافه شد.")

    @admin.action(description="❌ رد کردن رسیدهای انتخاب‌شده")
    def reject_selected_transactions(self, request, queryset):
        count = 0
        for tx in queryset.exclude(status=WalletTransaction.Status.FAILED):
            tx.status = WalletTransaction.Status.FAILED
            tx.save()
            count += 1
        self.message_user(request, f"{count} تراکنش رد شد.")


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "duration_months",
        "duration_days",
        "formatted_price",
        "is_popular",
        "is_active",
        "sort_order",
    )
    list_editable = ("is_popular", "is_active", "sort_order")
    search_fields = ("name", "description")

    @admin.display(description="قیمت")
    def formatted_price(self, obj):
        return f"{obj.price:,} تومان"


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "plan_name", "expire_date", "is_trial", "updated_at")
    search_fields = ("user__mobile", "user__full_name", "plan_name")
    list_filter = ("is_trial",)


@admin.register(PaymentCardSetting)
class PaymentCardSettingAdmin(admin.ModelAdmin):
    list_display = ("card_holder", "card_number", "bank_name", "is_active", "updated_at")
    list_editable = ("is_active",)