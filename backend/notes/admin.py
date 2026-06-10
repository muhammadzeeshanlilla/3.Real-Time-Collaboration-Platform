from django.contrib import admin

from .models import Note


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "workspace",
        "created_by",
        "updated_by",
        "created_at",
        "updated_at",
    )
    search_fields = (
        "title",
        "content",
        "workspace__name",
        "created_by__username",
    )