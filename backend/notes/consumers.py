import json

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from workspaces.models import WorkspaceMember


class NotesConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.workspace_id = self.scope["url_route"]["kwargs"]["workspace_id"]
        self.room_group_name = f"workspace_notes_{self.workspace_id}"

        token = self.get_token_from_query_string()
        self.user = await self.get_user_from_token(token)

        if self.user is None:
            await self.close()
            return

        is_member = await self.check_workspace_membership(
            self.workspace_id,
            self.user
        )

        if not is_member:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "notes_event",
                "event": data,
            }
        )

    async def notes_event(self, event):
        await self.send(
            text_data=json.dumps(event["event"])
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

    @sync_to_async
    def check_workspace_membership(self, workspace_id, user):
        return WorkspaceMember.objects.filter(
            workspace_id=workspace_id,
            user=user
        ).exists()