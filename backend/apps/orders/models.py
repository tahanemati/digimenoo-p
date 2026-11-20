import uuid
from django.db import models
from apps.restaurants.models import Restaurant
from apps.menu.models import Product


class KitchenStage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="kitchen_stages",
        verbose_name="رستوران",
    )
    name = models.CharField(max_length=100, verbose_name="نام مرحله")
    description = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="توضیح مرحله (نمایش به مشتری)",
    )
    color = models.CharField(max_length=30, default="amber", verbose_name="رنگ")
    order_index = models.PositiveIntegerField(default=0, verbose_name="ترتیب")

    class Meta:
        ordering = ["order_index", "id"]
        verbose_name = "مرحله پخت"
        verbose_name_plural = "مراحل پخت آشپزخانه"

    def __str__(self):
        return f"{self.name} ({self.restaurant.name})"


def ensure_default_stages(restaurant: Restaurant):
    stages = list(
        KitchenStage.objects.filter(restaurant=restaurant).order_by(
            "order_index", "id"
        )
    )
    if not stages:
        defaults = [
            {
                "name": "در حال بررسی سفارش",
                "description": "سفارش شما با موفقیت ثبت شد",
                "color": "blue",
                "order_index": 0,
            },
            {
                "name": "در حال آماده‌سازی",
                "description": "سرآشپز مشغول آماده کردن سفارش شماست",
                "color": "amber",
                "order_index": 1,
            },
            {
                "name": "آماده تحویل به میز",
                "description": "سفارش آماده است و تا لحظاتی دیگر سرو می‌شود",
                "color": "emerald",
                "order_index": 2,
            },
        ]
        stages = [
            KitchenStage.objects.create(restaurant=restaurant, **item)
            for item in defaults
        ]
    return stages


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "در حال بررسی"
        PREPARING = "preparing", "در حال آماده‌سازی"
        READY = "ready", "آماده تحویل"
        COMPLETED = "completed", "تحویل شده / تسویه"
        CANCELLED = "cancelled", "لغو شده"

    class PaymentMethod(models.TextChoices):
        CASHIER = "cashier", "پرداخت در صندوق"
        ONLINE = "online", "پرداخت آنلاین"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "در انتظار تسویه"
        PAID = "paid", "تسویه شده"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.PositiveIntegerField(
        editable=False, default=1001, verbose_name="شماره پیگیری سفارش"
    )
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="orders",
        verbose_name="رستوران",
    )
    stage = models.ForeignKey(
        KitchenStage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
        verbose_name="مرحله فعلی آشپزخانه",
    )
    table_number = models.PositiveIntegerField(verbose_name="شماره میز")
    customer_name = models.CharField(
        max_length=120, blank=True, default="", verbose_name="نام مشتری"
    )
    customer_mobile = models.CharField(
        max_length=20, blank=True, default="", verbose_name="موبایل مشتری"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="وضعیت سفارش",
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASHIER,
        verbose_name="روش پرداخت",
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        verbose_name="وضعیت پرداخت",
    )
    total_price = models.PositiveBigIntegerField(
        default=0, verbose_name="مبلغ کل (تومان)"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="زمان ثبت")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="آخرین بروزرسانی")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "سفارش"
        verbose_name_plural = "سفارشات"

    def save(self, *args, **kwargs):
        if self._state.adding:
            last_order = (
                Order.objects.filter(restaurant=self.restaurant)
                .order_by("-order_number")
                .first()
            )
            self.order_number = (last_order.order_number + 1) if last_order else 1001
        super().save(*args, **kwargs)

    def __str__(self):
        return f"سفارش #{self.order_number} - میز {self.table_number} ({self.restaurant.name})"


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name="سفارش",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="محصول",
    )
    product_name_fa = models.CharField(max_length=200, verbose_name="نام محصول")
    product_name_en = models.CharField(
        max_length=200, blank=True, default="", verbose_name="نام انگلیسی"
    )
    unit_price = models.PositiveBigIntegerField(verbose_name="قیمت واحد")
    quantity = models.PositiveIntegerField(default=1, verbose_name="تعداد")
    notes = models.CharField(
        max_length=300, blank=True, default="", verbose_name="توضیحات مشتری"
    )

    class Meta:
        verbose_name = "آیتم سفارش"
        verbose_name_plural = "آیتم‌های سفارش"

    def __str__(self):
        return f"{self.product_name_fa} × {self.quantity}"


class TableServiceCall(models.Model):
    class CallType(models.TextChoices):
        WAITER = "waiter", "احضار گارسون"
        CHEF = "chef", "درخواست از سرآشپز"

    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار رسیدگی"
        HANDLED = "handled", "رسیدگی شد"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="service_calls",
        verbose_name="رستوران",
    )
    table_number = models.PositiveIntegerField(verbose_name="شماره میز")
    call_type = models.CharField(
        max_length=20,
        choices=CallType.choices,
        default=CallType.WAITER,
        verbose_name="نوع درخواست",
    )
    message = models.TextField(blank=True, default="", verbose_name="پیام مشتری")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="وضعیت",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="زمان درخواست")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "درخواست میز"
        verbose_name_plural = "درخواست‌های میز (گارسون / سرآشپز)"

    def __str__(self):
        return f"{self.get_call_type_display()} - میز {self.table_number}"