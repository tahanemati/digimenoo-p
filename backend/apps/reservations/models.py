import uuid
from django.db import models
from apps.restaurants.models import Restaurant


class TableReservation(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار تایید"
        CONFIRMED = "confirmed", "تایید شده"
        CANCELLED = "cancelled", "لغو شده"
        COMPLETED = "completed", "پایان یافته / آزاد شده"

    class Source(models.TextChoices):
        CUSTOMER = "customer", "ثبت از منوی دیجیتال"
        MANUAL = "manual", "ثبت دستی توسط مدیر"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="reservations",
        verbose_name="رستوران",
    )
    table_number = models.PositiveIntegerField(verbose_name="شماره میز")
    customer_name = models.CharField(
        max_length=150, verbose_name="نام و نام خانوادگی"
    )
    customer_mobile = models.CharField(max_length=20, verbose_name="شماره تماس")
    guests_count = models.PositiveIntegerField(
        default=2, verbose_name="تعداد نفرات"
    )
    reservation_time = models.CharField(
        max_length=50, blank=True, default="", verbose_name="ساعت رزرو"
    )
    notes = models.CharField(
        max_length=300, blank=True, default="", verbose_name="توضیحات"
    )
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.CUSTOMER,
        verbose_name="نحوه ثبت",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="وضعیت رزرو",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="زمان ثبت")
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="آخرین بروزرسانی"
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "رزرو میز"
        verbose_name_plural = "رزرو میزها"

    def __str__(self):
        return f"میز {self.table_number} - {self.customer_name} ({self.get_status_display()})"