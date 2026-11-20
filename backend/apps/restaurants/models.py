import uuid
from django.conf import settings
from django.db import models


class Restaurant(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "در حال بررسی"
        APPROVED = "approved", "تایید شده"
        REJECTED = "rejected", "رد شده"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="restaurants",
    )

    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=150, unique=True, allow_unicode=False)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.APPROVED,  # برای تست سریع در لوکال؛ از پنل ادمین قابل تغییر است
    )

    # اطلاعات تکمیلی مجموعه
    city = models.CharField(max_length=100, blank=True, default="")
    table_count = models.PositiveIntegerField(default=0)
    phone = models.CharField(max_length=20, blank=True, default="")
    address = models.TextField(blank=True, default="")

    # تنظیمات منو و خدمات
    ordering_enabled = models.BooleanField(default=True)
    bilingual = models.BooleanField(default=False)
    call_waiter_enabled = models.BooleanField(default=True)
    call_chef_enabled = models.BooleanField(default=True)
    about_us_fa = models.TextField(blank=True, default="")
    about_us_en = models.TextField(blank=True, default="")

    # برندینگ و قالب (پشتیبانی از template_1 تا template_15)
    logo = models.ImageField(
        upload_to="restaurants/logos/%Y/%m/",
        blank=True,
        null=True,
    )
    logo_url = models.CharField(max_length=500, blank=True, default="")
    theme = models.CharField(max_length=50, default="template_1")

    # آمار بازدید
    live_views = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_logo_url(self):
        if self.logo:
            return self.logo.url
        return self.logo_url or ""

    def __str__(self):
        return f"{self.name} ({self.slug})"