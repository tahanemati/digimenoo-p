from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.restaurants.urls")),
    path("api/", include("apps.menu.urls")),
    path("api/", include("apps.billing.urls")),
    path("api/", include("apps.support.urls")),
    path("api/", include("apps.orders.urls")),
    path("api/", include("apps.reservations.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)