export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin'
}

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  avatar: string;
  creationAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
} 