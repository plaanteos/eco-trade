import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

interface User {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  accountType?: 'individual' | 'company';
  recyclingCode?: string;
  roles?: string[];
  recyclingAccess?: {
    isAdmin?: boolean;
    isOperator?: boolean;
    isStaff?: boolean;
    adminPointIds?: string[];
    operatorPointIds?: string[];
  };
  ecoCoins: number;
  sustainabilityScore: number;
  country: string;
  currency?: string;
  profileImage?: string;
  totalTransactions?: number;
  productsSold?: number;
  productsBought?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithSupabaseAccessToken: (accessToken: string) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    country: string;
  }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(rawUser: any): User {
  const resolvedId = rawUser?._id || rawUser?.id;
  return {
    ...rawUser,
    _id: resolvedId,
    id: resolvedId,
    ecoCoins: rawUser?.ecoCoins ?? 0,
    sustainabilityScore: rawUser?.sustainabilityScore ?? 0,
    country: rawUser?.country ?? '',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = (newToken: string, newUser: any) => {
    const normalizedUser = normalizeUser(newUser);
    setToken(newToken);
    setUser(normalizedUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
  };

  // Load token and user from localStorage on mount
  useEffect(() => {
    const loadAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(normalizeUser(JSON.parse(storedUser)));
        
        // Try to refresh profile from server
        try {
          const response = await api.getProfile();
          if (response.success && response.data) {
            const refreshedUser = normalizeUser(response.data.user ?? response.data);
            setUser(refreshedUser);
            localStorage.setItem('user', JSON.stringify(refreshedUser));
          }
        } catch (error) {
          console.error('Failed to refresh profile:', error);
          // Keep the cached user if refresh fails
        }
      }

      setIsLoading(false);
    };

    loadAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      
      if (response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;
        applySession(newToken, newUser);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithSupabaseAccessToken = async (accessToken: string) => {
    try {
      const response = await api.loginWithSupabase(accessToken);
      if (response.success && response.data) {
        const { token: newToken, user: newUser } = response.data as any;
        if (!newToken || !newUser) throw new Error('Respuesta OAuth inválida');
        applySession(newToken, newUser);
      } else {
        throw new Error(response.message || 'OAuth login failed');
      }
    } catch (error) {
      console.error('OAuth login error:', error);
      throw error;
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    country: string;
  }) => {
    try {
      const response = await api.register(userData);
      
      if (response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;
        applySession(newToken, newUser);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const refreshProfile = async () => {
    try {
      const response = await api.getProfile();
      if (response.success && response.data) {
        const refreshedUser = normalizeUser(response.data.user ?? response.data);
        setUser(refreshedUser);
        localStorage.setItem('user', JSON.stringify(refreshedUser));
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginWithSupabaseAccessToken,
        register,
        logout,
        refreshProfile,
      }}
    >
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
