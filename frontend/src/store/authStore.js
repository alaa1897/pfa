/**
 * authStore.js — Zustand auth store
 * Adds registerAndLogin() so sign-up auto-logs the user in immediately.
 */
import { create } from "zustand";
import { authAPI } from "../services/api";

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem("access_token"),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authAPI.login(email, password);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
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

  // Register + immediately log in — no redirect to /login needed
  registerAndLogin: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.register(formData);
      const { data } = await authAPI.login(formData.email, formData.password);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      const profileRes = await authAPI.getProfile();
      set({ user: profileRes.data, isAuthenticated: true, isLoading: false });
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
