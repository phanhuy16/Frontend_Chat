import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const RegisterPage: React.FC = () => {
  const { register, loading, error, clearError } = useAuth();
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
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    }
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="flex flex-wrap min-h-screen w-full">
      {/* Left Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 w-full items-center justify-center p-12 bg-blue-50 dark:bg-blue-950/20">
        <div className="max-w-md w-full flex flex-col gap-6">
          <div
            className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA9VZ33yfanXKEhAd7Sj1Xv4t7i2A8gxJbUgllzyxV05L_HK6AbuhjGV0W6Yx7sICz2ef33fIBIytD72Ns8U5B3fhHG24F6s8jVEn2oFMi_D1IeISxMUX9O0bYj9q2Sik2L3p1wauw2xMxCv2hHvE52Mlkse0Ul9o_o8wk0tvr1NWuNms6XntFfedzgvofYhBeAOdHFVIaddCDffXpLP5_z-rcmwpgdLxYH-AXyMIBPUzhmUjA_7OPyhfoS2lXC1KSZImZ4rovi9Fd5")',
            }}
          />
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
              Tham gia cùng chúng tôi
            </h1>
            <h2 className="text-slate-600 dark:text-slate-300 text-lg font-normal leading-normal">
              Kết nối mọi lúc, mọi nơi.
            </h2>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-900 overflow-y-auto">
        <div className="max-w-md w-full flex flex-col gap-8">
          {/* Logo and Welcome Text */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-4xl">
                chat_bubble
              </span>
              <span className="text-slate-900 dark:text-white text-2xl font-bold">
                ChatApp
              </span>
            </div>
            <h2 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
              Tạo tài khoản mới
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Bắt đầu hành trình kết nối của bạn ngay hôm nay.
            </p>
          </div>

          {/* Tabs */}
          <div className="w-full">
            <div className="flex border-b border-slate-200 dark:border-slate-700 gap-8">
              <Link
                to="/register"
                className="flex flex-col items-center justify-center border-b-[3px] border-b-primary text-slate-900 dark:text-white pb-3 pt-1 text-sm font-bold leading-normal tracking-wide"
              >
                Đăng ký
              </Link>
              <a
                href="/login"
                className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors pb-3 pt-1 text-sm font-bold leading-normal tracking-wide"
              >
                Đăng nhập
              </a>
            </div>
          </div>

          {/* Error Message */}
          {(error || localError) && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
              {error || localError}
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col w-full">
              <p className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">
                Tên người dùng
              </p>
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
            </label>

            <label className="flex flex-col w-full">
              <p className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">
                Email
              </p>
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
            </label>

            <label className="flex flex-col w-full">
              <p className="text-slate-900 dark:text-white text-sm font-medium leading-normal pb-2">
                Tên hiển thị
              </p>
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
            </label>

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
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center rounded-lg h-12 px-6 text-base font-bold bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:ring-offset-slate-900 transition-colors w-full mt-4"
            >
              {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
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
                    d="M22.5776 12.2773C22.5776 11.4545 22.5059 10.6591 22.3821 9.88636H12.2312V14.3364H18.1565C17.8827 15.8636 17.0622 17.1591 15.8239 17.9545V20.7273H19.6713C21.5793 18.9955 22.5776 15.9318 22.5776 12.2773Z"
                    fill="#4285F4"
                  ></path>
                  <path
                    d="M12.2312 23C15.1497 23 17.6188 22.0318 19.6713 20.7273L15.8239 17.9545C14.8645 18.5909 13.6531 19 12.2312 19C9.44973 19 7.08041 17.1136 6.17591 14.6591H2.20455V17.5182C4.1392 20.75 7.89973 23 12.2312 23Z"
                    fill="#34A853"
                  ></path>
                  <path
                    d="M6.1759 14.6591C5.92886 13.9136 5.79181 13.1227 5.79181 12.3182C5.79181 11.5136 5.92886 10.7227 6.1759 9.97727V7.11818H2.20454C1.49136 8.56818 1 10.3864 1 12.3182C1 14.25 1.49136 16.0682 2.20454 17.5182L6.1759 14.6591Z"
                    fill="#FBBC05"
                  ></path>
                  <path
                    d="M12.2312 5.63636C13.7381 5.63636 15.2449 6.18182 16.3824 7.27273L19.7438 4.09091C17.6145 2.15909 15.1455 1 12.2312 1C7.89973 1 4.1392 3.25 2.20455 6.48182L6.17591 9.34091C7.08041 6.88636 9.44973 5.63636 12.2312 5.63636Z"
                    fill="#EA4335"
                  ></path>
                </svg>
                <span>Google</span>
              </button>

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

          {/* Login Link */}
          <p className="text-center text-slate-500 dark:text-slate-400 text-sm">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
