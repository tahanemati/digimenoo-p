from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name_fa", "name_en", "restaurant", "created_at")
    search_fields = ("name_fa", "name_en", "restaurant__name")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name_fa", "category", "restaurant", "price", "stock", "is_available_in_menu")
    list_filter = ("is_available_in_menu", "restaurant")
    search_fields = ("name_fa", "name_en")