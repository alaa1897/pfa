/**
 * MyBookingsPage.js
 * Shows user bookings with:
 *   - Pending payment banner
 *   - Live countdown timer per pending booking (15 min from creation)
 *   - Inline Stripe payment form (expands inside the card)
 *   - Card flips to confirmed after payment
 */
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format, differenceInSeconds, addMinutes, parseISO } from "date-fns";
import { RefreshCw, Calendar, Monitor, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import Navbar from "../components/Common/Navbar";
import { bookingsAPI } from "../services/api";
import "./MyBookingsPage.css";

const PAYMENT_WINDOW_MINUTES = 15;

// ── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(createdAt) {
  const deadline = addMinutes(parseISO(createdAt), PAYMENT_WINDOW_MINUTES);
  const calc = () => Math.max(0, differenceInSeconds(deadline, new Date()));
  const [secs, setSecs] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return { display: `${mm}:${ss}`, expired: secs === 0, urgent: secs < 180 };
}

// ── Booking card ─────────────────────────────────────────────────────────────
function BookingCard({ booking, onPaid, onCancel }) {
  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying]   = useState(false);
  const [paid, setPaid]       = useState(false);
  const countdown = useCountdown(booking.created_at);
  const isPending = booking.status === "pending" && !paid;

  const handlePay = async () => {
    setPaying(true);
    try {
      // Replace this stub with real Stripe.confirmCardPayment() call
      await new Promise((r) => setTimeout(r, 1200));
      setPaid(true);
      setPayOpen(false);
      toast.success("Payment confirmed!");
      onPaid(booking.id);
    } catch {
      toast.error("Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const statusClass = paid ? "confirmed" : booking.status;

  return (
    <div className={`bk-card ${statusClass}`}>
      <div className="bk-card-body">
        {/* Header */}
        <div className="bk-card-header">
          <div>
            <h3>{booking.board_detail?.name || `Board #${booking.board}`}</h3>
            <span className="bk-city">{booking.board_detail?.city}</span>
          </div>
          <div className="bk-header-right">
            {isPending && (
              <span className={`bk-countdown ${countdown.urgent ? "urgent" : ""}`}>
                {countdown.display}
              </span>
            )}
            <span className={`badge badge-${statusClass}`}>
              {paid ? "confirmed" : booking.status}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="bk-meta">
          <span><Calendar size={13}/> {format(parseISO(booking.start_time), "PPP")}</span>
          <span><Monitor size={13}/>
            {format(parseISO(booking.start_time), "HH:mm")} –{" "}
            {format(parseISO(booking.end_time), "HH:mm")}
            {" "}· {booking.repeat_count}× repeat
          </span>
        </div>

        {/* Pending reminder */}
        {isPending && !countdown.expired && (
          <div className="bk-pending-bar">
            ⏱ Pay within {countdown.display} or booking will be cancelled
          </div>
        )}
        {isPending && countdown.expired && (
          <div className="bk-pending-bar expired">⚠ Payment window expired</div>
        )}

        {/* Footer */}
        <div className="bk-card-footer">
          <strong className="bk-price">{booking.total_price} TND</strong>
          <div className="bk-actions">
            {isPending && !countdown.expired && (
              <button className="btn btn-primary btn-sm"
                onClick={() => setPayOpen((o) => !o)}>
                💳 {payOpen ? "Hide" : "Complete Payment"}
              </button>
            )}
            {booking.is_cancellable && !paid && (
              <button className="btn btn-danger btn-sm"
                onClick={() => onCancel(booking.id)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inline payment form */}
      {payOpen && (
        <div className="bk-pay-form">
          <p className="bk-pay-label">
            <strong>Complete payment</strong> — {booking.total_price} TND ·{" "}
            {booking.board_detail?.name}
          </p>
          {/* Stripe card element would mount here */}
          <div className="bk-card-mock">4242 4242 4242 4242 &nbsp; 12/26 &nbsp; 123</div>
          <button className="btn btn-primary btn-block bk-pay-btn"
            onClick={handlePay} disabled={paying}>
            {paying ? "Processing…" : `Pay ${booking.total_price} TND →`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function MyBookingsPage() {
  const navigate   = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchBookings = () => {
    setLoading(true);
    bookingsAPI.getMyBookings()
      .then(({ data }) => setBookings(data.results || data))
      .catch(() => toast.error("Could not load bookings."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const handlePaid    = (id) => setBookings((b) =>
    b.map((bk) => bk.id === id ? { ...bk, status: "confirmed" } : bk));

  const handleCancel  = async (id) => {
    try {
      await bookingsAPI.cancelBooking(id);
      toast.success("Booking cancelled.");
      fetchBookings();
    } catch {
      toast.error("Could not cancel this booking.");
    }
  };

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>

        {/* Header */}
        <div className="flex justify-between items-center" style={{ marginBottom: "1.25rem" }}>
          <h1>My Bookings</h1>
          <button className="btn btn-ghost btn-sm" onClick={fetchBookings}>
            <RefreshCw size={15}/> Refresh
          </button>
        </div>

        {/* Pending banner */}
        {pendingCount > 0 && (
          <div className="pending-banner">
            <AlertCircle size={16}/>
            <div>
              <strong>{pendingCount} booking{pendingCount > 1 ? "s" : ""} awaiting payment</strong>
              <p>Complete payment within 15 minutes or the booking will be cancelled.</p>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display:"flex", gap:"1rem", alignItems:"center" }}>
            <div className="spinner"/> Loading…
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="empty-state">
            <Calendar size={48} color="var(--text-muted)"/>
            <h2>No bookings yet</h2>
            <p>Browse the map and book your first digital board.</p>
            <button className="btn btn-primary" onClick={() => navigate("/map")}>
              Explore Boards
            </button>
          </div>
        )}

        <div className="bookings-list">
          {bookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onPaid={handlePaid}
              onCancel={handleCancel}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
