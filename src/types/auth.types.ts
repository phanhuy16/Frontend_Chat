import { StatusUser } from "./enums";

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: UserAuth;
  token?: string;
  refreshToken?: string;
  expiresIn?: Date;
}

export interface UserAuth {
  id: number;
  userName: string;
  email: string;
  displayName: string;
  avatar: string;
  status: StatusUser;
}
export interface RefreshTokenRequest {
  token: string;
  refreshToken: string;
}