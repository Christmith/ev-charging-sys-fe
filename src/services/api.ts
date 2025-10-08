import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";

// Create Axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: "http://localhost:5148/api",
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ev_system_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle common error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear stored auth and redirect to login
      localStorage.removeItem("ev_system_token");
      localStorage.removeItem("ev_system_user");
      window.location.href = "/login";
    }

    // Transform error for consistent handling
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";

    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
