import axios, { AxiosError, AxiosInstance } from "axios";
import { API_BASE_URL } from "../utils/constants";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": 'application/json'
  }
})

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config;
  }
)

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const token = localStorage.getItem('token');

        if (!refreshToken || !token) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/auth';
          return Promise.reject(error)
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          token,
          refreshToken
        });

        if (!response.data.success) {
          throw new Error('Token refresh failed');
        }

        const newTokenData = response.data;

        localStorage.setItem('token', newTokenData.token);
        localStorage.setItem('refreshToken', newTokenData.refreshToken);

        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newTokenData.token}`;
        originalRequest.headers.Authorization = `Bearer ${newTokenData.token}`;

        // Retry original request
        return axiosInstance(originalRequest);
      } catch (error: any) {
        console.error('Token refresh failed:', error.message);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance;