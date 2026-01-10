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
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse-subtle" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] animate-pulse-subtle" />
      </div>

      <div className="relative z-10 flex w-full max-w-[1440px] mx-auto p-4 lg:p-8">
        {/* Left Hero Section */}
        <div className="hidden lg:flex lg:w-3/5 items-center justify-center p-12">
          <div className="max-w-xl w-full flex flex-col gap-8 animate-fade-in">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div
                className="relative w-full bg-center bg-no-repeat aspect-video bg-cover rounded-2xl shadow-2xl"
                style={{
                  backgroundImage:
                    'url("https://images.unsplash.com/photo-1611606063065-ee7946f0787a?q=80&w=1000&auto=format&fit=crop")',
                }}
              />
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="text-slate-900 dark:text-white text-5xl font-extrabold leading-tight tracking-tight">
                Connect with the world <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  instantly and beautifully.
                </span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-xl font-medium leading-relaxed max-w-lg">
                Experience the next generation of communication with real-time
                messaging, video calls, and a premium interface.
              </p>
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="w-full lg:w-2/5 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-effect premium-card p-8 animate-slide-up">
            <div className="flex flex-col gap-6">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-white text-3xl">
                    chat_bubble
                  </span>
                </div>
                <span className="text-slate-900 dark:text-white text-2xl font-black tracking-tight">
                  ChatApp
                </span>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1">
                <h2 className="text-slate-900 dark:text-white text-3xl font-bold">
                  {activeTab === "login" ? "Welcome back" : "Join us today"}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  {activeTab === "login"
                    ? "Please enter your details to login."
                    : "Create an account to start chatting."}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                <button
                  onClick={() => setActiveTab("login")}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                    activeTab === "login"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setActiveTab("register")}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                    activeTab === "register"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Form Content */}
              <div className="relative mt-2">
                {activeTab === "login" ? (
                  <div className="animate-fade-in">
                    <LoginForm />
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <RegisterForm />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
