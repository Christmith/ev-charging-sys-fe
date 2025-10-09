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
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      "An unexpected error occurred";

    return Promise.reject(new Error(errorMessage));
  }
);

// Station API functions
export const stationApi = {
  // Get all stations available for assignment
  getAllStationsForAssignment: async () => {
    const response = await api.get("/Stations/stations/all-for-assignment");
    return response.data;
  },
};

// User API functions
export const userApi = {
  // Create operational user (Backoffice or StationOperator)
  createOperationalUser: async (userData: {
    email: string;
    password: string;
    role: "Backoffice" | "StationOperator";
    fullName: string;
    phone?: string;
    assignedStationId?: string | null;
  }) => {
    const response = await api.post("/auth/create-operational-user", userData);
    return response.data;
  },
};

export default api;
