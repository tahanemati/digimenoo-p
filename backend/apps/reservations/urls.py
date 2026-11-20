from django.urls import path
from .views import (
    PublicTablesStatusView,
    PublicReservationCreateView,
    ManageReservationsView,
    ManageReservationStatusView,
)

urlpatterns = [
    # مسیرهای عمومی مشتری در منوی دیجیتال
    path(
        "reservations/public/tables/<slug:slug>/",
        PublicTablesStatusView.as_view(),
        name="public-tables-status",
    ),
    path(
        "reservations/public/",
        PublicReservationCreateView.as_view(),
        name="public-reservation-create",
    ),
    # مسیرهای پنل مدیریت رزرو میزها
    path(
        "reservations/",
        ManageReservationsView.as_view(),
        name="manage-reservations",
    ),
    path(
        "reservations/<uuid:reservation_id>/status/",
        ManageReservationStatusView.as_view(),
        name="manage-reservation-status",
    ),
]