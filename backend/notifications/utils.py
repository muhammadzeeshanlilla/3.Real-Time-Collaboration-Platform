from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification
from .serializers import NotificationSerializer


def send_realtime_notification(notification):
    channel_layer = get_channel_layer()

    serializer = NotificationSerializer(notification)

    async_to_sync(channel_layer.group_send)(
        f"user_notifications_{notification.recipient.id}",
        {
            "type": "send_notification",
            "notification": serializer.data,
        }
    )


def create_workspace_notifications(
    workspace,
    sender,
    notification_type,
    title,
    message
):
    members = workspace.members.exclude(user=sender)

    created_notifications = []

    for member in members:
        notification = Notification.objects.create(
            recipient=member.user,
            workspace=workspace,
            notification_type=notification_type,
            title=title,
            message=message
        )

        created_notifications.append(notification)

        send_realtime_notification(notification)

    return created_notifications