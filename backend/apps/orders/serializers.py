from django.utils import timezone
from rest_framework import serializers
from .models import KitchenStage, Order, OrderItem, TableServiceCall, ensure_default_stages


class KitchenStageSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    orderIndex = serializers.IntegerField(source="order_index")

    class Meta:
        model = KitchenStage
        fields = ["id", "name", "description", "color", "orderIndex"]

    def get_id(self, obj):
        return str(obj.id)


class OrderItemCreateSerializer(serializers.Serializer):
    productId = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, max_value=100)
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class PublicOrderCreateSerializer(serializers.Serializer):
    restaurantSlug = serializers.SlugField()
    tableNumber = serializers.IntegerField(min_value=1)
    customerName = serializers.CharField(required=False, allow_blank=True, default="")
    customerMobile = serializers.CharField(required=False, allow_blank=True, default="")
    items = OrderItemCreateSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("سبد خرید نمی‌تواند خالی باشد.")
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    productName = serializers.CharField(source="product_name_fa")
    productNameFa = serializers.CharField(source="product_name_fa")
    productNameEn = serializers.CharField(source="product_name_en")
    unitPrice = serializers.IntegerField(source="unit_price")

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "productName",
            "productNameFa",
            "productNameEn",
            "unitPrice",
            "quantity",
            "notes",
        ]

    def get_id(self, obj):
        return str(obj.id)


class OrderSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    orderNumber = serializers.IntegerField(source="order_number")
    tableNumber = serializers.IntegerField(source="table_number")
    stageId = serializers.SerializerMethodField()
    stageName = serializers.SerializerMethodField()
    stages = serializers.SerializerMethodField()
    customerName = serializers.CharField(source="customer_name")
    customerMobile = serializers.CharField(source="customer_mobile")
    paymentMethod = serializers.CharField(source="payment_method")
    paymentStatus = serializers.CharField(source="payment_status")
    totalPrice = serializers.IntegerField(source="total_price")
    createdAt = serializers.DateTimeField(source="created_at")
    timeCreated = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "orderNumber",
            "tableNumber",
            "stageId",
            "stageName",
            "stages",
            "customerName",
            "customerMobile",
            "status",
            "paymentMethod",
            "paymentStatus",
            "totalPrice",
            "createdAt",
            "timeCreated",
            "items",
        ]

    def get_id(self, obj):
        return str(obj.id)

    def get_stageId(self, obj):
        return str(obj.stage_id) if obj.stage_id else ""

    def get_stageName(self, obj):
        return obj.stage.name if obj.stage else ""

    def get_stages(self, obj):
        stages = ensure_default_stages(obj.restaurant)
        return KitchenStageSerializer(stages, many=True).data

    def get_timeCreated(self, obj):
        if not obj.created_at:
            return ""
        local_dt = timezone.localtime(obj.created_at)
        return local_dt.strftime("%H:%M")


class TableServiceCallSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    tableNumber = serializers.IntegerField(source="table_number")
    callType = serializers.CharField(source="call_type")
    createdAt = serializers.DateTimeField(source="created_at")
    timeCreated = serializers.SerializerMethodField()

    class Meta:
        model = TableServiceCall
        fields = [
            "id",
            "tableNumber",
            "callType",
            "message",
            "status",
            "createdAt",
            "timeCreated",
        ]

    def get_id(self, obj):
        return str(obj.id)

    def get_timeCreated(self, obj):
        if not obj.created_at:
            return ""
        local_dt = timezone.localtime(obj.created_at)
        return local_dt.strftime("%H:%M")