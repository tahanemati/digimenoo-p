import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models
from apps.restaurants.models import Restaurant
from apps.menu.models import Product


class InventoryItem(models.Model):
    class Unit(models.TextChoices):
        GRAM = "gram", "گرم"
        KG = "kg", "کیلوگرم"
        PIECE = "piece", "عدد"
        ML = "ml", "میلی‌لیتر"
        LITER = "liter", "لیتر"
        PACK = "pack", "بسته"
        PORTION = "portion", "پرس"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="inventory_items",
        verbose_name="رستوران",
    )
    name = models.CharField(max_length=150, verbose_name="نام ماده اولیه / کالا")
    category = models.CharField(
        max_length=100, blank=True, default="", verbose_name="دسته‌بندی انبار"
    )
    unit = models.CharField(
        max_length=20,
        choices=Unit.choices,
        default=Unit.GRAM,
        verbose_name="واحد اندازه‌گیری",
    )
    current_stock = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=Decimal("0"),
        verbose_name="موجودی فعلی",
    )
    min_stock = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=Decimal("0"),
        verbose_name="حداقل موجودی (نقطه هشدار)",
    )
    unit_cost = models.PositiveBigIntegerField(
        default=0, verbose_name="بهای خرید هر واحد (تومان)"
    )
    notes = models.TextField(blank=True, default="", verbose_name="توضیحات")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "کالای انبار"
        verbose_name_plural = "کالاهای انبار"

    @property
    def is_out_of_stock(self) -> bool:
        return self.current_stock <= 0

    @property
    def is_low_stock(self) -> bool:
        return self.current_stock > 0 and self.min_stock > 0 and self.current_stock <= self.min_stock

    def __str__(self):
        return f"{self.name} ({self.current_stock} {self.get_unit_display()})"


class ProductIngredient(models.Model):
    """مواد اولیه مصرفی از انبار به ازای هر ۱ عدد از محصول (کاملاً اختیاری)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="ingredients",
        verbose_name="محصول منو",
    )
    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="product_usages",
        verbose_name="کالای انبار",
    )
    quantity_used = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name="مقدار مصرف به ازای هر ۱ عدد محصول",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("product", "inventory_item")
        verbose_name = "ماده مصرفی محصول"
        verbose_name_plural = "مواد مصرفی محصولات"

    def __str__(self):
        return (
            f"{self.product.name_fa} ← {self.quantity_used} "
            f"{self.inventory_item.get_unit_display()} {self.inventory_item.name}"
        )


class InventoryTransaction(models.Model):
    class TxType(models.TextChoices):
        IN = "in", "ورود / خرید به انبار"
        OUT = "out", "خروج دستی / ضایعات"
        ORDER = "order", "کسر خودکار بابت سفارش"
        ORDER_CANCEL = "order_cancel", "برگشت بابت لغو سفارش"
        ADJUST = "adjust", "اصلاح موجودی / انبارگردانی"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="inventory_transactions",
        verbose_name="رستوران",
    )
    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="transactions",
        verbose_name="کالای انبار",
    )
    tx_type = models.CharField(
        max_length=20, choices=TxType.choices, verbose_name="نوع تراکنش"
    )
    quantity_change = models.DecimalField(
        max_digits=12, decimal_places=3, verbose_name="مقدار تغییر"
    )
    stock_after = models.DecimalField(
        max_digits=12, decimal_places=3, verbose_name="موجودی پس از تغییر"
    )
    order_id = models.UUIDField(null=True, blank=True, db_index=True)
    order_number = models.PositiveIntegerField(null=True, blank=True)
    note = models.CharField(max_length=255, blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_logs",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "تراکنش انبار"
        verbose_name_plural = "تراکنش‌های انبار"

    def __str__(self):
        return f"{self.inventory_item.name} ({self.quantity_change}) - {self.get_tx_type_display()}"