// src/components/Auth/RegisterForm.tsx
import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const RegisterForm: React.FC = () => {
  const { register, loading, error, loginWithGoogle, clearError } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });

  React.useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    // Validations
    if (!formData.username.trim()) {
      setLocalError("Tên người dùng không được để trống");
      return;
    }

    if (formData.username.length < 3) {
      setLocalError("Tên người dùng phải có ít nhất 3 ký tự");
      return;
    }

    if (!formData.email.trim()) {
      setLocalError("Email không được để trống");
      return;
    }

    if (!formData.email.includes("@")) {
      setLocalError("Email không hợp lệ");
      return;
    }

    if (!formData.displayName.trim()) {
      setLocalError("Tên hiển thị không được để trống");
      return;
    }

    if (!formData.password) {
      setLocalError("Mật khẩu không được để trống");
      return;
    }

    if (formData.password.length < 6) {
      setLocalError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Mật khẩu xác nhận không trùng khớp");
      return;
    }

    try {
      await register(formData);
      navigate("/chat");
    } catch (err) {
      console.error("Register error: ", err);
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

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-1"
    >
      {/* Custom scrollbar styling */}
      <style>{`
        form::-webkit-scrollbar {
          width: 4px;
        }
        form::-webkit-scrollbar-track {
          background: transparent;
        }
        form::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        form::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      {/* Error Message */}
      {(error || localError) && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 px-4 py-3 rounded-lg text-sm animate-shake sticky top-0 z-10">
          {error || localError}
        </div>
      )}

      <div className="space-y-3">
        {/* Username Field */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-500 group-focus-within:text-white transition-colors text-xl">
              person
            </span>
          </div>
          <input
            className="w-full bg-white/5 border border-white/10 text-white rounded-full h-8 pl-10 pr-4 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium text-xs"
            placeholder="Tên người dùng"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        {/* Email Field */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-500 group-focus-within:text-white transition-colors text-xl">
              mail
            </span>
          </div>
          <input
            className="w-full bg-white/5 border border-white/10 text-white rounded-full h-8 pl-10 pr-4 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium text-xs"
            placeholder="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        {/* Display Name Field */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-500 group-focus-within:text-white transition-colors text-xl">
              badge
            </span>
          </div>
          <input
            className="w-full bg-white/5 border border-white/10 text-white rounded-full h-8 pl-10 pr-4 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium text-xs"
            placeholder="Tên hiển thị"
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        {/* Password Field */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-500 group-focus-within:text-white transition-colors text-xl">
              lock
            </span>
          </div>
          <input
            className="w-full bg-white/5 border border-white/10 text-white rounded-full h-8 pl-10 pr-10 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium text-xs"
            placeholder="Mật khẩu"
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
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>

        {/* Confirm Password Field */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-500 group-focus-within:text-white transition-colors text-xl">
              lock_reset
            </span>
          </div>
          <input
            className="w-full bg-white/5 border border-white/10 text-white rounded-full h-8 pl-10 pr-10 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium text-xs"
            placeholder="Xác nhận mật khẩu"
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">
              {showConfirmPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-8 bg-primary hover:bg-primary-hover text-white rounded-full font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-xs mt-2"
      >
        {loading ? (
          <>
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Đang đăng ký...</span>
          </>
        ) : (
          "Đăng ký"
        )}
      </button>

      {/* Divider */}
      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-white/10"></div>
        <span className="flex-shrink mx-4 text-xs font-medium text-slate-500">
          HOẶC
        </span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>

      {/* Social Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Wrapper to control Google Button width/style */}
        <div className="flex justify-center [&>div]:w-full">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => console.log("Login Failed")}
            theme="filled_black"
            shape="pill"
            text="signin_with"
            size="medium"
            width="100%"
          />
        </div>

        <button
          type="button"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-full h-[32px] px-4 font-medium bg-[#1877F2] text-white hover:bg-[#1864cc] transition-colors disabled:opacity-60 disabled:cursor-not-allowed w-full shadow-lg shadow-[#1877F2]/20"
        >
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M13.397 20.997V12.801H16.162L16.573 9.59099H13.397V7.54899C13.397 6.55199 13.658 5.92999 14.836 5.92999H16.669V3.12799C15.8421 3.03358 15.0116 2.98666 14.18 2.98699C11.822 2.98699 10.155 4.45399 10.155 7.23499V9.59099H7.336V12.801H10.155V20.997H13.397Z" />
          </svg>
          <span className="text-xs">Facebook</span>
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;
