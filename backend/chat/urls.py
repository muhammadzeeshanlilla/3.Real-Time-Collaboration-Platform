from django.urls import path

from .views import WorkspaceMessagesView


urlpatterns = [
    path(
        "workspaces/<int:workspace_id>/messages/",
        WorkspaceMessagesView.as_view(),
        name="workspace-messages"
    ),
]