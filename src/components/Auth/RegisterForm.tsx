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
      className="flex flex-col gap-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-4"
    >
      {/* Custom scrollbar styling */}
      <style>{`
        form::-webkit-scrollbar {
          width: 6px;
        }
        form::-webkit-scrollbar-track {
          background: transparent;
        }
        form::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        form::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .dark form::-webkit-scrollbar-thumb {
          background: #475569;
        }
        .dark form::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>

      {/* Error Message */}
      {(error || localError) && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 px-4 py-3 rounded-lg text-sm animate-shake sticky top-0 z-10">
          {error || localError}
        </div>
      )}

      {/* Username Field */}
      <label className="flex flex-col w-full">
        <p className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">
          Tên người dùng
        </p>
        <div className="relative flex w-full flex-1 items-stretch">
          <input
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3.5 text-base font-normal leading-normal transition-all"
            placeholder="Nhập tên người dùng của bạn"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>
      </label>

      {/* Email Field */}
      <label className="flex flex-col w-full">
        <p className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">
          Email
        </p>
        <div className="relative flex w-full flex-1 items-stretch">
          <input
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3.5 text-base font-normal leading-normal transition-all"
            placeholder="Nhập email của bạn"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>
      </label>

      {/* Display Name Field */}
      <label className="flex flex-col w-full">
        <p className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">
          Tên hiển thị
        </p>
        <div className="relative flex w-full flex-1 items-stretch">
          <input
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3.5 text-base font-normal leading-normal transition-all"
            placeholder="Nhập tên hiển thị của bạn"
            type="text"
            name="displayName"
            value={formData.displayName}
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
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3.5 pr-10 text-base font-normal leading-normal transition-all"
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

      {/* Confirm Password Field */}
      <label className="flex flex-col w-full">
        <p className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">
          Xác nhận mật khẩu
        </p>
        <div className="relative flex w-full flex-1 items-stretch">
          <input
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary dark:focus:border-primary h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3.5 pr-10 text-base font-normal leading-normal transition-all"
            placeholder="Nhập lại mật khẩu của bạn"
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
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            tabIndex={-1}
          >
            <span className="material-symbols-outlined text-xl">
              {showConfirmPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </label>

      {/* Submit Button */}
      <div className="relative flex w-full flex-1 items-stretch">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center rounded-lg h-12 px-6 text-base font-bold bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:ring-offset-slate-900 transition-colors w-full mt-2"
        >
          {loading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Đang tạo tài khoản...
            </>
          ) : (
            "Tạo tài khoản"
          )}
        </button>
      </div>

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
          className="flex items-center justify-center gap-2 rounded-lg h-12 px-4 text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:ring-offset-slate-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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

export default RegisterForm;
