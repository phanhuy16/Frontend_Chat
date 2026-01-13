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
    if (isAuthenticated) {
      navigate("/chat");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen w-full bg-[#0a0a0c] overflow-hidden relative items-center justify-center">
      {/* Background with Hero Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1611606063065-ee7946f0787a?q=80&w=1000&auto=format&fit=crop")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* Animated Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/30 rounded-full blur-[120px] animate-pulse-subtle" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/30 rounded-full blur-[120px] animate-pulse-subtle" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto p-4 flex flex-col items-center">
        {/* Main Content Card */}
        <div className="w-full max-w-[450px] mx-auto glass-effect rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-fade-in relative overflow-hidden backdrop-blur-xl bg-black/40">
          {/* Abstract Shapes inside card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -z-10"></div>

          <div className="flex flex-col gap-8">
            {/* Tabs */}
            <div className="flex p-1 bg-white/5 rounded-full border border-white/5 mx-12">
              <button
                onClick={() => setActiveTab("login")}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-300 ${
                  activeTab === "login"
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => setActiveTab("register")}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-300 ${
                  activeTab === "register"
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Đăng ký
              </button>
            </div>

            {/* Form Content */}
            <div className="relative min-h-[300px]">
              {activeTab === "login" ? (
                <div key="login" className="animate-slide-up">
                  <div className="mb-6 text-center space-y-1">
                    <h2 className="text-2xl font-bold text-white">
                      Chào mừng trở lại!
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Nhập thông tin để tiếp tục
                    </p>
                  </div>
                  <LoginForm />
                </div>
              ) : (
                <div key="register" className="animate-slide-up">
                  <div className="mb-6 text-center space-y-1">
                    <h2 className="text-2xl font-bold text-white">
                      Tạo tài khoản mới
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Tham gia cộng đồng ngay hôm nay
                    </p>
                  </div>
                  <RegisterForm />
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="mt-8 text-slate-500 text-sm font-medium">
          © 2024 ChatApp. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
