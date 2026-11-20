import uuid
from django.db import models
from apps.restaurants.models import Restaurant


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="categories",
    )
    name_fa = models.CharField(max_length=150)
    name_en = models.CharField(max_length=150, blank=True, default="")
    sort_order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "created_at"]

    def __str__(self):
        return f"{self.name_fa} - {self.restaurant.name}"


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="products",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="items",
    )

    name_fa = models.CharField(max_length=200)
    name_en = models.CharField(max_length=200, blank=True, default="")
    description_fa = models.TextField(blank=True, default="")
    description_en = models.TextField(blank=True, default="")

    price = models.PositiveBigIntegerField(default=0)
    # خالی (null) یعنی موجودی نامحدود، صفر یعنی ناموجود
    stock = models.PositiveIntegerField(null=True, blank=True)
    is_available_in_menu = models.BooleanField(default=True)

    image = models.ImageField(
        upload_to="products/%Y/%m/",
        blank=True,
        null=True,
    )
    image_url = models.CharField(max_length=500, blank=True, default="")

    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "created_at"]

    def get_image_url(self):
        if self.image:
            return self.image.url
        return self.image_url or ""

    def __str__(self):
        return f"{self.name_fa} ({self.price})"