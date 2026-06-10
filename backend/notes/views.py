from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from workspaces.models import Workspace, WorkspaceMember
from notifications.utils import create_workspace_notifications

from .models import Note
from .serializers import NoteSerializer


class WorkspaceNotesView(APIView):
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

        notes = Note.objects.filter(workspace=workspace)

        serializer = NoteSerializer(notes, many=True)

        return Response(
            {"notes": serializer.data},
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

        serializer = NoteSerializer(data=request.data)

        if serializer.is_valid():
            note = serializer.save(
                workspace=workspace,
                created_by=request.user,
                updated_by=request.user
            )

            create_workspace_notifications(
                workspace=workspace,
                sender=request.user,
                notification_type="NOTE",
                title="New note created",
                message=f"{request.user.username} created a note in {workspace.name}."
            )

            response_serializer = NoteSerializer(note)

            return Response(
                {
                    "message": "Note created successfully.",
                    "note": response_serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class NoteDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_note(self, note_id):
        try:
            return Note.objects.get(id=note_id)
        except Note.DoesNotExist:
            return None

    def is_workspace_member(self, workspace, user):
        return WorkspaceMember.objects.filter(
            workspace=workspace,
            user=user
        ).exists()

    def get(self, request, note_id):
        note = self.get_note(note_id)

        if note is None:
            return Response(
                {"message": "Note not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if not self.is_workspace_member(note.workspace, request.user):
            return Response(
                {"message": "You are not a member of this workspace."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = NoteSerializer(note)

        return Response(
            {"note": serializer.data},
            status=status.HTTP_200_OK
        )

    def put(self, request, note_id):
        note = self.get_note(note_id)

        if note is None:
            return Response(
                {"message": "Note not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if not self.is_workspace_member(note.workspace, request.user):
            return Response(
                {"message": "You are not a member of this workspace."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = NoteSerializer(
            note,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            updated_note = serializer.save(
                updated_by=request.user
            )

            create_workspace_notifications(
                workspace=updated_note.workspace,
                sender=request.user,
                notification_type="NOTE",
                title="Note updated",
                message=f"{request.user.username} updated a note in {updated_note.workspace.name}."
            )

            response_serializer = NoteSerializer(updated_note)

            return Response(
                {
                    "message": "Note updated successfully.",
                    "note": response_serializer.data
                },
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, note_id):
        note = self.get_note(note_id)

        if note is None:
            return Response(
                {"message": "Note not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if not self.is_workspace_member(note.workspace, request.user):
            return Response(
                {"message": "You are not a member of this workspace."},
                status=status.HTTP_403_FORBIDDEN
            )

        workspace = note.workspace
        note_title = note.title

        note.delete()

        create_workspace_notifications(
            workspace=workspace,
            sender=request.user,
            notification_type="NOTE",
            title="Note deleted",
            message=f"{request.user.username} deleted note '{note_title}' in {workspace.name}."
        )

        return Response(
            {"message": "Note deleted successfully."},
            status=status.HTTP_200_OK
        )