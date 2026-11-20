from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def broadcast_kitchen_event(restaurant_id, event_type: str, data: dict):
    channel_layer = get_channel_layer()
    if not channel_layer or not restaurant_id:
        return
    async_to_sync(channel_layer.group_send)(
        f"kitchen_{restaurant_id}",
        {
            "type": "kitchen_event",
            "payload": {
                "event": event_type,
                "data": data,
            },
        },
    )


def broadcast_order_event(order_id, event_type: str, data: dict):
    channel_layer = get_channel_layer()
    if not channel_layer or not order_id:
        return
    async_to_sync(channel_layer.group_send)(
        f"order_{order_id}",
        {
            "type": "order_event",
            "payload": {
                "event": event_type,
                "data": data,
            },
        },
    )


def broadcast_menu_event(restaurant_slug: str, event_type: str, data: dict):
    channel_layer = get_channel_layer()
    if not channel_layer or not restaurant_slug:
        return
    async_to_sync(channel_layer.group_send)(
        f"menu_{restaurant_slug.lower()}",
        {
            "type": "menu_event",
            "payload": {
                "event": event_type,
                "data": data,
            },
        },
    )