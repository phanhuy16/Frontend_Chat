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
  } = useAuth();
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
              console.error("Facebook login error:", error)
            );
        } else {
          console.log("User cancelled login or did not fully authorize.");
        }
      },
      { scope: "public_profile,email" }
    );
  };

  // WAIT. The user specifically wants "synchronous" design. Standard Google button is rectangular.
  // Let's use `type="standard"` width="100%" (if possible) or just let them be flexible.
  // Actually, `GoogleLogin` has a `width` prop.

  // Let's proceed with simplifying the FORM fields first (removing labels), and for buttons:
  // I will use `GoogleLogin` with `type="standard"` `theme="filled_black"` (to match dark theme if needed) or `outline`.
  // And Style the FB button to match.

  // Refined Plan:
  // 1. Inputs: Remove top labels. Keep placeholder. Add icons inside input for better UX (User icon, Lock icon).
  // 2. Buttons:
  //    - Google: `<GoogleLogin theme="outline" size="large" width="100%" text="continue_with" />` (This will be a wide button)
  //    - Facebook: Wide button "Continue with Facebook", matching style (white bg, gray border, or blue bg).
  //    - Actually, Google's "outline" is white background with gray border.
  //    - I'll make FB button similar: White/Gray background or Blue? Usually FB is Blue.
  //    - If Google is "outline", FB should probably be "outline" too or "filled".
  //    - Let's try to make them look separate but equal width.

  // Let's assume user wants two columns like before but "synchronized".
  // Before: GoogleLogin (Standard) | Custom FB Button (Small text).
  // Problem: GoogleLogin height/style is fixed.

  // Let's try to wrap GoogleLogin to hide it and click it programmatically?
  // No, `useGoogleLogin` is best for custom UI.
  // I will switch to `useGoogleLogin`.
  // ISSUE: Backend validation of ID Token.
  // IF I use `useGoogleLogin`, I get an access_token.
  // I can use `https://www.googleapis.com/oauth2/v3/userinfo` with that access_token to get user details on CLIENT side?
  // No, backend blindly trusts? NO.
  // Backend needs to verify.
  // Backend `GoogleJsonWebSignature.ValidateAsync` expects ID Token.

  // Is there a way to get ID Token from `useGoogleLogin`?
  // No, not directly in the new library for implicit flow.

  // Okay, I will stick to `GoogleLogin` component but I will make the Facebook button match its height and style (Rounded, shadow, etc).
  // And I will simplify the inputs.

  // Let's look at the "unnecessary things". Labels are definitely one.
  // Also "Welcome back" text inside form might be redundant if AuthPage has it.
  // AuthPage DOES have it: "{activeTab === "login" ? "Welcome back" : ...}"
  // So I will remove headers from `LoginForm` as well (I added them in previous step, now removing).

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
            className="w-full bg-white/5 border border-white/10 text-white rounded-full h-10 pl-10 pr-4 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium text-sm"
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
            className="w-full bg-white/5 border border-white/10 text-white rounded-full h-10 pl-10 pr-10 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium text-sm"
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
            <span className="material-symbols-outlined text-xl">
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
        className="w-full h-10 bg-primary hover:bg-primary-hover text-white rounded-full font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
            size="large"
            width="100%"
          />
        </div>

        <button
          type="button"
          onClick={handleFacebookLogin}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-full h-[40px] px-4 font-medium bg-[#1877F2] text-white hover:bg-[#1864cc] transition-colors disabled:opacity-60 disabled:cursor-not-allowed w-full shadow-lg shadow-[#1877F2]/20"
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
            <path d="M13.397 20.997V12.801H16.162L16.573 9.59099H13.397V7.54899C13.397 6.55199 13.658 5.92999 14.836 5.92999H16.669V3.12799C15.8421 3.03358 15.0116 2.98666 14.18 2.98699C11.822 2.98699 10.155 4.45399 10.155 7.23499V9.59099H7.336V12.801H10.155V20.997H13.397Z" />
          </svg>
          <span className="text-sm">Facebook</span>
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
