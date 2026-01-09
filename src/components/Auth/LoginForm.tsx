// src/components/Auth/LoginForm.tsx
import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const LoginForm: React.FC = () => {
  const { login, loading, error, clearError, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  React.useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
      navigate("/chat");
    } catch (err) {
      console.error("Login error: ", err);
    }
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      try {
        await loginWithGoogle(credentialResponse.credential);
        navigate("/chat");
      } catch (error) {
        console.error("Google login error: ", error);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 px-4 py-3 rounded-lg text-sm animate-shake">
          {error}
        </div>
      )}

      {/* Username Field */}
      <label className="flex flex-col w-full">
        <p className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">
          Email hoặc Tên người dùng
        </p>
        <div className="relative flex w-full flex-1 items-stretch">
          <input
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-input-light dark:bg-input-dark focus:border-primary dark:focus:border-primary h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3.5 text-base font-normal leading-normal transition-all"
            placeholder="Nhập email hoặc tên người dùng của bạn"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>
      </label>

      {/* Password Field */}
      <label className="flex flex-col w-full">
        <p className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">
          Mật khẩu
        </p>
        <div className="relative flex w-full flex-1 items-stretch">
          <input
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-input-light dark:bg-input-dark focus:border-primary dark:focus:border-primary h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3.5 pr-10 text-base font-normal leading-normal transition-all"
            placeholder="Nhập mật khẩu của bạn"
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            tabIndex={-1}
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </label>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center rounded-lg h-12 px-6 text-base font-bold bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:ring-offset-slate-900 transition-colors w-full mt-2"
      >
        {loading ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Đang đăng nhập...
          </>
        ) : (
          "Đăng nhập"
        )}
      </button>

      {/* Divider */}
      <div className="relative flex items-center py-4">
        <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
        <span className="flex-shrink mx-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          HOẶC TIẾP TỤC VỚI
        </span>
        <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
      </div>

      {/* Social Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => console.log("Login Failed")}
          useOneTap={false}
          text="signin_with"
          size="large"
        />
        <button
          type="button"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg h-12 px-4 text-sm font-medium bg-input-light dark:bg-input-dark text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:ring-offset-slate-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.397 20.997V12.801H16.162L16.573 9.59099H13.397V7.54899C13.397 6.55199 13.658 5.92999 14.836 5.92999H16.669V3.12799C15.8421 3.03358 15.0116 2.98666 14.18 2.98699C11.822 2.98699 10.155 4.45399 10.155 7.23499V9.59099H7.336V12.801H10.155V20.997H13.397Z"
              fill="#1877F2"
            ></path>
          </svg>
          <span>Facebook</span>
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
