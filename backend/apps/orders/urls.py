from django.urls import path
from .views import (
    PublicOrderCreateView,
    PublicOrderStatusView,
    PublicCallWaiterView,
    PublicCallChefView,
    KitchenStagesView,
    KitchenOrdersListView,
    KitchenOrderStageUpdateView,
    KitchenOrderCompleteView,
    KitchenOrderPayView,
    ResolveServiceCallView,
    FinancialReportsView,
)

urlpatterns = [
    # مسیرهای عمومی مشتری
    path("orders/public/", PublicOrderCreateView.as_view(), name="public-order-create"),
    path("orders/public/call-waiter/", PublicCallWaiterView.as_view(), name="public-call-waiter"),
    path("orders/public/call-chef/", PublicCallChefView.as_view(), name="public-call-chef"),
    path("orders/public/<uuid:order_id>/", PublicOrderStatusView.as_view(), name="public-order-status"),
    # مسیرهای پنل آشپزخانه، صندوق و گزارشات مالی
    path("orders/kitchen/", KitchenOrdersListView.as_view(), name="kitchen-orders"),
    path("orders/kitchen-stages/", KitchenStagesView.as_view(), name="kitchen-stages"),
    path("orders/kitchen/<uuid:order_id>/stage/<uuid:stage_id>/", KitchenOrderStageUpdateView.as_view(), name="kitchen-order-stage"),
    path("orders/kitchen/<uuid:order_id>/complete/", KitchenOrderCompleteView.as_view(), name="kitchen-order-complete"),
    path("orders/kitchen/<uuid:order_id>/pay/", KitchenOrderPayView.as_view(), name="kitchen-order-pay"),
    path("orders/kitchen/calls/<uuid:call_id>/resolve/", ResolveServiceCallView.as_view(), name="kitchen-call-resolve"),
    path("orders/financial-reports/", FinancialReportsView.as_view(), name="financial-reports"),
]