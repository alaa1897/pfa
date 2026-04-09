/**
 * BoardSimulator Component
 * -------------------------
 * This is what the "digital board" looks like.
 * In a real deployment, this would run on a dedicated screen (Raspberry Pi,
 * Android display, etc.). For this project, it runs as a browser tab.
 *
 * It connects to the backend via WebSocket and waits for ad commands.
 * When a scheduled ad fires, the backend pushes the ad URL here
 * and this component displays it fullscreen for the specified duration.
 *
 * States:
 *   idle        → shows a standby screen with the board name + clock
 *   connecting  → WebSocket is connecting
 *   displaying  → currently showing an ad
 */

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import BoardWebSocket from "../../services/websocket";
import "./BoardSimulator.css";

export default function BoardSimulator() {
  const { boardId } = useParams();
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [currentAd, setCurrentAd] = useState(null);       // Ad being displayed
  const [currentTime, setCurrentTime] = useState(new Date());
  const [adProgress, setAdProgress] = useState(0);        // 0–100% progress bar
  const [repeatRemaining, setRepeatRemaining] = useState(0);

  // ── Clock tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // ── Handle incoming WebSocket messages ────────────────────────────────────
  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case "connection_established":
        setConnectionStatus("connected");
        break;

      case "display_ad":
        // A new ad is ready to play
        setCurrentAd({
          url: data.ad_url,
          duration: data.duration_seconds,
          repeatCount: data.repeat_count,
          bookingId: data.booking_id,
        });
        setRepeatRemaining(data.repeat_count);
        setAdProgress(0);
        setConnectionStatus("displaying");
        break;

      case "clear_screen":
        // Ad is done, return to idle
        setCurrentAd(null);
        setConnectionStatus("connected");
        setAdProgress(0);
        break;

      default:
        break;
    }
  }, []);

  // ── WebSocket connection ───────────────────────────────────────────────────
  useEffect(() => {
    const ws = new BoardWebSocket(boardId, handleMessage);
    ws.connect();
    return () => ws.disconnect();
  }, [boardId, handleMessage]);

  // ── Ad progress bar ───────────────────────────────────────────────────────
  // Ticks every second while an ad is playing, tracks progress across repeats
  useEffect(() => {
    if (!currentAd) return;

    const totalDuration = currentAd.duration * currentAd.repeatCount;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 1;
      setAdProgress(Math.min(100, (elapsed / totalDuration) * 100));

      // Track which repeat we're on
      const currentRepeat = currentAd.repeatCount - Math.ceil(
        (totalDuration - elapsed) / currentAd.duration
      );
      setRepeatRemaining(currentAd.repeatCount - currentRepeat);

      if (elapsed >= totalDuration) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentAd]);

  // ── Render ────────────────────────────────────────────────────────────────
  const isVideo = currentAd?.url?.match(/\.(mp4|webm)$/i);

  return (
    <div className="simulator">
      {/* ── Idle / Standby screen ─────────────────────────────────────────── */}
      {!currentAd && (
        <div className="simulator-idle">
          <div className="idle-brand">DOOH Platform</div>

          <div className="idle-clock">
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="idle-date">
            {currentTime.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </div>

          <div className={`idle-status ${connectionStatus}`}>
            <div className={`status-dot ${connectionStatus}`} />
            {connectionStatus === "connecting" && "Connecting to platform…"}
            {connectionStatus === "connected"  && `Board #${boardId} — Ready`}
          </div>
        </div>
      )}

      {/* ── Ad display ────────────────────────────────────────────────────── */}
      {currentAd && (
        <div className="simulator-ad">
          {isVideo ? (
            <video
              src={currentAd.url}
              autoPlay
              loop={repeatRemaining > 0}
              muted={false}
              className="ad-media"
            />
          ) : (
            <img
              src={currentAd.url}
              alt="Ad content"
              className="ad-media"
            />
          )}

          {/* Progress bar at the bottom */}
          <div className="ad-progress-bar">
            <div className="ad-progress-fill" style={{ width: `${adProgress}%` }} />
          </div>

          {/* Repeat counter overlay */}
          <div className="ad-meta">
            <span>Play {currentAd.repeatCount - repeatRemaining + 1} of {currentAd.repeatCount}</span>
            <span>Booking #{currentAd.bookingId}</span>
          </div>
        </div>
      )}

      {/* ── Corner watermark (always visible) ─────────────────────────────── */}
      <div className="simulator-watermark">Board #{boardId}</div>
    </div>
  );
}
