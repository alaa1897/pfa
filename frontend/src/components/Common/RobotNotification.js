/**
 * RobotNotification.js
 * Global robot notification component — mount once in App.js.
 * Slides in from the bottom-right corner when notify() is called.
 *
 * States:
 *   success     — big smile, green antenna
 *   error       — sad face, eyes down, red antenna
 *   warning     — neutral face, one eyebrow raised, amber antenna
 *   info        — normal face, looking left, blue antenna
 *   celebrating — big smile, raised arm, confetti, green fast antenna
 */
import React from "react";
import useRobotStore from "../../store/useRobotStore";
import "./RobotNotification.css";

// ── Robot face configs per state ─────────────────────────────────────────────
const CONFIGS = {
  success: {
    antennaColor: "#10b981",
    antennaAnim: "antennaPulse 1.5s ease-in-out infinite",
    eyeColor: "#2563eb",
    pupilColor: "#93c5fd",
    smilePath: "M24 38 Q38 47 52 38",
    smileColor: "#10b981",
    eyebrowLeft: null,
    eyebrowRight: null,
    raised: false,
    confetti: false,
  },
  error: {
    antennaColor: "#ef4444",
    antennaAnim: "antennaPulse 0.8s ease-in-out infinite",
    eyeColor: "#ef4444",
    pupilColor: "#fca5a5",
    smilePath: "M24 44 Q38 36 52 44",   // frown
    smileColor: "#ef4444",
    eyebrowLeft: "M23 22 Q29 19 35 22",  // sad brows
    eyebrowRight: "M41 22 Q47 19 53 22",
    raised: false,
    confetti: false,
  },
  warning: {
    antennaColor: "#f59e0b",
    antennaAnim: "antennaPulse 1.2s ease-in-out infinite",
    eyeColor: "#f59e0b",
    pupilColor: "#fde68a",
    smilePath: "M26 41 Q38 41 50 41",   // flat mouth
    smileColor: "#f59e0b",
    eyebrowLeft: "M23 21 Q29 18 35 21",
    eyebrowRight: "M41 19 Q47 22 53 19", // one brow raised
    raised: false,
    confetti: false,
  },
  info: {
    antennaColor: "#2563eb",
    antennaAnim: "antennaPulse 2s ease-in-out infinite",
    eyeColor: "#2563eb",
    pupilColor: "#93c5fd",
    smilePath: "M26 40 Q38 45 50 40",
    smileColor: "#10b981",
    eyebrowLeft: null,
    eyebrowRight: null,
    raised: false,
    confetti: false,
  },
  celebrating: {
    antennaColor: "#10b981",
    antennaAnim: "antennaPulse 0.6s ease-in-out infinite",
    eyeColor: "#2563eb",
    pupilColor: "#93c5fd",
    smilePath: "M22 38 Q38 50 54 38",   // big smile
    smileColor: "#10b981",
    eyebrowLeft: null,
    eyebrowRight: null,
    raised: true,
    confetti: true,
  },
};

// ── Robot SVG ─────────────────────────────────────────────────────────────────
function RobotFace({ state }) {
  const c = CONFIGS[state] || CONFIGS.info;

  return (
    <svg width="90" height="110" viewBox="0 0 90 110"
      xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      <g style={{ animation: "bodyBounce 2.2s ease-in-out infinite",
                  transformOrigin: "45px 92px" }}>
        {/* Feet */}
        <rect x="19" y="101" width="13" height="8" rx="4" fill="#334155"/>
        <rect x="38" y="101" width="13" height="8" rx="4" fill="#334155"/>
        {/* Legs */}
        <rect x="22" y="86" width="8" height="17" rx="3" fill="#475569"/>
        <rect x="40" y="86" width="8" height="17" rx="3" fill="#475569"/>
        {/* Torso */}
        <rect x="11" y="55" width="48" height="34" rx="8" fill="#334155"/>
        <rect x="17" y="62" width="16" height="9" rx="3" fill="#1e293b"/>
        <circle cx="21" cy="67" r="1.8" fill="#10b981"/>
        <circle cx="27" cy="67" r="1.8" fill="#f59e0b"/>
        <circle cx="32" cy="67" r="1.5" fill="#ef4444"/>
        <rect x="17" y="75" width="34" height="4" rx="2" fill="#1e293b"/>
        <rect x="19" y="76" width="10" height="2" rx="1" fill="#2563eb"/>
        {/* Left arm */}
        <g style={{ animation: "armWave 3s ease-in-out infinite",
                    transformOrigin: "11px 61px" }}>
          <rect x="3" y="57" width="10" height="7" rx="3" fill="#475569"/>
          <rect x="4" y="59" width="8" height="18" rx="3" fill="#475569"/>
        </g>
        {/* Right arm — raised for celebrating, wave otherwise */}
        {c.raised ? (
          <g style={{ animation: "raisedArmBounce 1.4s ease-in-out infinite",
                      transformOrigin: "59px 50px" }}>
            <rect x="57" y="48" width="10" height="7" rx="3" fill="#475569"/>
            <rect x="58" y="30" width="8" height="26" rx="3" fill="#475569"/>
          </g>
        ) : (
          <g style={{ animation: "armWave 3s .8s ease-in-out infinite",
                      transformOrigin: "59px 61px" }}>
            <rect x="57" y="57" width="10" height="7" rx="3" fill="#475569"/>
            <rect x="58" y="59" width="8" height="18" rx="3" fill="#475569"/>
          </g>
        )}
        {/* Confetti */}
        {c.confetti && (
          <>
            <circle style={{ animation: "confettiSpin 1.8s linear infinite" }}
              cx="72" cy="28" r="3" fill="#f59e0b"/>
            <circle style={{ animation: "confettiSpin 1.8s .4s linear infinite" }}
              cx="82" cy="18" r="2.5" fill="#10b981"/>
            <circle style={{ animation: "confettiSpin 1.8s .8s linear infinite" }}
              cx="68" cy="16" r="2" fill="#ef4444"/>
            <circle style={{ animation: "confettiSpin 1.8s 1.2s linear infinite" }}
              cx="80" cy="34" r="2" fill="#2563eb"/>
          </>
        )}
        {/* Neck */}
        <rect x="31" y="46" width="13" height="11" rx="3" fill="#475569"/>
        {/* Head */}
        <g style={{ animation: "headWiggle 4s ease-in-out infinite",
                    transformOrigin: "38px 30px" }}>
          <rect x="14" y="12" width="42" height="36" rx="9" fill="#334155"/>
          <rect x="19" y="18" width="32" height="23" rx="5" fill="#0f172a"/>
          {/* Eyebrows */}
          {c.eyebrowLeft && (
            <path d={c.eyebrowLeft} fill="none"
              stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
          )}
          {c.eyebrowRight && (
            <path d={c.eyebrowRight} fill="none"
              stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
          )}
          {/* Left eye */}
          <g style={{ animation: "blink 3.5s ease-in-out infinite",
                      transformOrigin: "29px 30px" }}>
            <rect x="21" y="23" width="11" height="8" rx="3"
              fill={c.eyeColor}/>
            <circle style={{ animation: "eyeLookLeft 5s ease-in-out infinite" }}
              cx="27" cy="27" r="2.5" fill={c.pupilColor}/>
          </g>
          {/* Right eye */}
          <g style={{ animation: "doubleBlink 3.5s 1.2s ease-in-out infinite",
                      transformOrigin: "45px 30px" }}>
            <rect x="38" y="23" width="11" height="8" rx="3"
              fill={c.eyeColor}/>
            <circle style={{ animation: "eyeLookLeft 5s .3s ease-in-out infinite" }}
              cx="44" cy="27" r="2.5" fill={c.pupilColor}/>
          </g>
          {/* Mouth */}
          <path d={c.smilePath} fill="none"
            stroke={c.smileColor} strokeWidth="2.5" strokeLinecap="round"/>
          {/* Antenna */}
          <rect x="34" y="3" width="4" height="11" rx="2" fill="#475569"/>
          <circle style={{ animation: c.antennaAnim }}
            cx="36" cy="2" r="5" fill={c.antennaColor}/>
        </g>
      </g>
    </svg>
  );
}

// ── Labels per state ──────────────────────────────────────────────────────────
const STATE_LABELS = {
  success:     "Success",
  error:       "Oops!",
  warning:     "Heads up!",
  info:        "Hey!",
  celebrating: "Woohoo!",
};

const STATE_COLORS = {
  success:     "#10b981",
  error:       "#ef4444",
  warning:     "#f59e0b",
  info:        "#2563eb",
  celebrating: "#10b981",
};

// ── Main component ────────────────────────────────────────────────────────────
export default function RobotNotification() {
  const { visible, state, message, dismiss } = useRobotStore();

  return (
    <div className={`rn-wrap ${visible ? "rn-visible" : ""}`}>
      <div className={`rn-card rn-${state}`}>
        {/* Dismiss button */}
        <button className="rn-close" onClick={dismiss}>✕</button>

        {/* Robot */}
        <div className="rn-robot">
          <RobotFace state={state} />
        </div>

        {/* Message */}
        <div className="rn-content">
          <div className="rn-label" style={{ color: STATE_COLORS[state] }}>
            {STATE_LABELS[state]}
          </div>
          <div className="rn-message">{message}</div>
        </div>
      </div>
    </div>
  );
}
