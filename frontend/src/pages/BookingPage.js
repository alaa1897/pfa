import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import Navbar from "../components/Common/Navbar";
import BookingForm from "../components/Booking/BookingForm";
import { boardsAPI } from "../services/api";
import "./BookingPage.css";

export default function BookingPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    boardsAPI.getBoardDetail(boardId)
      .then(({ data }) => setBoard(data))
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [boardId]);

  if (loading) return (
    <div className="page">
      <Navbar />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", flex:1 }}>
        <div className="spinner" />
      </div>
    </div>
  );

  return (
    <div className="page">
      <Navbar />
      <div className="booking-page">
        {/* Left panel: board info */}
        <aside className="booking-aside">
          <button className="btn btn-ghost btn-sm back-btn" onClick={() => navigate("/")}>
            <ArrowLeft size={15} /> Back to map
          </button>
          <div className="board-info-card card">
            {board.thumbnail && (
              <img src={board.thumbnail} alt={board.name} className="board-info-img" />
            )}
            <div className="card-body">
              <h2>{board.name}</h2>
              <div className="flex items-center gap-1 text-muted" style={{ fontSize:".875rem", marginTop:".35rem" }}>
                <MapPin size={13} />
                <span>{board.address}, {board.city}</span>
              </div>
              {board.description && (
                <p style={{ fontSize:".875rem", color:"var(--text-muted)", marginTop:".75rem", lineHeight:1.6 }}>
                  {board.description}
                </p>
              )}
              <div className="board-specs">
                <div className="spec-item">
                  <span>Resolution</span>
                  <strong>{board.resolution}</strong>
                </div>
                <div className="spec-item">
                  <span>Size</span>
                  <strong>{board.width_cm}×{board.height_cm} cm</strong>
                </div>
                <div className="spec-item">
                  <span>Price</span>
                  <strong>{board.price_per_slot} TND / slot</strong>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right panel: booking form */}
        <main className="booking-main">
          <h1 style={{ marginBottom:"1.5rem" }}>Book this board</h1>
          <div className="card">
            <div className="card-body">
              <BookingForm board={board} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
