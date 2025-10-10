// EV Owner entity with NIC as primary key
export interface EVOwner {
  nic: string; // Primary key - Sri Lanka NIC format
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  status: "Active" | "Deactivated";
  createdAt: string;
  updatedAt: string;
}

// API request structure for creating EV owner
export interface CreateEvOwnerRequest {
  email: string;
  nic: string;
  fullName: string;
  phone: string;
  address: string;
  vehicleModel?: string;
  licensePlate?: string;
}

// API response structure for EV owner
export interface EvOwnerApiResponse {
  nic: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  vehicleModel?: string;
  licensePlate?: string;
  status: "Active" | "Deactivated";
  createdAt: string;
  updatedAt: string;
}

// API response structure for EV owner details (with id)
export interface EvOwnerDetailsResponse {
  id: string;
  nic: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  vehicleModel?: string;
  licensePlate?: string;
  status: "Active" | "Deactivated";
  createdAt: string;
  updatedAt: string;
}

// Charging Station entity
export interface Station {
  id: string;
  name: string;
  code?: string;
  acSlots: number;
  dcSlots: number;
  addressLine1: string;
  city: string;
  latitude: number;
  longitude: number;
  googlePlaceId?: string;
  status: "ACTIVE" | "DEACTIVATED";
  operatorUserId?: string; // For backward compatibility
  operatorIds?: string[]; // Array of assigned operator IDs
  createdAt: string;
  updatedAt: string;
}

// API response structure for stations
export interface StationApiResponse {
  id: string;
  stationName: string;
  stationCode: string;
  acChargingSlots: number;
  dcChargingSlots: number;
  acSlots: string[];
  dcSlots: string[];
  acPowerOutput: string | null;
  acConnector: string;
  acChargingTime: string | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  latitude: string;
  longitude: string;
  totalCapacity: number;
  status: "Active" | "Inactive";
  additionalNotes: string;
  assignedOperators: Array<{
    id: string;
    fullName: string;
    email: string;
  }>;
  upcomingBookings: unknown[];
}

// Station Schedule (weekly template)
export interface StationSchedule {
  stationId: string;
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday
  windows: Array<{
    start: string; // HH:mm format
    end: string; // HH:mm format
    availableSlots: number;
  }>;
}

// Schedule Exception (special dates override template)
export interface ScheduleException {
  stationId: string;
  date: string; // YYYY-MM-DD
  windows: Array<{
    start: string;
    end: string;
    availableSlots: number;
  }>;
  note?: string;
}

// Booking entity
export interface Booking {
  id: string;
  ownerNIC: string; // FK to EVOwner.nic
  ownerName?: string; // Denormalized for display
  stationId: string; // FK to Station.id
  stationName?: string; // Denormalized for display
  chargingSlot?: {
    type: "AC" | "DC";
    slotNumber: number;
  };
  status: "PENDING" | "APPROVED" | "CANCELLED" | "COMPLETED";
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  cancelReason?: string;
  notes?: string;
}

// API response structure for booking (from backend)
export interface BookingApiResponse {
  id: string;
  evOwnerId: string;
  evOwnerName: string;
  evOwnerNIC: string;
  stationId: string;
  stationName: string;
  stationCode: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  slotType: "AC" | "DC";
  slotId: string | null;
  status: "Pending" | "Approved" | "Completed" | "Cancelled";
  qrCodeBase64: string;
  bookingDate: string; // ISO datetime
  createdAt: string;
  updatedAt: string;
}

// Dashboard KPI data
export interface DashboardStats {
  pendingReservations: number;
  approvedFutureReservations: number;
  activeStations: number;
  deactivatedStations: number;
  sameDayCapacity: {
    total: number;
    booked: number;
  };
}

// Audit Log entry
export interface AuditLogEntry {
  id: string;
  entityType: "Booking" | "EVOwner" | "Station" | "WebUser";
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "ACTIVATE" | "DEACTIVATE";
  actorId: string;
  actorName: string;
  timestamp: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// Filter and pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface BookingFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: Booking["status"];
  stationId?: string;
  ownerNIC?: string;
  type?: "AC" | "DC";
}

export interface OwnerFilters {
  status?: EVOwner["status"];
  city?: string;
  search?: string;
}

export interface StationFilters {
  status?: Station["status"];
  type?: "AC" | "DC";
  city?: string;
  operatorUserId?: string;
}

// Slot availability check response
export interface SlotAvailabilityResponse {
  isAvailable: boolean;
  availableSlotIds: string[];
  message: string;
}

// Booking creation response
export interface BookingCreationResponse {
  message: string;
}
