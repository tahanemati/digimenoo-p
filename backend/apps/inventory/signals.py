from decimal import Decimal
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.orders.models import Order, OrderItem
from .models import InventoryItem, ProductIngredient, InventoryTransaction


@receiver(post_save, sender=OrderItem)
def deduct_inventory_on_order_item_created(sender, instance: OrderItem, created: bool, **kwargs):
    if not created or not instance.product_id or instance.quantity <= 0:
        return

    ingredients = list(
        ProductIngredient.objects.filter(product_id=instance.product_id)
        .select_related("inventory_item")
    )
    if not ingredients:
        return

    order = instance.order
    qty_multiplier = Decimal(str(instance.quantity))

    with transaction.atomic():
        for ing in ingredients:
            deduct_amount = (ing.quantity_used * qty_multiplier).quantize(
                Decimal("0.001")
            )
            if deduct_amount <= 0:
                continue

            inv_item = (
                InventoryItem.objects.select_for_update()
                .filter(pk=ing.inventory_item_id)
                .first()
            )
            if not inv_item:
                continue

            new_stock = max(Decimal("0"), inv_item.current_stock - deduct_amount)
            inv_item.current_stock = new_stock
            inv_item.save(update_fields=["current_stock", "updated_at"])

            InventoryTransaction.objects.create(
                restaurant_id=order.restaurant_id,
                inventory_item=inv_item,
                tx_type=InventoryTransaction.TxType.ORDER,
                quantity_change=-deduct_amount,
                stock_after=new_stock,
                order_id=order.id,
                order_number=order.order_number,
                note=f"کسر خودکار سفارش #{order.order_number} ({instance.product_name_fa} × {instance.quantity})",
            )


@receiver(post_save, sender=Order)
def restore_inventory_on_order_cancelled(sender, instance: Order, created: bool, **kwargs):
    if created or instance.status != Order.Status.CANCELLED:
        return

    # جلوگیری از برگشت تکراری موجودی برای یک سفارش لغو شده
    already_restored = InventoryTransaction.objects.filter(
        order_id=instance.id,
        tx_type=InventoryTransaction.TxType.ORDER_CANCEL,
    ).exists()
    if already_restored:
        return

    deductions = list(
        InventoryTransaction.objects.filter(
            order_id=instance.id,
            tx_type=InventoryTransaction.TxType.ORDER,
        )
    )
    if not deductions:
        return

    with transaction.atomic():
        for tx in deductions:
            restore_amount = abs(tx.quantity_change)
            if restore_amount <= 0:
                continue

            inv_item = (
                InventoryItem.objects.select_for_update()
                .filter(pk=tx.inventory_item_id)
                .first()
            )
            if not inv_item:
                continue

            new_stock = inv_item.current_stock + restore_amount
            inv_item.current_stock = new_stock
            inv_item.save(update_fields=["current_stock", "updated_at"])

            InventoryTransaction.objects.create(
                restaurant_id=instance.restaurant_id,
                inventory_item=inv_item,
                tx_type=InventoryTransaction.TxType.ORDER_CANCEL,
                quantity_change=restore_amount,
                stock_after=new_stock,
                order_id=instance.id,
                order_number=instance.order_number,
                note=f"برگشت به انبار بابت لغو سفارش #{instance.order_number}",
            )