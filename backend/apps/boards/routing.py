"""
Boards – WebSocket URL Routing
Each board simulator connects to its own URL using its board ID.
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/board/(?P<board_id>\d+)/$", consumers.BoardConsumer.as_asgi()),
]
