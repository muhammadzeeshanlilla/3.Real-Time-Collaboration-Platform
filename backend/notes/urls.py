from django.urls import path

from .views import WorkspaceNotesView, NoteDetailView


urlpatterns = [
    path(
        "workspaces/<int:workspace_id>/notes/",
        WorkspaceNotesView.as_view(),
        name="workspace-notes"
    ),
    path(
        "notes/<int:note_id>/",
        NoteDetailView.as_view(),
        name="note-detail"
    ),
]