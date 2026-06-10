import json

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        token = self.get_token_from_query_string()
        self.user = await self.get_user_from_token(token)

        if self.user is None:
            await self.close()
            return

        self.group_name = f"user_notifications_{self.user.id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def send_notification(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "notification",
                    "notification": event["notification"],
                }
            )
        )

    def get_token_from_query_string(self):
        query_string = self.scope["query_string"].decode()
        query_params = query_string.split("&")

        for param in query_params:
            if param.startswith("token="):
                return param.split("token=")[1]

        return None

    @sync_to_async
    def get_user_from_token(self, token):
        if not token:
            return None

        try:
            access_token = AccessToken(token)
            user_id = access_token["user_id"]

            return User.objects.get(id=user_id)
        except (TokenError, User.DoesNotExist):
            return None