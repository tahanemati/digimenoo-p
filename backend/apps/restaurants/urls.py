from django.urls import path
from .views import (
    CheckSlugView,
    RestaurantTemplatesView,
    RestaurantCreateView,
    MyRestaurantView,
    CompleteRestaurantView,
    RestaurantSettingsView,
    RestaurantLogoUploadView,
    RestaurantBrandingView,
    PublicRestaurantDetailView,
)

urlpatterns = [
    path("restaurants/", RestaurantCreateView.as_view(), name="restaurant-create"),
    path("restaurants/check-slug/", CheckSlugView.as_view(), name="restaurant-check-slug"),
    path("restaurants/templates/", RestaurantTemplatesView.as_view(), name="restaurant-templates"),
    path("restaurants/mine/", MyRestaurantView.as_view(), name="restaurant-mine"),
    path("restaurants/complete/", CompleteRestaurantView.as_view(), name="restaurant-complete"),
    path("restaurants/settings/", RestaurantSettingsView.as_view(), name="restaurant-settings"),
    path("restaurants/logo/", RestaurantLogoUploadView.as_view(), name="restaurant-logo"),
    path("restaurants/branding/", RestaurantBrandingView.as_view(), name="restaurant-branding"),
    path("restaurants/<str:slug>/", PublicRestaurantDetailView.as_view(), name="restaurant-public"),
]