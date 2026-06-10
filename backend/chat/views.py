from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from workspaces.models import Workspace, WorkspaceMember

from .models import Message
from .serializers import MessageSerializer


class WorkspaceMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get_workspace(self, workspace_id):
        try:
            return Workspace.objects.get(id=workspace_id)
        except Workspace.DoesNotExist:
            return None

    def is_workspace_member(self, workspace, user):
        return WorkspaceMember.objects.filter(
            workspace=workspace,
            user=user
        ).exists()

    def get(self, request, workspace_id):
        workspace = self.get_workspace(workspace_id)

        if workspace is None:
            return Response(
                {"message": "Workspace not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if not self.is_workspace_member(workspace, request.user):
            return Response(
                {"message": "You are not a member of this workspace."},
                status=status.HTTP_403_FORBIDDEN
            )

        messages = Message.objects.filter(workspace=workspace)

        serializer = MessageSerializer(messages, many=True)

        return Response(
            {"messages": serializer.data},
            status=status.HTTP_200_OK
        )

    def post(self, request, workspace_id):
        workspace = self.get_workspace(workspace_id)

        if workspace is None:
            return Response(
                {"message": "Workspace not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if not self.is_workspace_member(workspace, request.user):
            return Response(
                {"message": "You are not a member of this workspace."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = MessageSerializer(data=request.data)

        if serializer.is_valid():
            message = serializer.save(
                workspace=workspace,
                sender=request.user
            )

            response_serializer = MessageSerializer(message)

            return Response(
                {
                    "message": "Message sent successfully.",
                    "chat_message": response_serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )