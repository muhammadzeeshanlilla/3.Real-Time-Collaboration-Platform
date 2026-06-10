from rest_framework import serializers

from .models import Note


class NoteSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True
    )
    updated_by_username = serializers.CharField(
        source="updated_by.username",
        read_only=True
    )

    class Meta:
        model = Note
        fields = [
            "id",
            "workspace",
            "title",
            "content",
            "created_by",
            "created_by_username",
            "updated_by",
            "updated_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "created_by",
            "created_by_username",
            "updated_by",
            "updated_by_username",
            "created_at",
            "updated_at",
        ]