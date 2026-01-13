import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { resetPassword } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Token không hợp lệ");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword({ token, newPassword });
      if (result.success) {
        toast.success(result.message);
        setTimeout(() => navigate("/auth"), 2000);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error("Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] text-white">
        <div className="text-center p-8 glass-effect rounded-3xl border border-white/10">
          <span className="material-symbols-outlined text-4xl text-red-500 mb-4">
            error_circle_rounded
          </span>
          <h1 className="text-2xl font-bold mb-2">Liên kết không hợp lệ</h1>
          <p className="text-slate-400 mb-6">
            Liên kết đặt lại mật khẩu này đã hết hạn hoặc không tồn tại.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full font-bold transition-all text-sm"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse-subtle" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px] animate-pulse-subtle" />

      <div className="w-full max-w-md relative animate-fade-in z-10">
        <div className="glass-effect rounded-[2.5rem] p-10 border border-white/10 shadow-2xl backdrop-blur-xl bg-black/40">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-lg shadow-primary/5 rotate-3">
              <span className="material-symbols-outlined text-3xl text-primary">
                lock_reset
              </span>
            </div>

            <h1 className="text-3xl font-black text-white text-center mb-2 tracking-tight">
              Đặt lại mật khẩu
            </h1>
            <p className="text-slate-400 text-center mb-8 font-medium text-sm">
              Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-500 group-focus-within:text-white transition-colors text-xl">
                    lock
                  </span>
                </div>
                <input
                  className="w-full bg-white/5 border border-white/10 text-white rounded-full h-10 pl-10 pr-10 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium text-sm"
                  placeholder="Mật khẩu mới"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-500 group-focus-within:text-white transition-colors text-xl">
                    lock_reset
                  </span>
                </div>
                <input
                  className="w-full bg-white/5 border border-white/10 text-white rounded-full h-10 pl-10 pr-10 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium text-sm"
                  placeholder="Xác nhận mật khẩu"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showConfirmPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 bg-primary hover:bg-primary-hover text-white rounded-full font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    "Đổi mật khẩu"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
