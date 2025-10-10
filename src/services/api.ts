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

  // Get all stations
  getAllStations: async () => {
    const response = await api.get("/stations/all");
    return response.data;
  },

  // Get unassigned operators
  getUnassignedOperators: async () => {
    const response = await api.get("/Stations/unassigned-operators");
    return response.data;
  },

  // Get all operational users
  getOperationalUsers: async () => {
    const response = await api.get("/Admin/operational-users");
    return response.data;
  },

  // Create a new charging station
  createStation: async (stationData: {
    stationName: string;
    stationCode?: string;
    acChargingSlots: number;
    dcChargingSlots: number;
    stationOperatorIds?: string[];
    addressLine1: string;
    addressLine2?: string;
    city: string;
    latitude: string;
    longitude: string;
    googlePlaceID?: string;
    additionalNotes?: string;
    status: "Active" | "Inactive";
  }) => {
    const response = await api.post("/stations", stationData);
    return response.data;
  },

  // Update an existing charging station
  updateStation: async (
    stationId: string,
    stationData: {
      stationName: string;
      stationCode?: string;
      acChargingSlots: number;
      dcChargingSlots: number;
      stationOperatorIds?: string[];
      addressLine1: string;
      addressLine2?: string;
      city: string;
      latitude: string;
      longitude: string;
      googlePlaceID?: string;
      additionalNotes?: string;
      status: "Active" | "Inactive";
    }
  ) => {
    const response = await api.patch(`/Stations/${stationId}`, stationData);
    return response.data;
  },

  // Update station status (activate/deactivate)
  updateStationStatus: async (
    stationId: string,
    status: "Active" | "Inactive"
  ) => {
    const response = await api.patch(`/Stations/${stationId}`, { status });
    return response.data;
  },

  // Delete a charging station
  deleteStation: async (stationId: string) => {
    const response = await api.delete(`/stations/${stationId}`);
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

  // Get all operational users
  getOperationalUsers: async () => {
    const response = await api.get("/admin/operational-users");
    return response.data;
  },
};

// EV Owner API functions
export const evOwnerApi = {
  // Create a new EV owner
  createEvOwner: async (ownerData: {
    email: string;
    nic: string;
    fullName: string;
    phone: string;
    address: string;
    vehicleModel?: string;
    licensePlate?: string;
  }) => {
    const response = await api.post("/Admin/create-evowner", ownerData);
    return response.data;
  },

  // Get all EV owners
  getAllEvOwners: async () => {
    const response = await api.get("/evowners");
    return response.data;
  },

  // Update an existing EV owner
  updateEvOwner: async (
    nic: string,
    ownerData: {
      fullName?: string;
      phone?: string;
      address?: string;
      vehicleModel?: string;
      licensePlate?: string;
      status?: string;
    }
  ) => {
    const response = await api.patch(`/evowners/${nic}`, ownerData);
    return response.data;
  },

  // Delete an EV owner
  deleteEvOwner: async (nic: string) => {
    const response = await api.delete(`/evowners/${nic}`);
    return response.data;
  },

  // Update EV owner status (activate/deactivate)
  updateEvOwnerStatus: async (
    nic: string,
    status: "Active" | "Deactivated"
  ) => {
    const response = await api.patch(`/evowners/${nic}`, {
      status,
    });
    return response.data;
  },

  // Get EV owner details by NIC
  getEvOwnerByNIC: async (nic: string) => {
    const response = await api.get(`/evowners/details/${nic}`);
    return response.data;
  },
};

// Booking API functions
export const bookingApi = {
  // Check slot availability
  checkAvailability: async (availabilityData: {
    evOwnerId: string;
    stationId: string;
    slotType: "AC" | "DC";
    slotId: string;
    startTime: string;
    endTime: string;
    vehicleModel?: string;
    licensePlate?: string;
  }) => {
    const response = await api.post(
      "/Booking/check-availability",
      availabilityData
    );
    return response.data;
  },

  // Create a new booking
  createBooking: async (bookingData: {
    evOwnerId: string;
    stationId: string;
    slotType: "AC" | "DC";
    slotId: string;
    startTime: string;
    endTime: string;
    vehicleModel?: string;
    licensePlate?: string;
  }) => {
    const response = await api.post("/booking", bookingData);
    return response.data;
  },

  // Get all bookings for Backoffice
  getAllBookings: async () => {
    const response = await api.get("/Booking/all");
    return response.data;
  },

  // Get bookings by station for StationOperator
  getBookingsByStation: async (stationId: string) => {
    const response = await api.get(`/Booking/station/${stationId}`);
    return response.data;
  },

  // Approve a booking
  approveBooking: async (bookingId: string) => {
    const response = await api.post(`/Booking/${bookingId}/approve`);
    return response.data;
  },

  // Cancel/Delete a booking
  cancelBooking: async (bookingId: string) => {
    const response = await api.delete(`/Booking/${bookingId}`);
    return response.data;
  },

  // Permanently delete a booking
  permanentlyDeleteBooking: async (bookingId: string) => {
    const response = await api.delete(`/Booking/${bookingId}/permanent`);
    return response.data;
  },

  // Update a booking
  updateBooking: async (
    bookingId: string,
    bookingData: {
      evOwnerId: string;
      stationId: string;
      slotType: "AC" | "DC";
      slotId: string;
      startTime: string;
      endTime: string;
      vehicleModel?: string;
      licensePlate?: string;
    }
  ) => {
    const response = await api.put(`/Booking/${bookingId}`, bookingData);
    return response.data;
  },
};

export default api;
