from rest_framework import serializers

from .models import Workspace, WorkspaceMember


class WorkspaceMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = [
            "id",
            "user_id",
            "username",
            "email",
            "role",
            "joined_at",
        ]


class WorkspaceSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True
    )
    members = WorkspaceMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Workspace
        fields = [
            "id",
            "name",
            "description",
            "created_by",
            "created_by_username",
            "invite_code",
            "members",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_by_username",
            "invite_code",
            "members",
            "created_at",
        ]


class WorkspaceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = [
            "name",
            "description",
        ]


class JoinWorkspaceSerializer(serializers.Serializer):
    invite_code = serializers.CharField(max_length=20)