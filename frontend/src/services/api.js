/**
 * API Service
 * -----------
 * Central Axios instance for all API calls.
 *
 * Key features:
 *  - Automatically attaches the JWT access token to every request
 *  - Automatically refreshes the access token when it expires (401 response)
 *  - Redirects to login if refresh also fails
 */

import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "";

// Create a single Axios instance used throughout the app
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor ──────────────────────────────────────────────────────
// Runs before every request. Reads the access token from localStorage and
// attaches it as a Bearer token in the Authorization header.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ─────────────────────────────────────────────────────
// Runs after every response. If we get a 401 (token expired), we try to
// get a new access token using the refresh token. If that fails, log out.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh/`, {
          refresh: refreshToken,
        });
        localStorage.setItem("access_token", data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest); // Retry the original request
      } catch {
        // Refresh failed — clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth endpoints ───────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    api.post("/api/auth/login/", { email, password }),

  register: (data) =>
    api.post("/api/v1/accounts/register/", data),

  getProfile: () =>
    api.get("/api/v1/accounts/profile/"),
};

// ── Boards endpoints ─────────────────────────────────────────────────────────
export const boardsAPI = {
  // Lightweight list for the map (only active boards, minimal fields)
  getMapBoards: () =>
    api.get("/api/v1/boards/map/"),

  // Full detail for a single board (shown in the booking sidebar)
  getBoardDetail: (id) =>
    api.get(`/api/v1/boards/${id}/`),

  // Admin: list all boards
  getAllBoards: (params) =>
    api.get("/api/v1/boards/", { params }),

  // Admin: create / update / delete
  createBoard: (data) =>
    api.post("/api/v1/boards/", data),

  updateBoard: (id, data) =>
    api.patch(`/api/v1/boards/${id}/`, data),

  deleteBoard: (id) =>
    api.delete(`/api/v1/boards/${id}/`),
};

// ── Bookings endpoints ───────────────────────────────────────────────────────
export const bookingsAPI = {
  // Check which 30-min slots are free on a given date for a given board
  getAvailability: (boardId, date) =>
    api.get("/api/v1/bookings/availability/", {
      params: { board_id: boardId, date },
    }),

  // Create a new booking
  createBooking: (data) =>
    api.post("/api/v1/bookings/", data),

  // List the current user's bookings
  getMyBookings: () =>
    api.get("/api/v1/bookings/"),

  // Cancel a booking
  cancelBooking: (id) =>
    api.post(`/api/v1/bookings/${id}/cancel/`),

  // Admin: all bookings
  getAllBookings: () =>
    api.get("/api/v1/bookings/all/"),
};

// ── Ads endpoints ────────────────────────────────────────────────────────────
export const adsAPI = {
  // Upload ad creative (must use multipart/form-data for file upload)
  uploadAd: (formData) =>
    api.post("/api/v1/ads/upload/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getMyAds: () =>
    api.get("/api/v1/ads/"),
};

export default api;
