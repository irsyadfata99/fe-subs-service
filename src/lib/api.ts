// File: src/lib/api.ts
// Production-ready Axios configuration

import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";

// Construct base URL with /api suffix
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const BASE_URL = API_BASE_URL.endsWith("/api") ? API_BASE_URL : `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 second timeout
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      Cookies.remove("token");

      // Only redirect if not already on login/register page
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
        window.location.href = "/login";
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error("Access forbidden");
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error("Resource not found:", error.config?.url);
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error("Server error:", error.response.data);
    }

    // Handle network errors
    if (error.message === "Network Error") {
      console.error("Network error - please check your connection");
    }

    return Promise.reject(error);
  }
);

// Helper function to check API health (useful for debugging)
export const checkApiHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log("✅ API Health Check:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ API Health Check Failed:", error);
    throw error;
  }
};

// Export base URL for reference (useful for debugging)
export const getBaseUrl = () => BASE_URL;

export default api;
