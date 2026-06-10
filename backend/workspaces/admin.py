from django.contrib import admin

from .models import Workspace, WorkspaceMember


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "created_by",
        "invite_code",
        "created_at",
    )
    search_fields = ("name", "invite_code", "created_by__username")


@admin.register(WorkspaceMember)
class WorkspaceMemberAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "workspace",
        "user",
        "role",
        "joined_at",
    )
    search_fields = ("workspace__name", "user__username")