from django.urls import re_path

from .consumers import NotesConsumer


websocket_urlpatterns = [
    re_path(
        r"ws/notes/(?P<workspace_id>\d+)/$",
        NotesConsumer.as_asgi()
    ),
]