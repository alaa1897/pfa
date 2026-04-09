/**
 * SimulatorPage
 * -------------
 * This page renders the fullscreen board simulator.
 * It is intentionally public (no auth required) so it can run on a
 * dedicated screen without needing to log in.
 *
 * Open in a browser tab at: /simulator/<board_id>
 * The board connects to the backend WebSocket and waits for scheduled ads.
 */
import React from "react";
import BoardSimulator from "../components/Board/BoardSimulator";

export default function SimulatorPage() {
  return <BoardSimulator />;
}
