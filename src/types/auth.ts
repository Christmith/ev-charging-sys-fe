export type UserRole = "BackOffice" | "StationOperator";

export interface WebUser {
  fullName: string;
  email: string; // Store email from credentials
  role: UserRole;
  assignedStation?: string; // Object ID for StationOperator role
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
