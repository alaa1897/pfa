/**
 * BoardSidebar
 * Shows detailed info about a selected board in a slide-in panel.
 */

import React from "react";
import { X, MapPin, Monitor, DollarSign, Calendar } from "lucide-react";
import "./BoardSidebar.css";

export default function BoardSidebar({ board, onClose, onBook }) {
  return (
    <aside className="board-sidebar">
      <div className="sidebar-header">
        <h2>{board.name}</h2>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {board.thumbnail && (
        <div className="sidebar-thumbnail">
          <img src={board.thumbnail} alt={board.name} />
        </div>
      )}

      <div className="sidebar-body">
        <div className="sidebar-meta">
          <div className="meta-item">
            <MapPin size={15} />
            <span>{board.address}, {board.city}</span>
          </div>
          <div className="meta-item">
            <Monitor size={15} />
            <span>{board.resolution} — {board.width_cm}×{board.height_cm} cm</span>
          </div>
          <div className="meta-item">
            <DollarSign size={15} />
            <span><strong>{board.price_per_slot} TND</strong> per 30-min slot</span>
          </div>
        </div>

        {board.description && (
          <p className="sidebar-description">{board.description}</p>
        )}

        <div className="sidebar-status">
          <span className={`badge badge-${board.status}`}>{board.status}</span>
        </div>
      </div>

      <div className="sidebar-footer">
        {board.status === "active" ? (
          <button className="btn btn-primary btn-block" onClick={onBook}>
            <Calendar size={16} />
            Book This Board
          </button>
        ) : (
          <p className="text-muted text-center" style={{ fontSize: ".875rem" }}>
            This board is currently unavailable for booking.
          </p>
        )}
      </div>
    </aside>
  );
}
