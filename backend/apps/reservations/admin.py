from django.contrib import admin
from .models import TableReservation


@admin.register(TableReservation)
class TableReservationAdmin(admin.ModelAdmin):
    list_display = (
        "table_number",
        "restaurant",
        "customer_name",
        "customer_mobile",
        "guests_count",
        "source",
        "status",
        "created_at",
    )
    list_filter = ("status", "source", "restaurant")
    search_fields = ("customer_name", "customer_mobile", "table_number")