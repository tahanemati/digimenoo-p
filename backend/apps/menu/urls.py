from django.urls import path
from .views import (
    CategoryListCreateView,
    CategoryDetailView,
    ProductListCreateView,
    ProductDetailView,
    ProductImageUploadView,
    PublicCategoryListView,
    PublicProductListView,
)

urlpatterns = [
    path("menu/categories/", CategoryListCreateView.as_view(), name="category-list-create"),
    path("menu/categories/<uuid:category_id>/", CategoryDetailView.as_view(), name="category-detail"),
    path("menu/products/", ProductListCreateView.as_view(), name="product-list-create"),
    path("menu/products/<uuid:product_id>/", ProductDetailView.as_view(), name="product-detail"),
    path("menu/products/<uuid:product_id>/image/", ProductImageUploadView.as_view(), name="product-image-upload"),
    # منوی عمومی مشتری
    path("menu/public/<str:slug>/categories/", PublicCategoryListView.as_view(), name="public-categories"),
    path("menu/public/<str:slug>/products/", PublicProductListView.as_view(), name="public-products"),
]