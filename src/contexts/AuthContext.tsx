import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../config/api';
import type { User, AuthContextType, LoginResponse, JWTPayload } from '../types/Auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedCarId, setSelectedCarIdState] = useState<number | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    console.log('AuthContext: Initializing from localStorage');
    const storedToken = localStorage.getItem('auth_token');
    console.log('AuthContext: Stored token exists:', !!storedToken);
    
    if (storedToken) {
      try {
        const decoded = jwtDecode<JWTPayload>(storedToken);
        console.log('AuthContext: Decoded token:', { userId: decoded.userId, email: decoded.email, selectedCarId: decoded.selectedCarId });
        
        // Check if token is expired
        if (decoded.exp * 1000 > Date.now()) {
          setToken(storedToken);
          const userData = {
            id: decoded.userId,
            email: decoded.email,
            name: '', // Will be fetched from API
            selectedCarId: decoded.selectedCarId,
            created_at: new Date(),
            updated_at: new Date()
          };
          setUser(userData);
          setSelectedCarIdState(decoded.selectedCarId || null);
          console.log('AuthContext: User set from token:', userData);
        } else {
          console.log('AuthContext: Token expired');
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('AuthContext: Invalid token:', error);
        localStorage.removeItem('auth_token');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data: LoginResponse = await response.json();
      
      setToken(data.token);
      setUser(data.user);
      setSelectedCarIdState(data.user.selectedCarId || null);
      
      localStorage.setItem('auth_token', data.token);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = (): void => {
    setToken(null);
    setUser(null);
    setSelectedCarIdState(null);
    localStorage.removeItem('auth_token');
  };

  const setSelectedCar = async (carId: number): Promise<void> => {
    if (!token || !user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/select-car`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ carId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update selected car');
      }

      const data = await response.json();
      
      // Update token with new selectedCarId
      setToken(data.token);
      setUser(prev => prev ? { ...prev, selectedCarId: carId } : null);
      setSelectedCarIdState(carId);
      
      localStorage.setItem('auth_token', data.token);
    } catch (error) {
      console.error('Error updating selected car:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    selectedCarId,
    login,
    logout,
    setSelectedCar,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
