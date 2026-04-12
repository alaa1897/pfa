/**
 * BoardsMap Component
 * --------------------
 * The main interactive map showing all digital boards as clickable markers.
 *
 * When a marker is clicked:
 *  - A popup appears with the board's name, city, and price
 *  - A sidebar slides in with full board details
 *  - The user can click "Book This Board" to start the booking flow
 *
 * Uses react-leaflet which wraps Leaflet.js in React components.
 * Board data is fetched from GET /api/v1/boards/map/
 */
import "leaflet/dist/leaflet.css";
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { boardsAPI } from "../../services/api";
import BoardSidebar from "./BoardSidebar";
import "./BoardsMap.css";

// Fix Leaflet's default icon path issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Custom marker icons — blue for active boards, grey for inactive
const activeIcon = L.divIcon({
  className: "custom-marker",
  html: `<div class="marker-pin active"></div>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
});

const inactiveIcon = L.divIcon({
  className: "custom-marker",
  html: `<div class="marker-pin inactive"></div>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
});

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}
export default function BoardsMap() {
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    boardsAPI.getMapBoards()
      .then(({ data }) => setBoards(data))
      .catch(() => setError("Failed to load boards. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkerClick = async (board) => {
    try {
      const { data } = await boardsAPI.getBoardDetail(board.id);
      setSelectedBoard(data);
    } catch {
      setSelectedBoard(board);
    }
  };

  if (loading) return (
    <div className="map-loading">
      <div className="spinner" />
      <p>Loading boards…</p>
    </div>
  );

  if (error) return (
    <div className="map-error">
      <p>{error}</p>
    </div>
  );

  return (
    <div className="map-wrapper">
      <MapContainer

        center={[36.8065, 10.1815]}   // Centred on Tunis
        zoom={12}
        className="leaflet-map"
      >
        <InvalidateSize />
        {/* OpenStreetMap tiles — free, no API key required */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {boards.map((board) => (
          <Marker
            key={board.id}
            position={[parseFloat(board.latitude), parseFloat(board.longitude)]}
            icon={board.status === "active" ? activeIcon : inactiveIcon}
            eventHandlers={{ click: () => handleMarkerClick(board) }}
          >
            <Popup>
              <div className="map-popup">
                <strong>{board.name}</strong>
                <span>{board.city}</span>
                <span className={`badge badge-${board.status}`}>{board.status}</span>
                <span className="popup-price">{board.price_per_slot} TND / slot</span>
                {board.status === "active" && (
                  <button
                    className="btn btn-primary btn-sm btn-block mt-1"
                    onClick={() => navigate(`/board/${board.id}/book`)}
                  >
                    Book This Board
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Sidebar slides in when a board is selected */}
      {selectedBoard && (
        <BoardSidebar
          board={selectedBoard}
          onClose={() => setSelectedBoard(null)}
          onBook={() => navigate(`/board/${selectedBoard.id}/book`)}
        />
      )}

      {/* Board count badge */}
      <div className="map-stats">
        <span>{boards.filter(b => b.status === "active").length} active boards</span>
      </div>
    </div>
  );
}
