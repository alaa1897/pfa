/**
 * useRobotStore.js — Zustand store for the robot notification system
 *
 * Usage anywhere in the app:
 *   const { notify } = useRobotStore();
 *   notify("success", "Booking confirmed!");
 *   notify("error", "File type not supported. Use: JPG, PNG, MP4, WEBM.");
 *   notify("celebrating", "Payment confirmed! Your ad goes live on schedule.");
 *   notify("warning", "Only 2 minutes left to complete payment.");
 *   notify("info", "Loading your bookings...");
 */
import { create } from "zustand";

const useRobotStore = create((set) => ({
  visible: false,
  state: "info",       // "success" | "error" | "warning" | "info" | "celebrating"
  message: "",
  _timer: null,

  notify: (state, message) => {
    set((s) => {
      // Clear any existing auto-dismiss timer
      if (s._timer) clearTimeout(s._timer);

      // Auto-dismiss: 6s for errors, 5s for celebrating, 4s for others
      const duration = state === "error" ? 6000 : state === "celebrating" ? 5000 : 4000;

      const timer = setTimeout(() => {
        useRobotStore.getState().dismiss();
      }, duration);

      return { visible: true, state, message, _timer: timer };
    });
  },

  dismiss: () => {
    set((s) => {
      if (s._timer) clearTimeout(s._timer);
      return { visible: false, _timer: null };
    });
  },
}));

export default useRobotStore;
