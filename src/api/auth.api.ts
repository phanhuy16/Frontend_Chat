import { AuthResponse, LoginRequest, RefreshTokenRequest, RegisterRequest, UserAuth } from "../types/auth.types";
import axiosInstance from "./axios";

export const authApi = {
  register: (data: RegisterRequest): Promise<AuthResponse> =>
    axiosInstance.post('/auth/register', data).then((res) => res.data),

  login: (data: LoginRequest): Promise<AuthResponse> =>
    axiosInstance.post('/auth/login', data).then((res) => res.data),

  refreshToken: (data: RefreshTokenRequest): Promise<AuthResponse> =>
    axiosInstance.post('/auth/refresh-token', data).then((res) => res.data),

  logout: (): Promise<any> =>
    axiosInstance.post('/auth/logout').then((res) => res.data),

  getCurrentUser: (): Promise<UserAuth> =>
    axiosInstance.get('/auth/me').then((res) => res.data),

  verifyToken: (): Promise<any> =>
    axiosInstance.get('/auth/verify').then((res) => res.data),
}