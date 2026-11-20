from django.apps import AppConfig
from django.db.models.signals import post_migrate


def create_default_billing_data(sender, **kwargs):
    from .models import SubscriptionPlan, PaymentCardSetting

    if not PaymentCardSetting.objects.exists():
        PaymentCardSetting.objects.create(
            card_number="6219861944703734",
            card_holder="زهرا محمدولی",
            bank_name="بانک سامان",
            is_active=True,
        )

    if SubscriptionPlan.objects.exists():
        return

    default_plans = [
        {
            "name": "اشتراک ۳ ماهه",
            "duration_months": 3,
            "duration_days": 90,
            "price": 890000,
            "description": "مناسب برای شروع هوشمندسازی کافه و رستوران با تمامی امکانات پایه و منوی دیجیتال.",
            "features": "منوی دیجیتال نامحدود\nتولید QR Code اختصاصی میزها\nپنل مدیریت سفارشات و آشپزخانه",
            "icon": "Package",
            "badge_text": "",
            "is_popular": False,
            "sort_order": 1,
        },
        {
            "name": "اشتراک ۶ ماهه",
            "duration_months": 6,
            "duration_days": 180,
            "price": 1590000,
            "description": "محبوب‌ترین انتخاب مجموعه‌ها با صرفه‌جویی اقتصادی و دسترسی کامل به پنل پرسنل و باشگاه مشتریان.",
            "features": "تمامی امکانات پلن ۳ ماهه\nمدیریت نامحدود تیم و پرسنل\nمنوی دوزبانه (فارسی و انگلیسی)\nپشتیبانی اولویت‌دار",
            "icon": "Store",
            "badge_text": "پیشنهاد ویژه",
            "is_popular": True,
            "sort_order": 2,
        },
        {
            "name": "اشتراک ۹ ماهه",
            "duration_months": 9,
            "duration_days": 270,
            "price": 2190000,
            "description": "به‌صرفه‌ترین پکیج بلندمدت برای مجموعه‌های حرفه‌ای با بیشترین تخفیف دوره.",
            "features": "تمامی امکانات پلن ۶ ماهه\nبیشترین تخفیف نسبت به تمدید دوره‌ای\nگزارش‌های تحلیلی فروش و عملکرد\nمشاوره اختصاصی راه‌اندازی",
            "icon": "Crown",
            "badge_text": "اقتصادی‌ترین",
            "is_popular": False,
            "sort_order": 3,
        },
    ]

    for plan_data in default_plans:
        SubscriptionPlan.objects.create(**plan_data)


class BillingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.billing"
    verbose_name = "مالی، کیف پول و اشتراک‌ها"

    def ready(self):
        post_migrate.connect(create_default_billing_data, sender=self)