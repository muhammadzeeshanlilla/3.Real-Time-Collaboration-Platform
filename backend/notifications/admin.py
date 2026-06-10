from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "recipient",
        "workspace",
        "notification_type",
        "title",
        "is_read",
        "created_at",
    )
    list_filter = (
        "notification_type",
        "is_read",
        "created_at",
    )
    search_fields = (
        "recipient__username",
        "title",
        "message",
        "workspace__name",
    )