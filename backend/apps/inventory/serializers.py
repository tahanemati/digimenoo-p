from decimal import Decimal
from rest_framework import serializers
from .models import InventoryItem, InventoryTransaction


def _format_decimal(val) -> float:
    if val is None:
        return 0.0
    return float(Decimal(val).normalize())


class InventoryItemSerializer(serializers.ModelSerializer):
    currentStock = serializers.DecimalField(
        source="current_stock", max_digits=12, decimal_places=3, required=False
    )
    minStock = serializers.DecimalField(
        source="min_stock", max_digits=12, decimal_places=3, required=False
    )
    unitCost = serializers.IntegerField(
        source="unit_cost", min_value=0, required=False, default=0
    )
    unitLabel = serializers.CharField(source="get_unit_display", read_only=True)
    isLowStock = serializers.BooleanField(source="is_low_stock", read_only=True)
    isOutOfStock = serializers.BooleanField(source="is_out_of_stock", read_only=True)
    usedInProductsCount = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "name",
            "category",
            "unit",
            "unitLabel",
            "currentStock",
            "minStock",
            "unitCost",
            "notes",
            "isLowStock",
            "isOutOfStock",
            "usedInProductsCount",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = ["id", "createdAt", "updatedAt"]

    def validate_name(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("نام ماده اولیه الزامی است.")
        return cleaned

    def validate_currentStock(self, value):
        if value < 0:
            raise serializers.ValidationError("موجودی نمی‌تواند منفی باشد.")
        return value

    def validate_minStock(self, value):
        if value < 0:
            raise serializers.ValidationError("حداقل موجودی نمی‌تواند منفی باشد.")
        return value

    def get_usedInProductsCount(self, obj):
        return obj.product_usages.count()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = str(instance.id)
        data["currentStock"] = _format_decimal(instance.current_stock)
        data["minStock"] = _format_decimal(instance.min_stock)
        return data


class InventoryTransactionSerializer(serializers.ModelSerializer):
    itemId = serializers.SerializerMethodField()
    itemName = serializers.CharField(source="inventory_item.name", read_only=True)
    unit = serializers.CharField(source="inventory_item.unit", read_only=True)
    unitLabel = serializers.CharField(
        source="inventory_item.get_unit_display", read_only=True
    )
    txType = serializers.CharField(source="tx_type", read_only=True)
    txTypeLabel = serializers.CharField(source="get_tx_type_display", read_only=True)
    quantityChange = serializers.SerializerMethodField()
    stockAfter = serializers.SerializerMethodField()
    orderNumber = serializers.IntegerField(source="order_number", read_only=True)
    createdByName = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = [
            "id",
            "itemId",
            "itemName",
            "unit",
            "unitLabel",
            "txType",
            "txTypeLabel",
            "quantityChange",
            "stockAfter",
            "orderNumber",
            "note",
            "createdByName",
            "createdAt",
        ]

    def get_itemId(self, obj):
        return str(obj.inventory_item_id)

    def get_quantityChange(self, obj):
        return _format_decimal(obj.quantity_change)

    def get_stockAfter(self, obj):
        return _format_decimal(obj.stock_after)

    def get_createdByName(self, obj):
        if obj.created_by:
            return obj.created_by.full_name or obj.created_by.mobile
        return "سیستم (خودکار)"