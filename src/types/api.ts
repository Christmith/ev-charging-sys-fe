// API Response Types
export interface LoginResponse {
  token: string;
  role: string;
  fullName: string;
  assignedStation?: string; // Object ID for StationOperator role
}

// export interface RefreshTokenResponse {
//   token: string;
//   user: {
//     id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//     role: string;
//   };
// }

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Generic API Response wrapper
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}
