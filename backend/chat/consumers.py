import json

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from notifications.utils import create_workspace_notifications
from workspaces.models import Workspace, WorkspaceMember

from .models import Message
from .serializers import MessageSerializer


class ChatConsumer(AsyncWebsocketConsumer):
    online_users = {}

    async def connect(self):
        self.workspace_id = self.scope["url_route"]["kwargs"]["workspace_id"]
        self.room_group_name = f"workspace_chat_{self.workspace_id}"

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

        await self.add_user_online()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "presence_update",
                "online_users": self.get_online_users_for_workspace(),
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.remove_user_online()

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "presence_update",
                    "online_users": self.get_online_users_for_workspace(),
                }
            )

            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data.get("content", "").strip()

        if not content:
            return

        message_data = await self.save_message(
            self.workspace_id,
            self.user,
            content
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message_data,
            }
        )

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "chat_message",
                    "message": event["message"],
                }
            )
        )

    async def presence_update(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "presence_update",
                    "online_users": event["online_users"],
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

    @sync_to_async
    def check_workspace_membership(self, workspace_id, user):
        return WorkspaceMember.objects.filter(
            workspace_id=workspace_id,
            user=user
        ).exists()

    @sync_to_async
    def save_message(self, workspace_id, user, content):
        workspace = Workspace.objects.get(id=workspace_id)

        message = Message.objects.create(
            workspace=workspace,
            sender=user,
            content=content
        )

        create_workspace_notifications(
            workspace=workspace,
            sender=user,
            notification_type="MESSAGE",
            title="New message",
            message=f"{user.username} sent a message in {workspace.name}."
        )

        serializer = MessageSerializer(message)

        return serializer.data

    @sync_to_async
    def add_user_online(self):
        workspace_id = str(self.workspace_id)
        user_id = self.user.id

        if workspace_id not in ChatConsumer.online_users:
            ChatConsumer.online_users[workspace_id] = set()

        ChatConsumer.online_users[workspace_id].add(user_id)

    @sync_to_async
    def remove_user_online(self):
        workspace_id = str(self.workspace_id)
        user_id = self.user.id

        if workspace_id in ChatConsumer.online_users:
            ChatConsumer.online_users[workspace_id].discard(user_id)

            if not ChatConsumer.online_users[workspace_id]:
                del ChatConsumer.online_users[workspace_id]

    def get_online_users_for_workspace(self):
        workspace_id = str(self.workspace_id)

        if workspace_id not in ChatConsumer.online_users:
            return []

        return list(ChatConsumer.online_users[workspace_id])