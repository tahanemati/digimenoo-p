from django.contrib import admin
from django.utils.html import format_html
from apps.billing.entitlements import (
    get_entitlements_for_owner,
    grant_admin_subscription,
    revoke_owner_subscription,
)
from .models import Restaurant


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "slug",
        "owner",
        "status",
        "table_count",
        "theme",
        "subscription_badge",
        "created_at",
    )
    search_fields = ("name", "slug", "owner__mobile", "owner__full_name")
    list_filter = ("status", "theme", "bilingual", "ordering_enabled")
    actions = [
        "action_grant_trial_plus_7d",
        "action_grant_basic_3m",
        "action_grant_standard_3m",
        "action_grant_plus_3m",
        "action_revoke_subscription",
    ]

    @admin.display(description="وضعیت اشتراک")
    def subscription_badge(self, obj):
        ent = get_entitlements_for_owner(obj.owner)
        if ent["isRevoked"]:
            return format_html(
                '<span style="color:#dc2626;font-weight:bold;">خلع شده</span>'
            )
        if not ent["hasActiveSubscription"]:
            return format_html(
                '<span style="color:#6b7280;font-weight:bold;">منقضی / بدون اشتراک</span>'
            )

        color = (
            "#059669"
            if ent["tier"] == "plus"
            else "#2563eb" if ent["tier"] == "standard" else "#d97706"
        )
        trial_tag = " (تست)" if ent["isTrial"] else ""
        return format_html(
            '<span style="color:{};font-weight:bold;">{}{} ({} روز)</span>',
            color,
            ent["tierLabel"],
            trial_tag,
            ent["daysRemaining"],
        )

    @admin.action(description="اعطای ۷ روز اشتراک رایگان پلاس")
    def action_grant_trial_plus_7d(self, request, queryset):
        for r in queryset.select_related("owner"):
            grant_admin_subscription(r.owner, tier="plus", days=7, is_trial=True)
        self.message_user(
            request, "۷ روز اشتراک آزمایشی پلاس برای رستوران‌های انتخاب‌شده فعال شد."
        )

    @admin.action(description="اعطای پلن پایه (۳ ماهه)")
    def action_grant_basic_3m(self, request, queryset):
        for r in queryset.select_related("owner"):
            grant_admin_subscription(r.owner, tier="basic", days=90, is_trial=False)
        self.message_user(request, "پلن پایه (۹۰ روزه) برای رستوران‌های انتخاب‌شده فعال شد.")

    @admin.action(description="اعطای پلن استاندارد (۳ ماهه)")
    def action_grant_standard_3m(self, request, queryset):
        for r in queryset.select_related("owner"):
            grant_admin_subscription(
                r.owner, tier="standard", days=90, is_trial=False
            )
        self.message_user(
            request, "پلن استاندارد (۹۰ روزه) برای رستوران‌های انتخاب‌شده فعال شد."
        )

    @admin.action(description="اعطای پلن پلاس (۳ ماهه)")
    def action_grant_plus_3m(self, request, queryset):
        for r in queryset.select_related("owner"):
            grant_admin_subscription(r.owner, tier="plus", days=90, is_trial=False)
        self.message_user(request, "پلن پلاس (۹۰ روزه) برای رستوران‌های انتخاب‌شده فعال شد.")

    @admin.action(description="خلع / لغو اشتراک رستوران‌های انتخاب‌شده")
    def action_revoke_subscription(self, request, queryset):
        for r in queryset.select_related("owner"):
            revoke_owner_subscription(r.owner)
        self.message_user(request, "اشتراک رستوران‌های انتخاب‌شده خلع شد.")