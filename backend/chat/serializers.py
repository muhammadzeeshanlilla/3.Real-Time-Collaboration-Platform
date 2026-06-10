from rest_framework import serializers

from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(
        source="sender.username",
        read_only=True
    )
    sender_email = serializers.EmailField(
        source="sender.email",
        read_only=True
    )

    class Meta:
        model = Message
        fields = [
            "id",
            "workspace",
            "sender",
            "sender_username",
            "sender_email",
            "content",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "sender",
            "sender_username",
            "sender_email",
            "created_at",
        ]