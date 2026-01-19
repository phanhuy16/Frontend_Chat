import axios, { AxiosError, AxiosInstance } from "axios";
import { API_BASE_URL } from "../utils/constants";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": 'application/json'
  }
})

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Check if token is about to expire (within 5 minutes)
const isTokenExpiringSoon = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    // Decode JWT to get expiration time
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    // Refresh if less than 5 minutes until expiry
    return timeUntilExpiry < 5 * 60 * 1000;
  } catch (error) {
    console.error('Error parsing token:', error);
    return false;
  }
};

// Function to refresh the token
const refreshAuthToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  const token = localStorage.getItem('token');

  if (!refreshToken || !token) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
    token,
    refreshToken
  });

  if (!response.data.success) {
    throw new Error('Token refresh failed');
  }

  return response.data;
};

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      // Proactively refresh token if it's about to expire
      if (isTokenExpiringSoon() && !isRefreshing) {
        isRefreshing = true;

        try {
          const newTokenData = await refreshAuthToken();

          localStorage.setItem('token', newTokenData.token);
          localStorage.setItem('refreshToken', newTokenData.refreshToken);
          if (newTokenData.user) {
            localStorage.setItem('user', JSON.stringify(newTokenData.user));
          }

          config.headers.Authorization = `Bearer ${newTokenData.token}`;
          processQueue(null, newTokenData.token);
        } catch (error) {
          processQueue(error, null);
          console.error('Proactive token refresh failed:', error);
          // Don't redirect here, let the response interceptor handle it
        } finally {
          isRefreshing = false;
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Prevent infinite loop: if the error is from the refresh endpoint itself (or login/logout), don't try to refresh again
    if (
      originalRequest.url?.includes("/auth/refresh-token") ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newTokenData = await refreshAuthToken();

        localStorage.setItem("token", newTokenData.token);
        localStorage.setItem("refreshToken", newTokenData.refreshToken);
        if (newTokenData.user) {
          localStorage.setItem("user", JSON.stringify(newTokenData.user));
        }

        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newTokenData.token}`;
        originalRequest.headers.Authorization = `Bearer ${newTokenData.token}`;

        processQueue(null, newTokenData.token);

        // Retry original request
        return axiosInstance(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        console.error("Token refresh failed:", refreshError.message);

        // Clear storage and redirect to auth
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/auth";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
