from django.urls import path

from .views import (
    WorkspaceListCreateView,
    WorkspaceDetailView,
    JoinWorkspaceView,
)


urlpatterns = [
    path("", WorkspaceListCreateView.as_view(), name="workspace-list-create"),
    path("join/", JoinWorkspaceView.as_view(), name="workspace-join"),
    path("<int:workspace_id>/", WorkspaceDetailView.as_view(), name="workspace-detail"),
]