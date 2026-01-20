import { User } from "./user.types";

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
  requiresTwoFactor?: boolean;
}

export interface UserAuth extends User { }
export interface RefreshTokenRequest {
  token: string;
  refreshToken: string;
}

export interface FacebookLoginRequest {
  accessToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface EnableTwoFactorResponse {
  sharedKey: string;
  authenticatorUri: string;
}

export interface VerifyTwoFactorRequest {
  code: string;
}

export interface TwoFactorLoginRequest {
  username: string;
  code: string;
  provider?: string;
}
