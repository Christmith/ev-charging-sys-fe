export type UserRole = "BackOffice" | "StationOperator";

export interface WebUser {
  id?: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  assignedStationId?: string; // Object ID for StationOperator role
  status?: "Active" | "Inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContextType {
  user: WebUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: WebUser;
}

export interface StoredCredentials {
  email: string;
}
