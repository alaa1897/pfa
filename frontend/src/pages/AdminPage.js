/**
 * AdminPage
 * ---------
 * Admin-only dashboard with two tabs:
 *   - Boards: list all boards, see status, open simulator
 *   - Bookings: see all bookings across all users
 */

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Monitor, Calendar, ExternalLink, RefreshCw } from "lucide-react";
import Navbar from "../components/Common/Navbar";
import { boardsAPI, bookingsAPI } from "../services/api";
import "./AdminPage.css";

export default function AdminPage() {
  const [tab, setTab] = useState("boards");
  const [boards, setBoards] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    if (tab === "boards") {
      boardsAPI.getAllBoards()
        .then(({ data }) => setBoards(data.results || data))
        .finally(() => setLoading(false));
    } else {
      bookingsAPI.getAllBookings()
        .then(({ data }) => setBookings(data.results || data))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { fetchData(); }, [tab]);

  const openSimulator = (boardId) => {
    window.open(`/simulator/${boardId}`, `board_${boardId}`,
      "width=1280,height=720,menubar=no,toolbar=no");
  };

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>

        {/* Header */}
        <div className="flex justify-between items-center" style={{ marginBottom: "1.5rem" }}>
          <h1>Admin Dashboard</h1>
          <button className="btn btn-ghost btn-sm" onClick={fetchData}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === "boards" ? "active" : ""}`}
            onClick={() => setTab("boards")}
          >
            <Monitor size={16} /> Boards ({boards.length})
          </button>
          <button
            className={`admin-tab ${tab === "bookings" ? "active" : ""}`}
            onClick={() => setTab("bookings")}
          >
            <Calendar size={16} /> All Bookings
          </button>
        </div>

        {loading && (
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "2rem 0" }}>
            <div className="spinner" /> Loading…
          </div>
        )}

        {/* ── Boards Tab ───────────────────────────────────────────────────── */}
        {!loading && tab === "boards" && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>City</th>
                  <th>Resolution</th>
                  <th>Price / slot</th>
                  <th>Status</th>
                  <th>Simulator</th>
                </tr>
              </thead>
              <tbody>
                {boards.map(b => (
                  <tr key={b.id}>
                    <td className="text-muted">{b.id}</td>
                    <td><strong>{b.name}</strong></td>
                    <td>{b.city}</td>
                    <td>{b.resolution}</td>
                    <td>{b.price_per_slot} TND</td>
                    <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openSimulator(b.id)}
                        title="Open board simulator in new window"
                      >
                        <ExternalLink size={13} /> Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Bookings Tab ─────────────────────────────────────────────────── */}
        {!loading && tab === "bookings" && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Board</th>
                  <th>Date &amp; Time</th>
                  <th>Repeat</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td className="text-muted">{b.id}</td>
                    <td>{b.user_email}</td>
                    <td>{b.board_detail?.name || `#${b.board}`}</td>
                    <td style={{ fontSize: ".85rem" }}>
                      {format(new Date(b.start_time), "MMM d yyyy")}
                      <br />
                      <span className="text-muted">
                        {format(new Date(b.start_time), "HH:mm")} – {format(new Date(b.end_time), "HH:mm")}
                      </span>
                    </td>
                    <td>{b.repeat_count}×</td>
                    <td>{b.total_price} TND</td>
                    <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
