from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    workspace_name = serializers.CharField(
        source="workspace.name",
        read_only=True
    )

    class Meta:
        model = Notification
        fields = [
            "id",
            "workspace",
            "workspace_name",
            "notification_type",
            "title",
            "message",
            "is_read",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "workspace_name",
            "notification_type",
            "title",
            "message",
            "created_at",
        ]