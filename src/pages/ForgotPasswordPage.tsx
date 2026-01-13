import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"input" | "success">("input");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập email của bạn");
      return;
    }

    setLoading(true);
    try {
      const result = await forgotPassword({ email });
      if (result.success) {
        setStep("success");
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error("Gửi yêu cầu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] p-4 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] animate-pulse"></div>

      <div className="w-full max-w-md relative animate-fade-in">
        <div className="glass-effect rounded-[2.5rem] p-10 border border-white/10 shadow-2xl backdrop-blur-xl bg-black/40">
          {step === "input" ? (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 rotate-3 shadow-lg shadow-primary/5">
                <span className="material-symbols-outlined text-4xl text-primary">
                  lock_reset
                </span>
              </div>

              <h1 className="text-3xl font-black text-white text-center mb-4 tracking-tight">
                Quên mật khẩu?
              </h1>
              <p className="text-slate-400 text-center mb-8 font-medium text-sm">
                Đừng lo lắng! Hãy nhập email của bạn và chúng tôi sẽ gửi hướng
                dẫn khôi phục.
              </p>

              <form onSubmit={handleSubmit} className="w-full space-y-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-500 group-focus-within:text-white transition-colors text-xl">
                      mail
                    </span>
                  </div>
                  <input
                    className="w-full bg-white/5 border border-white/10 text-white rounded-full h-10 pl-10 pr-4 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium text-sm"
                    placeholder="Email của bạn"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 bg-primary hover:bg-primary-hover text-white rounded-full font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    "Gửi yêu cầu"
                  )}
                </button>
              </form>

              <button
                onClick={() => navigate("/auth")}
                className="mt-8 text-slate-500 hover:text-white font-bold transition-colors flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-lg">
                  arrow_back
                </span>
                Quay lại đăng nhập
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-scale-up">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/5">
                <span className="material-symbols-outlined text-4xl text-emerald-500">
                  check_circle
                </span>
              </div>

              <h2 className="text-3xl font-black text-white text-center mb-4 tracking-tight">
                Kiểm tra Email
              </h2>
              <p className="text-slate-400 text-center mb-10 font-medium leading-relaxed text-sm">
                Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến{" "}
                <span className="text-emerald-400 font-bold">{email}</span>. Vui
                lòng kiểm tra hộp thư đến của bạn.
              </p>

              <button
                onClick={() => navigate("/auth")}
                className="w-full h-10 bg-white/[0.05] hover:bg-white/[0.08] text-white rounded-full font-bold border border-white/5 transition-all active:scale-[0.98] text-sm"
              >
                Quay lại trang chủ
              </button>

              <div className="mt-8 flex flex-col items-center gap-2">
                <p className="text-slate-600 text-xs font-bold uppercase tracking-wider">
                  Không nhận được email?
                </p>
                <button
                  onClick={() => setStep("input")}
                  className="text-primary hover:underline font-black text-sm"
                >
                  Thử lại với địa chỉ khác
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
