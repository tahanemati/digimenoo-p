from django.contrib import admin
from .models import Restaurant


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "owner", "status", "table_count", "theme")
    search_fields = ("name", "slug", "owner__mobile")
    list_filter = ("status", "theme")