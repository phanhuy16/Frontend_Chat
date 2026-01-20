import React, { createContext, useCallback, useState } from "react";
import { authApi } from "../api/auth.api";
import {
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  UserAuth,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  TwoFactorLoginRequest,
  AuthResponse,
} from "../types/auth.types";

interface AuthContextType {
  user: UserAuth | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  register: (data: RegisterRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshAuthToken: (data: RefreshTokenRequest) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithFacebook: (accessToken: string) => Promise<void>;
  isAuthenticated: boolean;
  updateUser: (updatedUser: UserAuth) => void;
  forgotPassword: (
    data: ForgotPasswordRequest,
  ) => Promise<{ success: boolean; message: string }>;
  resetPassword: (
    data: ResetPasswordRequest,
  ) => Promise<{ success: boolean; message: string }>;
  verifyTwoFactorLogin: (data: TwoFactorLoginRequest) => Promise<AuthResponse>;
  requiresTwoFactor: boolean;
  twoFactorUsername: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserAuth | null>(() => {
    const saveUser = localStorage.getItem("user");
    return saveUser ? JSON.parse(saveUser) : null;
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorUsername, setTwoFactorUsername] = useState<string | null>(
    null,
  );

  const clearError = useCallback(() => setError(null), []);

  const register = useCallback(async (data: RegisterRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.register(data);
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", response.token);
        localStorage.setItem("refreshToken", response.refreshToken || "");
      } else {
        setError(response.message || "Registration failed");
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    setLoading(true);
    setError(null);
    setRequiresTwoFactor(false);
    setTwoFactorUsername(null);

    try {
      const response = await authApi.login(data);
      if (response.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setTwoFactorUsername(data.username);
        setLoading(false);
        return;
      }

      if (response.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", response.token);
        localStorage.setItem("refreshToken", response.refreshToken || "");
      } else {
        setError(response.message || "Login failed");
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyTwoFactorLogin = useCallback(
    async (data: TwoFactorLoginRequest) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authApi.verifyTwoFactorLogin(data);
        if (response.success && response.user && response.token) {
          setUser(response.user);
          setToken(response.token);
          localStorage.setItem("user", JSON.stringify(response.user));
          localStorage.setItem("token", response.token);
          localStorage.setItem("refreshToken", response.refreshToken || "");
          setRequiresTwoFactor(false);
          setTwoFactorUsername(null);
          return response;
        } else {
          setError(response.message || "2FA verification failed");
          return response;
        }
      } catch (error: any) {
        const msg = error.response?.data?.message || "2FA verification failed";
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const refreshAuthToken = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!token || !refreshToken) {
        return false;
      }

      const response = await authApi.refreshToken({ token, refreshToken });

      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem("token", response.token);
        localStorage.setItem("refreshToken", response.refreshToken || "");
        localStorage.setItem("user", JSON.stringify(response.user));
        return true;
      }

      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error: ", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.googleLogin({ idToken });
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", response.token);
        localStorage.setItem("refreshToken", response.refreshToken || "");
      } else {
        setError(response.message || "Google login failed");
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithFacebook = useCallback(async (accessToken: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.facebookLogin({ accessToken });
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", response.token);
        localStorage.setItem("refreshToken", response.refreshToken || "");
      } else {
        setError(response.message || "Facebook login failed");
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Facebook login failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (data: ForgotPasswordRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.forgotPassword(data);
      return { success: response.success, message: response.message };
    } catch (error: any) {
      const msg = error.response?.data?.message || "Gửi yêu cầu thất bại";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (data: ResetPasswordRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.resetPassword(data);
      return { success: response.success, message: response.message };
    } catch (error: any) {
      const msg = error.response?.data?.message || "Đặt lại mật khẩu thất bại";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        clearError,
        isAuthenticated: !!token,
        refreshAuthToken,
        loginWithGoogle,
        loginWithFacebook,
        updateUser: (updatedUser: UserAuth) => {
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        },
        forgotPassword,
        resetPassword,
        verifyTwoFactorLogin,
        requiresTwoFactor,
        twoFactorUsername,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
