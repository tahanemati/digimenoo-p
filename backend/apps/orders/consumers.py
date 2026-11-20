import json
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.tokens import AccessToken

from apps.accounts.models import User
from apps.restaurants.views import get_user_restaurant


@database_sync_to_async
def authenticate_ws_user(token_str: str):
    if not token_str:
        return None, None
    try:
        access_token = AccessToken(token_str)
        user_id = access_token.get("user_id")
        user = User.objects.filter(id=user_id, is_active=True).first()
        if not user:
            return None, None
        restaurant = get_user_restaurant(user)
        if not restaurant:
            return user, None
        return user, str(restaurant.id)
    except Exception:
        return None, None


class KitchenConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope.get("query_string", b"").decode("utf-8")
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]

        user, restaurant_id = await authenticate_ws_user(token)
        if not user or not restaurant_id:
            await self.close(code=4001)
            return

        self.restaurant_id = restaurant_id
        self.group_name = f"kitchen_{restaurant_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send(
            text_data=json.dumps(
                {
                    "event": "connected",
                    "restaurantId": restaurant_id,
                }
            )
        )

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name, self.channel_name
            )

    async def kitchen_event(self, event):
        await self.send(text_data=json.dumps(event["payload"]))


class OrderStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        order_id = self.scope["url_route"]["kwargs"].get("order_id")
        if not order_id:
            await self.close(code=4002)
            return

        self.order_id = str(order_id)
        self.group_name = f"order_{self.order_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name, self.channel_name
            )

    async def order_event(self, event):
        await self.send(text_data=json.dumps(event["payload"]))


class PublicMenuConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        slug = self.scope["url_route"]["kwargs"].get("slug", "").strip().lower()
        if not slug:
            await self.close(code=4003)
            return

        self.group_name = f"menu_{slug}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name, self.channel_name
            )

    async def menu_event(self, event):
        await self.send(text_data=json.dumps(event["payload"]))