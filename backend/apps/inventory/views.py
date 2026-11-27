from decimal import Decimal, InvalidOperation
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.billing.entitlements import user_has_feature
from apps.common.responses import api_success, api_error
from apps.restaurants.views import get_user_restaurant
from .models import InventoryItem, InventoryTransaction
from .serializers import InventoryItemSerializer, InventoryTransactionSerializer


def _inventory_upgrade_error():
    return api_error(
        "برای استفاده از سیستم انبارداری نیاز به اشتراک فعال دارید.",
        data={
            "code": "UPGRADE_REQUIRED",
            "feature": "inventory",
            "requiredTier": "basic",
        },
        status_code=status.HTTP_403_FORBIDDEN,
    )


class InventoryItemListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not user_has_feature(request.user, "inventory"):
            return _inventory_upgrade_error()

        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "ابتدا مجموعه خود را ثبت کنید.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        items = (
            InventoryItem.objects.filter(restaurant=restaurant)
            .prefetch_related("product_usages")
            .order_by("name")
        )
        serialized = InventoryItemSerializer(items, many=True).data

        low_count = sum(1 for item in items if item.is_low_stock)
        out_count = sum(1 for item in items if item.is_out_of_stock)
        total_value = int(
            sum(
                (item.current_stock * Decimal(item.unit_cost))
                for item in items
                if item.unit_cost > 0
            )
        )

        return api_success(
            {
                "items": serialized,
                "summary": {
                    "totalItems": len(serialized),
                    "lowStockCount": low_count,
                    "outOfStockCount": out_count,
                    "healthyCount": max(0, len(serialized) - low_count - out_count),
                    "totalValue": total_value,
                },
            }
        )

    def post(self, request):
        if request.user.role not in [User.Role.OWNER, User.Role.KITCHEN]:
            return api_error(
                "دسترسی غیرمجاز.", status_code=status.HTTP_403_FORBIDDEN
            )

        if not user_has_feature(request.user, "inventory"):
            return _inventory_upgrade_error()

        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "ابتدا مجموعه خود را ثبت کنید.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        serializer = InventoryItemSerializer(data=request.data)
        if not serializer.is_valid():
            return api_error("اطلاعات کالای انبار نامعتبر است.", serializer.errors)

        with transaction.atomic():
            item = serializer.save(restaurant=restaurant)
            if item.current_stock > 0:
                InventoryTransaction.objects.create(
                    restaurant=restaurant,
                    inventory_item=item,
                    tx_type=InventoryTransaction.TxType.IN,
                    quantity_change=item.current_stock,
                    stock_after=item.current_stock,
                    note="ثبت موجودی اولیه کالا",
                    created_by=request.user,
                )

        return api_success(
            InventoryItemSerializer(item).data,
            message="کالای جدید با موفقیت در انبار ثبت شد.",
            status_code=status.HTTP_201_CREATED,
        )


class InventoryItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, item_id):
        if request.user.role not in [User.Role.OWNER, User.Role.KITCHEN]:
            return api_error(
                "دسترسی غیرمجاز.", status_code=status.HTTP_403_FORBIDDEN
            )

        if not user_has_feature(request.user, "inventory"):
            return _inventory_upgrade_error()

        restaurant = get_user_restaurant(request.user)
        item = get_object_or_404(InventoryItem, id=item_id, restaurant=restaurant)
        old_stock = item.current_stock

        serializer = InventoryItemSerializer(item, data=request.data, partial=True)
        if not serializer.is_valid():
            return api_error("اطلاعات ویرایش کالا نامعتبر است.", serializer.errors)

        with transaction.atomic():
            updated_item = serializer.save()
            diff = updated_item.current_stock - old_stock
            if diff != 0:
                InventoryTransaction.objects.create(
                    restaurant=restaurant,
                    inventory_item=updated_item,
                    tx_type=InventoryTransaction.TxType.ADJUST,
                    quantity_change=diff,
                    stock_after=updated_item.current_stock,
                    note="اصلاح موجودی هنگام ویرایش کالا",
                    created_by=request.user,
                )

        return api_success(
            InventoryItemSerializer(updated_item).data,
            message="اطلاعات کالای انبار بروزرسانی شد.",
        )

    def delete(self, request, item_id):
        if request.user.role != User.Role.OWNER:
            return api_error(
                "فقط مدیر مجموعه می‌تواند کالا را حذف کند.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if not user_has_feature(request.user, "inventory"):
            return _inventory_upgrade_error()

        restaurant = get_user_restaurant(request.user)
        item = get_object_or_404(InventoryItem, id=item_id, restaurant=restaurant)
        item.delete()
        return api_success(message="کالا از انبار حذف شد.")


class InventoryStockAdjustView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, item_id):
        if request.user.role not in [
            User.Role.OWNER,
            User.Role.KITCHEN,
            User.Role.CASHIER,
        ]:
            return api_error(
                "دسترسی غیرمجاز.", status_code=status.HTTP_403_FORBIDDEN
            )

        if not user_has_feature(request.user, "inventory"):
            return _inventory_upgrade_error()

        restaurant = get_user_restaurant(request.user)
        tx_type = str(request.data.get("type", "in")).strip().lower()
        note = str(request.data.get("note", "")).strip()

        if tx_type not in ("in", "out", "adjust"):
            return api_error("نوع عملیات انبار نامعتبر است (in / out / adjust).")

        try:
            quantity = Decimal(str(request.data.get("quantity", "")).strip())
        except (InvalidOperation, ValueError):
            return api_error("مقدار وارد شده معتبر نیست.")

        if quantity < 0 or (tx_type in ("in", "out") and quantity == 0):
            return api_error("مقدار باید عدد مثبت باشد.")

        with transaction.atomic():
            item = get_object_or_404(
                InventoryItem.objects.select_for_update(),
                id=item_id,
                restaurant=restaurant,
            )

            old_stock = item.current_stock
            if tx_type == "in":
                new_stock = old_stock + quantity
                delta = quantity
                db_tx_type = InventoryTransaction.TxType.IN
                default_note = "افزایش موجودی / خرید جدید"
            elif tx_type == "out":
                new_stock = max(Decimal("0"), old_stock - quantity)
                delta = -(old_stock - new_stock)
                db_tx_type = InventoryTransaction.TxType.OUT
                default_note = "خروج دستی / ضایعات"
            else:
                new_stock = quantity
                delta = new_stock - old_stock
                db_tx_type = InventoryTransaction.TxType.ADJUST
                default_note = "انبارگردانی و تنظیم مستقیم موجودی"

            item.current_stock = new_stock
            item.save(update_fields=["current_stock", "updated_at"])

            tx = InventoryTransaction.objects.create(
                restaurant=restaurant,
                inventory_item=item,
                tx_type=db_tx_type,
                quantity_change=delta,
                stock_after=new_stock,
                note=note or default_note,
                created_by=request.user,
            )

        return api_success(
            {
                "item": InventoryItemSerializer(item).data,
                "transaction": InventoryTransactionSerializer(tx).data,
            },
            message="موجودی انبار با موفقیت بروزرسانی شد.",
        )


class InventoryTransactionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not user_has_feature(request.user, "inventory"):
            return _inventory_upgrade_error()

        restaurant = get_user_restaurant(request.user)
        if not restaurant:
            return api_error(
                "ابتدا مجموعه خود را ثبت کنید.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        qs = (
            InventoryTransaction.objects.filter(restaurant=restaurant)
            .select_related("inventory_item", "created_by")
        )

        item_id = request.query_params.get("itemId")
        if item_id:
            qs = qs.filter(inventory_item_id=item_id)

        tx_type = request.query_params.get("type")
        if tx_type:
            qs = qs.filter(tx_type=tx_type)

        qs = qs[:100]
        serializer = InventoryTransactionSerializer(qs, many=True)
        return api_success(serializer.data)