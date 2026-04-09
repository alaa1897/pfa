/**
 * Auth Store (Zustand)
 * --------------------
 * Zustand is a minimal state management library.
 * This store holds authentication state and persists tokens to localStorage.
 *
 * Why Zustand over Redux?
 *   Much simpler API — no actions, reducers, or boilerplate.
 *   Perfect for a project this size.
 */

import { create } from "zustand";
import { authAPI } from "../services/api";

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem("access_token"),
  isLoading: false,
  error: null,

  // ── Actions ────────────────────────────────────────────────────────────────

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authAPI.login(email, password);

      // Store tokens in localStorage so they survive page refreshes
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      // Fetch the user profile immediately after login
      const profileRes = await authAPI.getProfile();
      set({ user: profileRes.data, isAuthenticated: true, isLoading: false });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || "Login failed.";
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.register(formData);
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const message =
        Object.values(error.response?.data || {}).flat().join(" ") ||
        "Registration failed.";
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    try {
      const { data } = await authAPI.getProfile();
      set({ user: data });
    } catch {
      get().logout();
    }
  },
}));

export default useAuthStore;
