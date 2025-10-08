import React, { createContext, useContext, useEffect, useState } from "react";
import { WebUser, AuthContextType } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";
import AuthService from "@/services/authService";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WebUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for stored authentication on mount
    const initAuth = async () => {
      try {
        const token = AuthService.getStoredToken();
        if (token) {
          const user = await AuthService.validateToken(token);
          setUser(user);
        }
      } catch (error) {
        // Clear invalid stored auth
        AuthService.clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { token, user } = await AuthService.login({ email, password });

      AuthService.storeAuth(token, user);
      setUser(user);

      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.firstName} ${user.lastName}`,
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description:
          error instanceof Error
            ? error.message
            : "Please check your credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      // Even if logout fails, clear local state
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out",
      });
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
