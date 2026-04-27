/**
 * MyBookingsPage.js
 * Uses robot notifications instead of toast for all user feedback.
 */
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format, differenceInSeconds, addMinutes, parseISO } from "date-fns";
import { RefreshCw, Calendar, Monitor, AlertCircle, Upload } from "lucide-react";
import Navbar from "../components/Common/Navbar";
import { bookingsAPI, adsAPI } from "../services/api";
import useRobotStore from "../store/useRobotStore";
import "./MyBookingsPage.css";

const PAYMENT_WINDOW_MINUTES = 15;

// ── Countdown hook ────────────────────────────────────────────────────────────
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

// ── Booking card ──────────────────────────────────────────────────────────────
function BookingCard({ booking, onPaid, onCancel, onAdUploaded }) {
  const [payOpen, setPayOpen]       = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [paying, setPaying]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [paid, setPaid]             = useState(false);
  const [hasAd, setHasAd]           = useState(booking.has_ad);
  const fileInputRef                = useRef();
  const { notify }                  = useRobotStore();
  const countdown  = useCountdown(booking.created_at);
  const isPending  = booking.status === "pending" && !paid;
  const statusClass = paid ? "confirmed" : booking.status;

  // ── Payment ─────────────────────────────────────────────────────────────────
  const handlePay = async () => {
    setPaying(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setPaid(true);
      setPayOpen(false);
      notify("celebrating", "Payment confirmed! Your ad will display on schedule. 🎉");
      onPaid(booking.id);
    } catch {
      notify("error", "Payment didn't go through. Please check your card details and try again.");
    } finally {
      setPaying(false);
    }
  };

  // ── Ad upload ────────────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("booking", booking.id);
    formData.append("file", file);
    formData.append("title", file.name);

    try {
      await adsAPI.uploadAd(formData);
      setHasAd(true);
      setUploadOpen(false);
      notify("success", "Ad uploaded successfully! Complete your payment to confirm the booking.");
      onAdUploaded(booking.id);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.entries(data)
          .map(([field, errors]) => {
            const label = field === "detail" ? "" : `${field}: `;
            const text  = Array.isArray(errors) ? errors.join(", ") : errors;
            return `${label}${text}`;
          })
          .join("\n");
        notify("error", messages);
      } else {
        notify("error", "Upload failed. Please try again.");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
          <span>
            <Monitor size={13}/>
            {format(parseISO(booking.start_time), "HH:mm")} –{" "}
            {format(parseISO(booking.end_time), "HH:mm")}
            {" "}· {booking.repeat_count}× repeat
          </span>
        </div>

        {/* Missing ad warning */}
        {!hasAd && booking.status !== "cancelled" && (
          <div className="bk-warning-bar">
            ⚠ No ad uploaded yet — upload your creative before the booking starts
          </div>
        )}

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
                onClick={() => { setPayOpen((o) => !o); setUploadOpen(false); }}>
                💳 {payOpen ? "Hide" : "Complete Payment"}
              </button>
            )}
            {!hasAd && booking.status !== "cancelled" && (
              <button className="btn btn-secondary btn-sm"
                onClick={() => { setUploadOpen((o) => !o); setPayOpen(false); }}
                disabled={uploading}>
                <Upload size={13}/> {uploading ? "Uploading…" : uploadOpen ? "Hide" : "Upload Ad"}
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
          <div className="bk-card-mock">4242 4242 4242 4242 &nbsp; 12/26 &nbsp; 123</div>
          <button className="btn btn-primary btn-block bk-pay-btn"
            onClick={handlePay} disabled={paying}>
            {paying ? "Processing…" : `Pay ${booking.total_price} TND →`}
          </button>
        </div>
      )}

      {/* Inline upload form */}
      {uploadOpen && (
        <div className="bk-upload-form">
          <p className="bk-upload-label"><strong>Upload your ad creative</strong></p>
          <p className="bk-upload-hint">
            Allowed: JPG, JPEG, PNG, GIF, MP4, WEBM · Max size: 50 MB
          </p>
          <input ref={fileInputRef} type="file"
            accept=".jpg,.jpeg,.png,.gif,.mp4,.webm"
            onChange={handleFileChange}
            className="bk-file-input"
            disabled={uploading}
          />
          {uploading && <p className="bk-uploading-text">⏳ Uploading…</p>}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MyBookingsPage() {
  const navigate   = useNavigate();
  const { notify } = useRobotStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchBookings = () => {
    setLoading(true);
    bookingsAPI.getMyBookings()
      .then(({ data }) => setBookings(data.results || data))
      .catch(() => notify("error", "Could not load your bookings. Please refresh."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const handlePaid       = (id) => setBookings((b) =>
    b.map((bk) => bk.id === id ? { ...bk, status: "confirmed" } : bk));

  const handleAdUploaded = (id) => setBookings((b) =>
    b.map((bk) => bk.id === id ? { ...bk, has_ad: true } : bk));

  const handleCancel = async (id) => {
    try {
      await bookingsAPI.cancelBooking(id);
      notify("info", "Booking cancelled successfully.");
      fetchBookings();
    } catch {
      notify("error", "Could not cancel this booking. Please try again.");
    }
  };

  const pendingCount   = bookings.filter((b) => b.status === "pending").length;
  const missingAdCount = bookings.filter(
    (b) => !b.has_ad && b.status !== "cancelled"
  ).length;

  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>

        <div className="flex justify-between items-center"
          style={{ marginBottom: "1.25rem" }}>
          <h1>My Bookings</h1>
          <button className="btn btn-ghost btn-sm" onClick={fetchBookings}>
            <RefreshCw size={15}/> Refresh
          </button>
        </div>

        {pendingCount > 0 && (
          <div className="pending-banner">
            <AlertCircle size={16}/>
            <div>
              <strong>{pendingCount} booking{pendingCount > 1 ? "s" : ""} awaiting payment</strong>
              <p>Complete payment within 15 minutes or the booking will be cancelled.</p>
            </div>
          </div>
        )}

        {missingAdCount > 0 && (
          <div className="warning-banner">
            <Upload size={16}/>
            <div>
              <strong>{missingAdCount} booking{missingAdCount > 1 ? "s" : ""} missing an ad</strong>
              <p>Upload your creative before the booking start time.</p>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div className="spinner"/> Loading…
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="empty-state">
            <Calendar size={48} color="var(--text-muted)"/>
            <h2>No bookings yet</h2>
            <p>Browse the map and book your first digital board.</p>
            <button className="btn btn-primary"
              onClick={() => navigate("/map")}>
              Explore Boards
            </button>
          </div>
        )}

        <div className="bookings-list">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b}
              onPaid={handlePaid}
              onCancel={handleCancel}
              onAdUploaded={handleAdUploaded}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
