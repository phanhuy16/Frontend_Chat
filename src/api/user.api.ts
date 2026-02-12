import { User } from "../types/user.types";
import axiosInstance from "./axios";

export interface UpdateProfileRequest {
  displayName: string;
  bio?: string;
  avatar?: string;
  lastSeenPrivacy?: string;
  onlineStatusPrivacy?: string;
  readReceiptsEnabled?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const userApi = {
  getUserById: (id: number): Promise<User> =>
    axiosInstance.get(`/users/${id}`).then((res) => res.data),

  getUserByUsername: (username: string): Promise<User> =>
    axiosInstance.get(`/users/username/${username}`).then((res) => res.data),

  searchUsers: (searchTerm: string): Promise<User[]> =>
    axiosInstance.get('/users/search', { params: { searchTerm } }).then((res) => res.data),

  updateUserStatus: (userId: number, status: string): Promise<any> =>
    axiosInstance.put(`/users/${userId}.status`, { status }).then((res) => res.data),

  updateProfile: (data: UpdateProfileRequest): Promise<User> =>
    axiosInstance.put('/users/profile', data).then((res) => res.data),

  changePassword: (data: ChangePasswordRequest): Promise<{ message: string }> =>
    axiosInstance.post('/users/change-password', data).then((res) => res.data),

  uploadAvatar: (file: File): Promise<{ avatarUrl: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance
      .post('/users/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },

  deleteAccount: (): Promise<{ message: string }> =>
    axiosInstance.delete('/users/account').then((res) => res.data),

  updateCustomStatus: (customStatus: string | null): Promise<any> =>
    axiosInstance.put('/users/custom-status', { customStatus }).then((res) => res.data),

  getThemePreference: (): Promise<{ themePreference: string }> =>
    axiosInstance.get('/users/theme').then((res) => res.data),

  updateThemePreference: (themePreference: string): Promise<{ message: string }> =>
    axiosInstance.put('/users/theme', { themePreference }).then((res) => res.data),
}