import re
from rest_framework import serializers
from .models import Restaurant


def to_english_digits(value: str) -> str:
    persian = "۰۱۲۳۴۵۶۷۸۹"
    arabic = "٠١٢٣٤٥٦٧٨٩"
    table = str.maketrans(persian + arabic, "0123456789" * 2)
    return str(value).translate(table)


class RestaurantSerializer(serializers.ModelSerializer):
    ownerName = serializers.SerializerMethodField()
    tableCount = serializers.IntegerField(source="table_count")
    orderingEnabled = serializers.BooleanField(source="ordering_enabled")
    callWaiterEnabled = serializers.BooleanField(source="call_waiter_enabled")
    callChefEnabled = serializers.BooleanField(source="call_chef_enabled")
    aboutUsFa = serializers.CharField(source="about_us_fa")
    aboutUsEn = serializers.CharField(source="about_us_en")
    logoUrl = serializers.SerializerMethodField()
    has_completed_settings = serializers.SerializerMethodField()
    liveViews = serializers.IntegerField(source="live_views", read_only=True)
    totalSales = serializers.SerializerMethodField()
    activeOrdersCount = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = [
            "id",
            "name",
            "slug",
            "status",
            "ownerName",
            "city",
            "tableCount",
            "phone",
            "address",
            "orderingEnabled",
            "bilingual",
            "callWaiterEnabled",
            "callChefEnabled",
            "aboutUsFa",
            "aboutUsEn",
            "logoUrl",
            "theme",
            "has_completed_settings",
            "liveViews",
            "totalSales",
            "activeOrdersCount",
            "created_at",
        ]

    def get_ownerName(self, obj):
        if obj.owner:
            return obj.owner.full_name or obj.owner.mobile
        return "مدیر مجموعه"

    def get_logoUrl(self, obj):
        return obj.get_logo_url()

    def get_has_completed_settings(self, obj):
        return bool(obj.about_us_fa and obj.about_us_fa.strip())

    def get_totalSales(self, obj):
        return 0

    def get_activeOrdersCount(self, obj):
        return 0


class CreateRestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = ["name", "slug"]

    def validate_name(self, value):
        name = value.strip()
        if len(name) < 2:
            raise serializers.ValidationError("نام مجموعه باید حداقل ۲ کاراکتر باشد.")
        return name

    def validate_slug(self, value):
        slug = value.strip().lower()
        if len(slug) < 3:
            raise serializers.ValidationError("آدرس انگلیسی باید حداقل ۳ کاراکتر باشد.")
        if not re.match(r"^[a-z0-9-]+$", slug):
            raise serializers.ValidationError(
                "آدرس انگلیسی فقط می‌تواند شامل حروف انگلیسی، عدد و خط تیره (-) باشد."
            )
        reserved = {
            "admin",
            "api",
            "login",
            "register",
            "dashboard",
            "mine",
            "settings",
            "complete",
            "branding",
            "logo",
            "check-slug",
            "templates",
        }
        if slug in reserved:
            raise serializers.ValidationError(
                "این آدرس رزرو شده است؛ نام دیگری انتخاب کنید."
            )

        qs = Restaurant.objects.filter(slug__iexact=slug)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "این آدرس انگلیسی قبلاً توسط مجموعه دیگری ثبت شده است."
            )
        return slug


class CompleteRestaurantSerializer(serializers.ModelSerializer):
    tableCount = serializers.IntegerField(source="table_count", min_value=1)

    class Meta:
        model = Restaurant
        fields = ["city", "tableCount", "phone", "address"]

    def validate_city(self, value):
        city = value.strip()
        if not city:
            raise serializers.ValidationError("وارد کردن نام شهر الزامی است.")
        return city

    def validate_phone(self, value):
        phone = to_english_digits(value).strip()
        if len(phone) < 7:
            raise serializers.ValidationError("شماره تماس معتبر وارد کنید.")
        return phone

    def validate_address(self, value):
        address = value.strip()
        if len(address) < 5:
            raise serializers.ValidationError("لطفاً آدرس دقیق‌تری وارد کنید.")
        return address


class RestaurantSettingsSerializer(serializers.ModelSerializer):
    orderingEnabled = serializers.BooleanField(
        source="ordering_enabled", required=False
    )
    bilingual = serializers.BooleanField(required=False)
    callWaiterEnabled = serializers.BooleanField(
        source="call_waiter_enabled", required=False
    )
    callChefEnabled = serializers.BooleanField(
        source="call_chef_enabled", required=False
    )
    aboutUsFa = serializers.CharField(
        source="about_us_fa", required=False, allow_blank=True
    )
    aboutUsEn = serializers.CharField(
        source="about_us_en", required=False, allow_blank=True
    )

    class Meta:
        model = Restaurant
        fields = [
            "orderingEnabled",
            "bilingual",
            "callWaiterEnabled",
            "callChefEnabled",
            "aboutUsFa",
            "aboutUsEn",
        ]


class RestaurantBrandingSerializer(serializers.ModelSerializer):
    logoUrl = serializers.CharField(
        source="logo_url", required=False, allow_blank=True
    )
    theme = serializers.CharField(required=False)

    class Meta:
        model = Restaurant
        fields = ["logoUrl", "theme"]

    def update(self, instance, validated_data):
        if "logo_url" in validated_data:
            new_logo_url = validated_data["logo_url"] or ""
            if new_logo_url == "":
                if instance.logo:
                    instance.logo.delete(save=False)
                instance.logo = None
            instance.logo_url = new_logo_url

        if "theme" in validated_data and validated_data["theme"]:
            instance.theme = validated_data["theme"]

        instance.save()
        return instance