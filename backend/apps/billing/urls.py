from django.urls import path
from .views import (
    WalletDetailView,
    WalletTransactionListView,
    WalletTopUpReceiptView,
    SubscriptionPlanListView,
    CurrentSubscriptionView,
    PurchaseSubscriptionView,
)

urlpatterns = [
    path("billing/wallet/", WalletDetailView.as_view(), name="wallet-detail"),
    path("billing/wallet/transactions/", WalletTransactionListView.as_view(), name="wallet-transactions"),
    path("billing/wallet/top-up/", WalletTopUpReceiptView.as_view(), name="wallet-top-up"),
    path("billing/plans/", SubscriptionPlanListView.as_view(), name="subscription-plans"),
    path("billing/subscription/", CurrentSubscriptionView.as_view(), name="subscription-current"),
    path("billing/subscription/purchase/", PurchaseSubscriptionView.as_view(), name="subscription-purchase"),
]