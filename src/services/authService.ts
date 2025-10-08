import api from "./api";
import {
  WebUser,
  LoginRequest,
  UserRole,
  StoredCredentials,
} from "@/types/auth";
import { LoginResponse } from "@/types/api";

class AuthService {
  private static TOKEN_KEY = "ev_system_token";
  private static USER_KEY = "ev_system_user";
  private static CREDENTIALS_KEY = "ev_system_credentials";

  /**
   * Login user with email and password
   */
  static async login(
    credentials: LoginRequest
  ): Promise<{ token: string; user: WebUser }> {
    try {
      const response = await api.post<LoginResponse>(
        "/Auth/login",
        credentials
      );
      const data = response.data;

      // Create user object from API response
      const user: WebUser = {
        fullName: data.fullName || "Station User",
        email: credentials.email, // Store email from credentials
        role: (data.role === "Backoffice"
          ? "BackOffice"
          : data.role) as UserRole,
        assignedStation: data.assignedStation, // Only present for StationOperator
      };

      return { token: data.token, user };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get stored token from localStorage
   */
  static getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored user from localStorage
   */
  static getStoredUser(): WebUser | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Get stored credentials from localStorage
   */
  static getStoredCredentials(): StoredCredentials | null {
    const credentialsJson = localStorage.getItem(this.CREDENTIALS_KEY);
    return credentialsJson ? JSON.parse(credentialsJson) : null;
  }

  /**
   * Store authentication data in localStorage
   */
  static storeAuth(
    token: string,
    user: WebUser,
    credentials: StoredCredentials
  ): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(credentials));
  }

  /**
   * Clear authentication data from localStorage
   */
  static clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.CREDENTIALS_KEY);
  }

  /**
   * Validate JWT token
   */
  static async validateToken(token: string): Promise<WebUser> {
    try {
      const storedUser = this.getStoredUser();
      if (!storedUser) {
        throw new Error("No stored user found");
      }

      // Basic JWT validation - check if token is not expired
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        if (payload.exp && payload.exp < currentTime) {
          throw new Error("Token has expired");
        }
      } catch (jwtError) {
        throw new Error("Invalid token format");
      }

      return storedUser;
    } catch (error) {
      throw new Error("Token validation failed");
    }
  }

  /**
   * Refresh token (if your API supports it)
   */
  // static async refreshToken(): Promise<{ token: string; user: WebUser }> {
  //   try {
  //     const response = await api.post("/auth/refresh");
  //     const data = response.data;

  //     // Get stored credentials to maintain email
  //     const storedCredentials = this.getStoredCredentials();
  //     const storedUser = this.getStoredUser();

  //     const user: WebUser = {
  //       fullName: data.fullName || storedUser?.fullName || "User",
  //       email: storedCredentials?.email || storedUser?.email || "",
  //       role: (data.role === "Backoffice"
  //         ? "BackOffice"
  //         : data.role) as UserRole,
  //       assignedStation: data.assignedStation || storedUser?.assignedStation,
  //     };

  //     return { token: data.token, user };
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      // Call logout endpoint if your API has one
      await api.post("/auth/logout");
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.warn("Logout API call failed, but clearing local storage");
    } finally {
      this.clearAuth();
    }
  }
}

export default AuthService;
