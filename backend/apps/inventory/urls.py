from django.urls import path
from .views import (
    InventoryItemListCreateView,
    InventoryItemDetailView,
    InventoryStockAdjustView,
    InventoryTransactionListView,
)

urlpatterns = [
    path(
        "inventory/items/",
        InventoryItemListCreateView.as_view(),
        name="inventory-item-list-create",
    ),
    path(
        "inventory/items/<uuid:item_id>/",
        InventoryItemDetailView.as_view(),
        name="inventory-item-detail",
    ),
    path(
        "inventory/items/<uuid:item_id>/adjust/",
        InventoryStockAdjustView.as_view(),
        name="inventory-item-adjust",
    ),
    path(
        "inventory/transactions/",
        InventoryTransactionListView.as_view(),
        name="inventory-transactions",
    ),
]