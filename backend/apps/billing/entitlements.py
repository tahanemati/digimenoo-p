import math
from datetime import timedelta
from django.utils import timezone
from apps.accounts.models import User
from apps.billing.models import SubscriptionPlan, UserSubscription


TIER_LABELS = {
    "none": "بدون اشتراک فعال",
    "basic": "پایه",
    "standard": "استاندارد",
    "plus": "پلاس",
}

TIER_ENTITLEMENTS = {
    "none": {
        "max_templates": 0,
        "allowed_templates": [],
        "features": {
            "bilingual": False,
            "onlineOrdering": False,
            "teamManagement": False,
            "callWaiter": False,
            "callChef": False,
            "reservations": False,
            "kitchenPanel": False,
            "financialReports": False,
        },
    },
    "basic": {
        "max_templates": 3,
        "allowed_templates": [f"template_{i}" for i in range(1, 4)],
        "features": {
            "bilingual": False,
            "onlineOrdering": False,
            "teamManagement": False,
            "callWaiter": False,
            "callChef": False,
            "reservations": False,
            "kitchenPanel": True,
            "financialReports": True,
        },
    },
    "standard": {
        "max_templates": 6,
        "allowed_templates": [f"template_{i}" for i in range(1, 7)],
        "features": {
            "bilingual": True,
            "onlineOrdering": True,
            "teamManagement": False,
            "callWaiter": True,
            "callChef": True,
            "reservations": True,
            "kitchenPanel": True,
            "financialReports": True,
        },
    },
    "plus": {
        "max_templates": 15,
        "allowed_templates": [f"template_{i}" for i in range(1, 16)],
        "features": {
            "bilingual": True,
            "onlineOrdering": True,
            "teamManagement": True,
            "callWaiter": True,
            "callChef": True,
            "reservations": True,
            "kitchenPanel": True,
            "financialReports": True,
        },
    },
}


def ensure_default_subscription_plans():
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
                "دسترسی به ۳ قالب اول منو\n"
                "پنل زنده آشپزخانه (KDS)\n"
                "گزارشات مالی و فروش\n"
                "ساخت بارکد QR اختصاصی میزها"
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
                "دسترسی به ۶ قالب اول منو\n"
                "قابلیت سفارش‌دهی آنلاین از منو\n"
                "منوی دو زبانه (فارسی و انگلیسی)\n"
                "سیستم رزرو آنلاین میزها\n"
                "قابلیت درخواست گارسون و سرآشپز\n"
                "پنل آشپزخانه (KDS) و گزارشات مالی"
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
                "دسترسی کامل به هر ۱۵ قالب اختصاصی منو\n"
                "سیستم تیم‌بندی و تعریف نقش پرسنل\n"
                "تمامی امکانات پلن استاندارد (سفارش، رزرو، دوزبانه، گارسون و سرآشپز)\n"
                "پنل زنده آشپزخانه (KDS) و گزارشات جامع مالی"
            ),
            "icon": "Crown",
            "badge_text": "کامل‌ترین بسته",
            "is_popular": False,
            "sort_order": 3,
        },
    ]

    for item in defaults:
        if not SubscriptionPlan.objects.filter(tier=item["tier"]).exists():
            SubscriptionPlan.objects.create(**item)


def get_target_owner(user):
    if not user or not getattr(user, "is_authenticated", False):
        return None
    return user if user.role == User.Role.OWNER else user.owner


def normalize_template_code(code: str) -> str:
    cleaned = str(code or "").strip().lower().replace("-", "_").replace(" ", "_")
    if cleaned.isdigit():
        return f"template_{cleaned}"
    if cleaned.startswith("template") and not cleaned.startswith("template_"):
        suffix = cleaned.replace("template", "", 1)
        if suffix.isdigit():
            return f"template_{suffix}"
    return cleaned or "template_1"


def get_template_required_tier(template_code: str) -> str:
    code = normalize_template_code(template_code)
    try:
        num = int(code.split("_")[-1])
    except (ValueError, IndexError):
        return "plus"

    if num <= 3:
        return "basic"
    if num <= 6:
        return "standard"
    return "plus"


def get_owner_subscription(owner):
    if not owner:
        return None
    return (
        UserSubscription.objects.select_related("plan")
        .filter(user=owner)
        .first()
    )


def get_entitlements_for_owner(owner):
    now = timezone.now()
    sub = get_owner_subscription(owner)

    is_revoked = bool(sub and sub.is_revoked)
    is_expired = bool(sub and sub.expire_date <= now)
    is_active = bool(sub and not is_revoked and not is_expired)

    if is_active:
        if sub.plan and sub.plan.tier:
            tier = str(sub.plan.tier).strip().lower()
        elif sub.is_trial:
            tier = SubscriptionPlan.Tier.PLUS
        else:
            tier = SubscriptionPlan.Tier.BASIC

        remaining_seconds = max(0, (sub.expire_date - now).total_seconds())
        days_remaining = math.ceil(remaining_seconds / 86400)
    else:
        tier = "none"
        days_remaining = 0

    spec = TIER_ENTITLEMENTS.get(tier, TIER_ENTITLEMENTS["none"])

    return {
        "hasSubscription": bool(sub),
        "hasActiveSubscription": is_active,
        "isActive": is_active,
        "isTrial": bool(sub.is_trial) if sub else False,
        "isRevoked": is_revoked,
        "isExpired": is_expired,
        "tier": tier,
        "tierLabel": TIER_LABELS.get(tier, ""),
        "planName": sub.plan_name if sub else "",
        "expireDate": sub.expire_date.isoformat() if sub else None,
        "daysRemaining": days_remaining,
        "maxTemplates": spec["max_templates"],
        "allowedTemplates": list(spec["allowed_templates"]),
        "features": dict(spec["features"]),
    }


def get_user_entitlements(user):
    return get_entitlements_for_owner(get_target_owner(user))


def owner_has_feature(owner, feature_key: str) -> bool:
    ent = get_entitlements_for_owner(owner)
    return bool(ent["features"].get(feature_key, False))


def user_has_feature(user, feature_key: str) -> bool:
    return owner_has_feature(get_target_owner(user), feature_key)


def owner_can_use_template(owner, template_code: str) -> bool:
    ent = get_entitlements_for_owner(owner)
    code = normalize_template_code(template_code)
    return code in ent["allowedTemplates"]


def grant_trial_subscription(user, days: int = 7):
    """اعطای ۷ روز اشتراک رایگان پلن پلاس برای مالکین جدید (فقط یک‌بار برای هر کاربر)."""
    if not user or user.role != User.Role.OWNER:
        return None

    existing = UserSubscription.objects.filter(user=user).first()
    if existing:
        return existing

    ensure_default_subscription_plans()
    plus_plan = SubscriptionPlan.objects.filter(
        tier=SubscriptionPlan.Tier.PLUS
    ).first()
    now = timezone.now()
    return UserSubscription.objects.create(
        user=user,
        plan=plus_plan,
        plan_name=f"دوره آزمایشی رایگان پلاس ({days} روزه)",
        started_at=now,
        expire_date=now + timedelta(days=days),
        total_days=days,
        is_trial=True,
        is_revoked=False,
    )


def grant_admin_subscription(owner, tier: str, days: int = 90, is_trial: bool = False):
    """اعطای دستی اشتراک به یک مالک/رستوران توسط ادمین."""
    ensure_default_subscription_plans()
    plan = SubscriptionPlan.objects.filter(tier=tier).first()
    if not plan:
        return None

    now = timezone.now()
    label = (
        f"دوره آزمایشی {plan.name} ({days} روزه)"
        if is_trial
        else f"پلن {plan.name} ({days} روزه - اعطای ادمین)"
    )

    sub, _ = UserSubscription.objects.update_or_create(
        user=owner,
        defaults={
            "plan": plan,
            "plan_name": label,
            "started_at": now,
            "expire_date": now + timedelta(days=days),
            "total_days": days,
            "is_trial": is_trial,
            "is_revoked": False,
        },
    )
    return sub


def revoke_owner_subscription(owner):
    """خلع/لغو فوری اشتراک توسط ادمین بدون پاک کردن تاریخچه."""
    sub = UserSubscription.objects.filter(user=owner).first()
    if not sub:
        return None
    now = timezone.now()
    sub.is_revoked = True
    if sub.expire_date > now:
        sub.expire_date = now
    sub.save(update_fields=["is_revoked", "expire_date", "updated_at"])
    return sub