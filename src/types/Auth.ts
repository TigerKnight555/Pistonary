export interface User {
  id: number;
  email: string;
  name: string;
  selectedCarId?: number;
  created_at: Date;
  updated_at: Date;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  selectedCarId: number | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setSelectedCar: (carId: number) => void;
  isAuthenticated: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  selectedCarId?: number;
  iat: number;
  exp: number;
}
