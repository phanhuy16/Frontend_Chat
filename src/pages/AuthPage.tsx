// src/pages/AuthPage.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/Auth/LoginForm";
import RegisterForm from "../components/Auth/RegisterForm";

type AuthTab = "login" | "register";

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Enable dark mode if system prefers it
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    }

    // Redirect if already logged in
    if (isAuthenticated) {
      navigate("/chat");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex flex-wrap min-h-screen w-full">
      {/* Left Hero Section - Static */}
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

      {/* Right Form Section - Dynamic */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-900 overflow-y-auto max-h-screen">
        <div className="max-w-md w-full flex flex-col gap-8 py-4">
          {/* Logo and Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-4xl">
                chat_bubble
              </span>
              <span className="text-slate-900 dark:text-white text-2xl font-bold">
                ChatApp
              </span>
            </div>

            {/* Title - Changes based on tab */}
            <h2 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
              {activeTab === "login" ? "Đăng nhập" : "Tạo tài khoản mới"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {activeTab === "login"
                ? "Hãy kết nối với mọi người ngay hôm nay."
                : "Bắt đầu hành trình kết nối của bạn ngay hôm nay."}
            </p>
          </div>

          {/* Tabs - Animated */}
          <div className="w-full">
            <div className="flex border-b border-slate-200 dark:border-slate-700 gap-8">
              <button
                onClick={() => setActiveTab("login")}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-1 text-sm font-bold leading-normal tracking-wide transition-all duration-300 ${
                  activeTab === "login"
                    ? "border-b-primary text-slate-900 dark:text-white"
                    : "border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => setActiveTab("register")}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-1 text-sm font-bold leading-normal tracking-wide transition-all duration-300 ${
                  activeTab === "register"
                    ? "border-b-primary text-slate-900 dark:text-white"
                    : "border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Đăng ký
              </button>
            </div>
          </div>

          {/* Forms - Animated transition */}
          <div className="relative overflow-hidden">
            {/* Login Form */}
            <div
              className={`transition-all duration-300 ${
                activeTab === "login"
                  ? "opacity-100 translate-x-0"
                  : "absolute opacity-0 -translate-x-full"
              }`}
            >
              {activeTab === "login" && <LoginForm />}
            </div>

            {/* Register Form */}
            <div
              className={`transition-all duration-300 ${
                activeTab === "register"
                  ? "opacity-100 translate-x-0"
                  : "absolute opacity-0 translate-x-full"
              }`}
            >
              {activeTab === "register" && <RegisterForm />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
