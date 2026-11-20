from django.urls import re_path
from .consumers import KitchenConsumer, OrderStatusConsumer, PublicMenuConsumer

websocket_urlpatterns = [
    re_path(r"^ws/kitchen/$", KitchenConsumer.as_asgi()),
    re_path(r"^ws/orders/(?P<order_id>[0-9a-f-]+)/$", OrderStatusConsumer.as_asgi()),
    re_path(r"^ws/menu/(?P<slug>[^/]+)/$", PublicMenuConsumer.as_asgi()),
]