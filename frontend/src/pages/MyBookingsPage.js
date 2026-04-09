import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Calendar, Monitor, RefreshCw } from "lucide-react";
import Navbar from "../components/Common/Navbar";
import { bookingsAPI } from "../services/api";
import "./MyBookingsPage.css";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBookings = () => {
    setLoading(true);
    bookingsAPI.getMyBookings()
      .then(({ data }) => setBookings(data.results || data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await bookingsAPI.cancelBooking(id);
      toast.success("Booking cancelled.");
      fetchBookings();
    } catch {
      toast.error("Could not cancel this booking.");
    }
  };

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        <div className="flex justify-between items-center" style={{ marginBottom: "1.5rem" }}>
          <h1>My Bookings</h1>
          <button className="btn btn-ghost btn-sm" onClick={fetchBookings}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {loading && <div style={{ display:"flex", gap:"1rem", alignItems:"center" }}><div className="spinner" /> Loading…</div>}

        {!loading && bookings.length === 0 && (
          <div className="empty-state">
            <Calendar size={48} color="var(--text-muted)" />
            <h2>No bookings yet</h2>
            <p>Browse the map and book your first digital board.</p>
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              Explore Boards
            </button>
          </div>
        )}

        <div className="bookings-list">
          {bookings.map((b) => (
            <div key={b.id} className="booking-card card">
              <div className="card-body">
                <div className="booking-card-header">
                  <div>
                    <h3>{b.board_detail?.name || `Board #${b.board}`}</h3>
                    <span className="text-muted" style={{ fontSize:".85rem" }}>
                      {b.board_detail?.city}
                    </span>
                  </div>
                  <span className={`badge badge-${b.status}`}>{b.status}</span>
                </div>

                <div className="booking-card-meta">
                  <div className="meta-item">
                    <Calendar size={14} />
                    <span>{format(new Date(b.start_time), "PPP")}</span>
                  </div>
                  <div className="meta-item">
                    <Monitor size={14} />
                    <span>
                      {format(new Date(b.start_time), "HH:mm")} – {format(new Date(b.end_time), "HH:mm")}
                      {" "}· {b.repeat_count}× repeat
                    </span>
                  </div>
                </div>

                <div className="booking-card-footer">
                  <strong style={{ color: "var(--primary)" }}>{b.total_price} TND</strong>
                  <div style={{ display:"flex", gap:".5rem" }}>
                    {b.is_cancellable && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.id)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
