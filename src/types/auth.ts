export type UserRole = 'BackOffice' | 'StationOperator';

export interface WebUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  assignedStationIds?: string[];
  status: 'ACTIVE' | 'DISABLED';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
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