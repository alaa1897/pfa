"""
Boards – WebSocket Consumer
----------------------------
This is the real-time heart of the platform.

How it works:
  1. Each board simulator (a browser tab) opens a WebSocket connection to:
       ws://localhost:8000/ws/board/<board_id>/

  2. The consumer adds that connection to a named channel group:
       "board_<board_id>"

  3. When a scheduled ad is ready to play (triggered by Celery), the task
     calls BoardConsumer.send_ad_to_board(), which sends a message to the
     channel group. ALL connected simulators for that board receive it.

  4. The simulator receives the message and displays the ad.

Channel layers (backed by Redis) allow multiple processes to communicate.
The Celery worker lives in a separate process from Django, but both can
talk to the same Redis channel layer.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class BoardConsumer(AsyncWebsocketConsumer):
    """
    Handles the WebSocket connection for a single board simulator.
    """

    async def connect(self):
        """Called when the simulator opens the WebSocket connection."""
        self.board_id = self.scope["url_route"]["kwargs"]["board_id"]
        self.group_name = f"board_{self.board_id}"

        # Join the channel group for this board
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Let the simulator know it connected successfully
        await self.send(text_data=json.dumps({
            "type": "connection_established",
            "board_id": self.board_id,
            "message": f"Board {self.board_id} connected and ready.",
        }))

    async def disconnect(self, close_code):
        """Called when the simulator closes the connection."""
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        """
        Called when the simulator sends a message TO the server.
        Currently used for heartbeat / status updates from the board.
        """
        data = json.loads(text_data)
        event_type = data.get("type")

        if event_type == "heartbeat":
            # The simulator pings us periodically to confirm it's alive
            await self.send(text_data=json.dumps({"type": "heartbeat_ack"}))

    # ── Methods called by the channel layer (from Celery tasks) ──────────────

    async def display_ad(self, event):
        """
        Receives a display_ad event from the channel layer and forwards it
        to the WebSocket (the board simulator).

        This is triggered by the Celery scheduler task.
        """
        await self.send(text_data=json.dumps({
            "type": "display_ad",
            "ad_url": event["ad_url"],
            "duration_seconds": event["duration_seconds"],
            "repeat_count": event["repeat_count"],
            "booking_id": event["booking_id"],
        }))

    async def clear_screen(self, event):
        """Tells the simulator to return to the idle/standby screen."""
        await self.send(text_data=json.dumps({
            "type": "clear_screen",
            "message": event.get("message", "Ad completed."),
        }))


def send_ad_to_board(board_id: int, ad_url: str, duration_seconds: int,
                     repeat_count: int, booking_id: int):
    """
    Synchronous helper — called from Celery tasks (which are sync).
    Pushes the display_ad event to all simulators connected to this board.
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"board_{board_id}",
        {
            "type": "display_ad",       # Maps to the display_ad() method above
            "ad_url": ad_url,
            "duration_seconds": duration_seconds,
            "repeat_count": repeat_count,
            "booking_id": booking_id,
        }
    )
