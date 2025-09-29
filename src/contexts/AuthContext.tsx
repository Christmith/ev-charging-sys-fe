import React, { createContext, useContext, useEffect, useState } from 'react';
import { WebUser, AuthContextType, LoginRequest } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock API service - replace with actual API calls
class AuthService {
  private static TOKEN_KEY = 'ev_system_token';
  private static USER_KEY = 'ev_system_user';

  static async login(credentials: LoginRequest): Promise<{ token: string; user: WebUser }> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock users for demo
    const mockUsers: WebUser[] = [
      {
        id: '1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@evsystem.com',
        role: 'BackOffice',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        firstName: 'Operator',
        lastName: 'User',
        email: 'operator@evsystem.com',
        role: 'StationOperator',
        assignedStationIds: ['station-1', 'station-2'],
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    const user = mockUsers.find(u => u.email === credentials.email);
    
    if (!user || credentials.password !== 'password') {
      throw new Error('Invalid credentials');
    }

    const token = `mock_token_${user.id}`;
    return { token, user };
  }

  static getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getStoredUser(): WebUser | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  static storeAuth(token: string, user: WebUser): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static async validateToken(token: string): Promise<WebUser> {
    // Simulate token validation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const storedUser = this.getStoredUser();
    if (!storedUser || !token.includes(storedUser.id)) {
      throw new Error('Invalid token');
    }
    
    return storedUser;
  }
}

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
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.clearAuth();
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}