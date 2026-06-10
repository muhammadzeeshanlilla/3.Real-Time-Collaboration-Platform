from django.contrib import admin

from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "workspace",
        "sender",
        "content",
        "created_at",
    )
    search_fields = (
        "workspace__name",
        "sender__username",
        "content",
    )