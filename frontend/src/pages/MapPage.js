/**
 * MapPage — the home screen, shows the board map
 */
import React from "react";
import Navbar from "../components/Common/Navbar";
import BoardsMap from "../components/Map/BoardsMap";

export default function MapPage() {
  return (
    <div className="page">
      <Navbar />
      <BoardsMap />
    </div>
  );
}
