from rest_framework import serializers
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
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_categoryId(self, category):
        restaurant = self.context.get("restaurant")
        if restaurant and category.restaurant_id != restaurant.id:
            raise serializers.ValidationError("دسته‌بندی انتخاب‌شده متعلق به این مجموعه نیست.")
        return category

    def validate_nameFa(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("نام فارسی محصول الزامی است.")
        return cleaned

    def update(self, instance, validated_data):
        # اگر کاربر عکس را دستی حذف کرده (imageUrl: "") فایل قبلی هم پاک شود
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
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = str(instance.id)
        data["categoryId"] = str(instance.category_id)
        data["imageUrl"] = instance.get_image_url()
        return data