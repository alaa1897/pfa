"""
ASGI Configuration
------------------
ASGI (Asynchronous Server Gateway Interface) is the async successor to WSGI.
Django Channels uses it to handle both regular HTTP requests AND WebSocket
connections in the same server process.

How the routing works:
  - HTTP requests  → Django's standard request/response cycle
  - WebSocket URLs → Channels consumers (see boards/consumers.py)
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import apps.boards.routing

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = ProtocolTypeRouter({
    # Standard HTTP → handled by Django as normal
    "http": get_asgi_application(),

    # WebSocket → routed through our board consumers
    # AuthMiddlewareStack populates scope["user"] from the session/token
    "websocket": AuthMiddlewareStack(
        URLRouter(
            apps.boards.routing.websocket_urlpatterns
        )
    ),
})
