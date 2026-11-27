from django.contrib import admin
from .models import InventoryItem, ProductIngredient, InventoryTransaction


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ("name", "restaurant", "category", "current_stock", "unit", "min_stock", "unit_cost")
    list_filter = ("unit", "restaurant")
    search_fields = ("name", "category", "restaurant__name")


@admin.register(ProductIngredient)
class ProductIngredientAdmin(admin.ModelAdmin):
    list_display = ("product", "inventory_item", "quantity_used")
    search_fields = ("product__name_fa", "inventory_item__name")


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ("inventory_item", "restaurant", "tx_type", "quantity_change", "stock_after", "order_number", "created_at")
    list_filter = ("tx_type", "restaurant")
    search_fields = ("inventory_item__name", "note")