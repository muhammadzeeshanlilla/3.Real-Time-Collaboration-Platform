from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from notifications.utils import create_workspace_notifications

from .models import Workspace, WorkspaceMember
from .serializers import (
    WorkspaceSerializer,
    WorkspaceCreateSerializer,
    JoinWorkspaceSerializer,
)


class WorkspaceListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_workspaces = Workspace.objects.filter(
            members__user=request.user
        ).distinct().order_by("-created_at")

        serializer = WorkspaceSerializer(
            user_workspaces,
            many=True
        )

        return Response(
            {
                "workspaces": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = WorkspaceCreateSerializer(data=request.data)

        if serializer.is_valid():
            workspace = serializer.save(created_by=request.user)

            WorkspaceMember.objects.create(
                workspace=workspace,
                user=request.user,
                role="OWNER"
            )

            response_serializer = WorkspaceSerializer(workspace)

            return Response(
                {
                    "message": "Workspace created successfully.",
                    "workspace": response_serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class WorkspaceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_id):
        try:
            workspace = Workspace.objects.get(id=workspace_id)
        except Workspace.DoesNotExist:
            return Response(
                {
                    "message": "Workspace not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        is_member = WorkspaceMember.objects.filter(
            workspace=workspace,
            user=request.user
        ).exists()

        if not is_member:
            return Response(
                {
                    "message": "You are not a member of this workspace."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = WorkspaceSerializer(workspace)

        return Response(
            {
                "workspace": serializer.data
            },
            status=status.HTTP_200_OK
        )


class JoinWorkspaceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = JoinWorkspaceSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        invite_code = serializer.validated_data["invite_code"].upper()

        try:
            workspace = Workspace.objects.get(invite_code=invite_code)
        except Workspace.DoesNotExist:
            return Response(
                {
                    "message": "Invalid invite code."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        already_member = WorkspaceMember.objects.filter(
            workspace=workspace,
            user=request.user
        ).exists()

        if already_member:
            return Response(
                {
                    "message": "You are already a member of this workspace."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        WorkspaceMember.objects.create(
            workspace=workspace,
            user=request.user,
            role="MEMBER"
        )

        create_workspace_notifications(
        workspace=workspace,
        sender=request.user,
        notification_type="WORKSPACE",
        title="New member joined",
        message=f"{request.user.username} joined workspace {workspace.name}."
)

        response_serializer = WorkspaceSerializer(workspace)

        return Response(
            {
                "message": "Workspace joined successfully.",
                "workspace": response_serializer.data
            },
            status=status.HTTP_200_OK
        )