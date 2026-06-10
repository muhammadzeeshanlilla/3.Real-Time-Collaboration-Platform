from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/auth/", include("accounts.urls")),
    path("api/workspaces/", include("workspaces.urls")),
    path("api/chat/", include("chat.urls")),
    path("api/notes/", include("notes.urls")),
    path("api/notifications/", include("notifications.urls")),
]