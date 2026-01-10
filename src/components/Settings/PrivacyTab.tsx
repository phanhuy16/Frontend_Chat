import React, { useState } from "react";
import toast from "react-hot-toast";

const PrivacyTab: React.FC = () => {
  const [privacySettings, setPrivacySettings] = useState({
    lastSeen: "everyone",
    onlineStatus: "everyone",
    readReceipts: true,
  });

  const handlePrivacyChange = (key: string, value: any) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
    toast.success("Đã cập nhật cài đặt quyền riêng tư!");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Quyền riêng tư & Bảo mật</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
          Kiểm soát thông tin cá nhân nào bạn chia sẻ với những người khác.
        </p>
      </div>

      <div className="space-y-6">
        {/* Last Seen */}
        <div className="space-y-3">
          <label className="text-base font-bold text-slate-900 dark:text-white">Ai có thể thấy "Lần truy cập cuối"?</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {["everyone", "contacts", "nobody"].map((option) => (
              <button
                key={option}
                onClick={() => handlePrivacyChange("lastSeen", option)}
                className={`px-4 py-3 rounded-xl border-2 transition-all font-bold text-sm ${
                  privacySettings.lastSeen === option
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20"
                }`}
              >
                {option === "everyone" ? "Mọi người" : option === "contacts" ? "Liên hệ" : "Không ai cả"}
              </button>
            ))}
          </div>
        </div>

        {/* Online Status */}
        <div className="space-y-3">
          <label className="text-base font-bold text-slate-900 dark:text-white">Ai có thể thấy khi tôi đang "Trực tuyến"?</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {["everyone", "contacts", "nobody"].map((option) => (
              <button
                key={option}
                onClick={() => handlePrivacyChange("onlineStatus", option)}
                className={`px-4 py-3 rounded-xl border-2 transition-all font-bold text-sm ${
                  privacySettings.onlineStatus === option
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20"
                }`}
              >
                {option === "everyone" ? "Mọi người" : option === "contacts" ? "Liên hệ" : "Không ai cả"}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-t border-slate-200 dark:border-white/10 my-8" />

        {/* Read Receipts */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined font-fill">done_all</span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">Xác nhận đã đọc (Seen)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nếu tắt, bạn cũng sẽ không thấy xác nhận đã đọc từ người khác.</p>
            </div>
          </div>
          <button
            onClick={() => handlePrivacyChange("readReceipts", !privacySettings.readReceipts)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              privacySettings.readReceipts ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <span className={`${privacySettings.readReceipts ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
          </button>
        </div>

        {/* Blocked Users */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <span className="material-symbols-outlined font-fill">block</span>
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">Danh sách chặn</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bạn hiện đang chặn 0 người dùng.</p>
              </div>
            </div>
            <button className="text-sm font-bold text-primary px-4 py-2 hover:bg-primary/10 rounded-xl transition-all">
              Quản lý
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyTab;
