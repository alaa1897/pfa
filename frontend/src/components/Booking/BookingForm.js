import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import { format, addDays } from "date-fns";
import useRobotStore from "../../store/useRobotStore";
import { useDropzone } from "react-dropzone";
import { Upload, Clock, Calendar, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { bookingsAPI, adsAPI } from "../../services/api";
import PaymentForm from "../Payment/PaymentForm";
import "./BookingForm.css";

const STEPS = ["Date", "Time Slots", "Upload Ad", "Confirm", "Payment"];

export default function BookingForm({ board }) {
  const navigate = useNavigate();
  const { notify } = useRobotStore();

  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(addDays(new Date(), 1));
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [repeatCount, setRepeatCount] = useState(1);
  const [adFile, setAdFile] = useState(null);
  const [adTitle, setAdTitle] = useState("");
  const [adDuration, setAdDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  useEffect(() => {
    if (step === 1 && selectedDate) {
      setSlotsLoading(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      bookingsAPI.getAvailability(board.id, dateStr)
        .then(({ data }) => setSlots(data))
        .catch(() => notify("error", "Failed to load availability. Please try again."))
        .finally(() => setSlotsLoading(false));
    }
  }, [step, selectedDate, board.id]);

  const toggleSlot = (slot) => {
    if (!slot.is_available) return;
    const key = slot.start_time;
    setSelectedSlots(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [], "video/mp4": [], "video/webm": [] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    onDrop: (accepted, rejected) => {
      if (rejected.length) {
        notify("error", "File too large or unsupported format. Allowed: JPG, PNG, GIF, MP4, WEBM · Max 50 MB.");
        return;
      }
      setAdFile(accepted[0]);
    },
  });

  const sortedSlots = [...selectedSlots].sort();
  const startTime = sortedSlots[0];
  const lastSlotStart = sortedSlots[sortedSlots.length - 1];
  const endTime = lastSlotStart
    ? new Date(new Date(lastSlotStart).getTime() + 30 * 60 * 1000).toISOString()
    : null;
  const totalPrice = board.price_per_slot * selectedSlots.length * repeatCount;

  // Creates booking + uploads ad, then moves to payment step
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: booking } = await bookingsAPI.createBooking({
        board: board.id,
        start_time: startTime,
        end_time: endTime,
        repeat_count: repeatCount,
      });

      const formData = new FormData();
      formData.append("booking", booking.id);
      formData.append("file", adFile);
      formData.append("title", adTitle || adFile.name);
      formData.append("duration_seconds", adDuration);
      await adsAPI.uploadAd(formData);

      setBookingResult(booking);
      notify("success", "Booking created! Complete your payment to confirm your slot.");
      setStep(4); // Go to payment step

    } catch (error) {
      const detail = error.response?.data?.detail || "Booking failed. Please try again.";
      notify("error", detail);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    notify("celebrating", "Payment confirmed! Your ad is scheduled and will go live on time.");
    setStep(5); // Go to success screen
  };

  // ── Success screen (step 5) ───────────────────────────────────────────────
  if (step === 5) {
    return (
      <div className="booking-success">
        <CheckCircle size={56} color="#16a34a" />
        <h2>Booking Confirmed!</h2>
        <p>Your ad is scheduled on <strong>{board.name}</strong></p>
        <p className="text-muted">
          {format(new Date(startTime), "PPP")} at {format(new Date(startTime), "HH:mm")}
        </p>
        <div className="success-actions">
          <button className="btn btn-outline" onClick={() => navigate("/my-bookings")}>
            View My Bookings
          </button>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-form">
      {/* Progress bar */}
      <div className="booking-progress">
        {STEPS.map((label, i) => (
          <div key={label} className={`progress-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
            <div className="step-dot">{i < step ? "✓" : i + 1}</div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Step 0: Pick date ─────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="booking-step">
          <h3><Calendar size={18} /> Choose a Date</h3>
          <p className="step-hint">Select the date you want your ad to run.</p>
          <DatePicker
            selected={selectedDate}
            onChange={setSelectedDate}
            minDate={new Date()}
            maxDate={addDays(new Date(), 60)}
            inline
            calendarClassName="booking-calendar"
          />
          <div className="step-footer">
            <button className="btn btn-primary" onClick={() => setStep(1)}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: Pick time slots ───────────────────────────────────────── */}
      {step === 1 && (
        <div className="booking-step">
          <h3><Clock size={18} /> Choose Time Slots</h3>
          <p className="step-hint">
            Each slot is 30 minutes. Select one or more consecutive slots.
            <br />Showing: <strong>{format(selectedDate, "EEEE, MMMM d yyyy")}</strong>
          </p>
          {slotsLoading ? (
            <div className="slots-loading"><div className="spinner" /> Loading availability…</div>
          ) : (
            <div className="slots-grid">
              {slots.map((slot) => {
                const key = slot.start_time;
                const isSelected = selectedSlots.includes(key);
                const time = format(new Date(slot.start_time), "HH:mm");
                return (
                  <button
                    key={key}
                    className={`slot-btn ${slot.is_available ? "" : "unavailable"} ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleSlot(slot)}
                    disabled={!slot.is_available}
                    title={slot.is_available ? "" : "Already booked"}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}
          <div className="repeat-control">
            <label className="form-label">Repeat count (plays per slot)</label>
            <div className="repeat-input">
              <button className="btn btn-ghost btn-sm" onClick={() => setRepeatCount(r => Math.max(1, r - 1))}>−</button>
              <span>{repeatCount}×</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setRepeatCount(r => Math.min(20, r + 1))}>+</button>
            </div>
          </div>
          <div className="step-footer">
            <button className="btn btn-ghost" onClick={() => setStep(0)}>
              <ChevronLeft size={16} /> Back
            </button>
            <button
              className="btn btn-primary"
              disabled={selectedSlots.length === 0}
              onClick={() => setStep(2)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Upload ad ─────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="booking-step">
          <h3><Upload size={18} /> Upload Your Ad</h3>
          <p className="step-hint">Accepted formats: JPG, PNG, GIF, MP4, WebM. Max 50 MB.</p>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? "active" : ""} ${adFile ? "has-file" : ""}`}>
            <input {...getInputProps()} />
            {adFile ? (
              <div className="dropzone-preview">
                {adFile.type.startsWith("image/") ? (
                  <img src={URL.createObjectURL(adFile)} alt="Ad preview" />
                ) : (
                  <video src={URL.createObjectURL(adFile)} controls style={{ maxWidth: "100%" }} />
                )}
                <p>{adFile.name} ({(adFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                <span className="text-muted" style={{ fontSize: ".8rem" }}>Click or drag to replace</span>
              </div>
            ) : (
              <div className="dropzone-idle">
                <Upload size={36} color="var(--text-muted)" />
                <p>{isDragActive ? "Drop it here!" : "Drag & drop your ad here, or click to browse"}</p>
                <span className="text-muted">Images or video</span>
              </div>
            )}
          </div>
          <div className="form-group mt-2">
            <label className="form-label">Ad title (optional)</label>
            <input
              className="form-input"
              placeholder="e.g. Summer Sale Campaign"
              value={adTitle}
              onChange={e => setAdTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Display duration per play (seconds)</label>
            <input
              type="number"
              className="form-input"
              value={adDuration}
              min={5}
              max={120}
              onChange={e => setAdDuration(Number(e.target.value))}
            />
          </div>
          <div className="step-footer">
            <button className="btn btn-ghost" onClick={() => setStep(1)}>
              <ChevronLeft size={16} /> Back
            </button>
            <button
              className="btn btn-primary"
              disabled={!adFile}
              onClick={() => setStep(3)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirm ───────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="booking-step">
          <h3><CheckCircle size={18} /> Confirm Booking</h3>
          <div className="confirm-summary">
            <div className="summary-row">
              <span>Board</span>
              <strong>{board.name}</strong>
            </div>
            <div className="summary-row">
              <span>Date</span>
              <strong>{format(selectedDate, "PPP")}</strong>
            </div>
            <div className="summary-row">
              <span>Time</span>
              <strong>
                {format(new Date(startTime), "HH:mm")} – {format(new Date(endTime), "HH:mm")}
              </strong>
            </div>
            <div className="summary-row">
              <span>Slots</span>
              <strong>{selectedSlots.length} × 30 min</strong>
            </div>
            <div className="summary-row">
              <span>Repeat</span>
              <strong>{repeatCount}× per slot</strong>
            </div>
            <div className="summary-row">
              <span>Ad file</span>
              <strong>{adFile?.name}</strong>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <strong>{totalPrice.toFixed(2)} TND</strong>
            </div>
          </div>
          <div className="step-footer">
            <button className="btn btn-ghost" onClick={() => setStep(2)}>
              <ChevronLeft size={16} /> Back
            </button>
            <button
              className="btn btn-primary"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? <><div className="spinner" /> Processing…</> : "Confirm & Proceed to Payment"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Payment ───────────────────────────────────────────────── */}
      {step === 4 && bookingResult && (
        <div className="booking-step">
          <h3>💳 Complete Payment</h3>
          <p className="step-hint">
            Total: <strong>{totalPrice.toFixed(2)} TND</strong>
          </p>
          <PaymentForm
            bookingId={bookingResult.id}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </div>
      )}
    </div>
  );
}