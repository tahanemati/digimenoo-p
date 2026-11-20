from django.contrib import admin
from .models import KitchenStage, Order, OrderItem, TableServiceCall


@admin.register(KitchenStage)
class KitchenStageAdmin(admin.ModelAdmin):
    list_display = ("name", "description", "restaurant", "color", "order_index")
    list_filter = ("restaurant",)
    list_editable = ("order_index", "color")


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product_name_fa", "unit_price", "quantity", "notes")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "restaurant",
        "table_number",
        "stage",
        "formatted_total",
        "status",
        "created_at",
    )
    list_filter = ("status", "restaurant", "created_at")
    list_editable = ("status",)
    search_fields = ("order_number", "restaurant__name", "customer_name", "customer_mobile")
    inlines = [OrderItemInline]

    @admin.display(description="مبلغ کل")
    def formatted_total(self, obj):
        return f"{obj.total_price:,} تومان"


@admin.register(TableServiceCall)
class TableServiceCallAdmin(admin.ModelAdmin):
    list_display = ("restaurant", "table_number", "call_type", "message", "status", "created_at")
    list_filter = ("call_type", "status", "restaurant")
    list_editable = ("status",)