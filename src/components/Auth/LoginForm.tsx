// src/components/Auth/LoginForm.tsx
import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const LoginForm: React.FC = () => {
  const {
    login,
    loading,
    error,
    clearError,
    loginWithGoogle,
    loginWithFacebook,
    requiresTwoFactor,
    verifyTwoFactorLogin,
    twoFactorUsername,
  } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [twoFactorCode, setTwoFactorCode] = useState("");

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

  // Initialize Facebook SDK
  React.useEffect(() => {
    // Load Facebook SDK
    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({
        appId: "1195151906039072", // Replace with your Facebook App ID
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
    };

    // Load SDK script
    if (!(window as any).FB) {
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
    }
  }, []);

  const handleFacebookLogin = () => {
    const FB = (window as any).FB;
    if (!FB) {
      console.error("Facebook SDK not loaded");
      return;
    }

    FB.login(
      (response: any) => {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          loginWithFacebook(accessToken)
            .then(() => navigate("/chat"))
            .catch((error: any) =>
              console.error("Facebook login error:", error),
            );
        } else {
          console.log("User cancelled login or did not fully authorize.");
        }
      },
      { scope: "public_profile,email" },
    );
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

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorUsername) return;

    try {
      await verifyTwoFactorLogin({
        username: twoFactorUsername,
        code: twoFactorCode,
      });
      navigate("/chat");
    } catch (err) {
      console.error("2FA Login error: ", err);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (requiresTwoFactor) {
    return (
      <form onSubmit={handleTwoFactorSubmit} className="flex flex-col gap-5">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 px-4 py-3 rounded-lg text-sm animate-shake">
            {error}
          </div>
        )}

        <div className="text-center mb-2">
          <h3 className="text-white font-bold mb-1">
            Two-Factor Authentication
          </h3>
          <p className="text-slate-400 text-xs">
            Enter the code from your authenticator app.
          </p>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-500 group-focus-within:text-white transition-colors text-xl">
              lock_clock
            </span>
          </div>
          <input
            className="w-full bg-white/5 border border-white/10 text-white rounded-full h-8 pl-10 pr-4 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium text-xs tracking-[0.5em] text-center"
            placeholder="000000"
            type="text"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            maxLength={6}
            disabled={loading}
            autoFocus
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-8 bg-primary hover:bg-primary-hover text-white rounded-full font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
        >
          {loading ? (
            <>
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Verifying...</span>
            </>
          ) : (
            "Verify"
          )}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 px-4 py-3 rounded-lg text-sm animate-shake">
          {error}
        </div>
      )}

      {/* Inputs Group */}
      <div className="space-y-4">
        {/* Username */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-500 group-focus-within:text-white transition-colors text-xl">
              person
            </span>
          </div>
          <input
            className="w-full bg-white/5 border border-white/10 text-white rounded-full h-8 pl-10 pr-4 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium text-xs"
            placeholder="Email hoặc tên người dùng"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        {/* Password */}
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
      </div>

      <div className="flex justify-between items-center text-sm">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-offset-0 focus:ring-primary/50 accent-primary"
          />
          <span className="text-slate-400 group-hover:text-white transition-colors text-xs">
            Ghi nhớ
          </span>
        </label>
        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="font-semibold text-primary hover:text-primary-hover hover:underline text-xs"
        >
          Quên mật khẩu?
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-8 bg-primary hover:bg-primary-hover text-white rounded-full font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
      >
        {loading ? (
          <>
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Đang đăng nhập...</span>
          </>
        ) : (
          "Đăng nhập"
        )}
      </button>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-white/10"></div>
        <span className="flex-shrink mx-4 text-xs font-medium text-slate-500">
          HOẶC
        </span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>

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
          onClick={handleFacebookLogin}
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

export default LoginForm;
