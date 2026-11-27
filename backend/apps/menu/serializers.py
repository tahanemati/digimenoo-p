from decimal import Decimal, InvalidOperation
from rest_framework import serializers
from apps.inventory.models import InventoryItem, ProductIngredient
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    nameFa = serializers.CharField(source="name_fa")
    nameEn = serializers.CharField(
        source="name_en", required=False, allow_blank=True, default=""
    )

    class Meta:
        model = Category
        fields = ["id", "nameFa", "nameEn", "sort_order", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_nameFa(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("نام فارسی دسته‌بندی الزامی است.")
        return cleaned


class ProductSerializer(serializers.ModelSerializer):
    categoryId = serializers.PrimaryKeyRelatedField(
        source="category", queryset=Category.objects.all()
    )
    nameFa = serializers.CharField(source="name_fa")
    nameEn = serializers.CharField(
        source="name_en", required=False, allow_blank=True, default=""
    )
    descriptionFa = serializers.CharField(
        source="description_fa", required=False, allow_blank=True, default=""
    )
    descriptionEn = serializers.CharField(
        source="description_en", required=False, allow_blank=True, default=""
    )
    price = serializers.IntegerField(min_value=0)
    stock = serializers.IntegerField(
        min_value=0, required=False, allow_null=True
    )
    isAvailableInMenu = serializers.BooleanField(
        source="is_available_in_menu", required=False, default=True
    )
    imageUrl = serializers.CharField(
        source="image_url", required=False, allow_blank=True
    )
    ingredients = serializers.ListField(
        child=serializers.DictField(), required=False, write_only=True
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "categoryId",
            "nameFa",
            "nameEn",
            "descriptionFa",
            "descriptionEn",
            "price",
            "stock",
            "isAvailableInMenu",
            "imageUrl",
            "ingredients",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_categoryId(self, category):
        restaurant = self.context.get("restaurant")
        if restaurant and category.restaurant_id != restaurant.id:
            raise serializers.ValidationError(
                "دسته‌بندی انتخاب‌شده متعلق به این مجموعه نیست."
            )
        return category

    def validate_nameFa(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("نام فارسی محصول الزامی است.")
        return cleaned

    def validate_ingredients(self, value):
        if value is None:
            return []

        restaurant = self.context.get("restaurant")
        cleaned_list = []
        seen_ids = set()

        for row in value:
            inv_id = str(
                row.get("inventoryItemId") or row.get("inventory_item_id") or ""
            ).strip()
            raw_qty = row.get("quantityUsed", row.get("quantity_used"))

            if not inv_id:
                continue

            try:
                qty = Decimal(str(raw_qty))
            except (InvalidOperation, TypeError, ValueError):
                raise serializers.ValidationError(
                    "مقدار مصرف ماده اولیه از انبار نامعتبر است."
                )

            if qty <= 0:
                raise serializers.ValidationError(
                    "مقدار مصرف ماده اولیه باید بیشتر از صفر باشد."
                )

            inv_item = InventoryItem.objects.filter(
                id=inv_id, restaurant=restaurant
            ).first()
            if not inv_item:
                raise serializers.ValidationError(
                    "یکی از کالاهای انتخاب‌شده در انبار مجموعه یافت نشد."
                )

            if inv_item.id in seen_ids:
                continue
            seen_ids.add(inv_item.id)
            cleaned_list.append(
                {"inventory_item": inv_item, "quantity_used": qty}
            )

        return cleaned_list

    def _sync_ingredients(self, product, ingredients_data):
        product.ingredients.all().delete()
        if ingredients_data:
            ProductIngredient.objects.bulk_create(
                [
                    ProductIngredient(
                        product=product,
                        inventory_item=row["inventory_item"],
                        quantity_used=row["quantity_used"],
                    )
                    for row in ingredients_data
                ]
            )

    def create(self, validated_data):
        ingredients_data = validated_data.pop("ingredients", None)
        product = super().create(validated_data)
        if ingredients_data is not None:
            self._sync_ingredients(product, ingredients_data)
        return product

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop("ingredients", None)

        if "image_url" in validated_data:
            new_url = validated_data.pop("image_url")
            if new_url == "":
                if instance.image:
                    instance.image.delete(save=False)
                instance.image = None
                instance.image_url = ""

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # فقط اگر فیلد ingredients در درخواست ارسال شده باشد، لیست مواد اولیه آپدیت می‌شود
        # (تا ویرایش سریع قیمت یا ناموجود کردن، مواد مصرفی را پاک نکند)
        if ingredients_data is not None:
            self._sync_ingredients(instance, ingredients_data)

        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = str(instance.id)
        data["categoryId"] = str(instance.category_id)
        data["imageUrl"] = instance.get_image_url()
        data["ingredients"] = [
            {
                "id": str(ing.id),
                "inventoryItemId": str(ing.inventory_item_id),
                "inventoryItemName": ing.inventory_item.name,
                "unit": ing.inventory_item.unit,
                "unitLabel": ing.inventory_item.get_unit_display(),
                "quantityUsed": float(Decimal(ing.quantity_used).normalize()),
                "currentStock": float(
                    Decimal(ing.inventory_item.current_stock).normalize()
                ),
            }
            for ing in instance.ingredients.select_related("inventory_item").all()
        ]
        return data