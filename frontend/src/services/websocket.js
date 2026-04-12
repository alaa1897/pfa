/**
 * WebSocket Service
 * -----------------
 * Manages the WebSocket connection between the board simulator page
 * and the Django Channels backend.
 *
 * Each board simulator opens one persistent WebSocket connection.
 * The backend (via Celery) sends messages to this connection when
 * an ad is scheduled to play.
 *
 * Message types received from the server:
 *   - connection_established → we're connected and ready
 *   - display_ad             → play this ad now (url, duration, repeat_count)
 *   - clear_screen           → ad done, return to idle screen
 *   - heartbeat_ack          → server acknowledged our ping
 */

const WS_BASE_URL = process.env.REACT_APP_WS_URL || "";

class BoardWebSocket {
  constructor(boardId, onMessage) {
    this.boardId = boardId;
    this.onMessage = onMessage;  // Callback function to handle incoming messages
    this.ws = null;
    this.heartbeatInterval = null;
    this.reconnectDelay = 3000;  // Wait 3 seconds before reconnecting
    this.shouldReconnect = true;
  }

  connect() {
    const url = `${WS_BASE_URL}/ws/board/${this.boardId}/`;
    console.log(`[WS] Connecting to ${url}`);

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log(`[WS] Board ${this.boardId} connected.`);
      this._startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(`[WS] Message received:`, data);
      this.onMessage(data);
    };

    this.ws.onclose = () => {
      console.warn(`[WS] Connection closed. Reconnecting in ${this.reconnectDelay}ms…`);
      this._stopHeartbeat();
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), this.reconnectDelay);
      }
    };

    this.ws.onerror = (error) => {
      console.error("[WS] Error:", error);
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    this._stopHeartbeat();
    if (this.ws) {
      this.ws.close();
    }
  }

  // Send a heartbeat every 30 seconds to keep the connection alive
  _startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "heartbeat" }));
      }
    }, 30000);
  }

  _stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}

export default BoardWebSocket;
