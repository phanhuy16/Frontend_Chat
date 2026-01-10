import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface NotificationSettings {
  enableDesktop: boolean;
  enableSound: boolean;
  showMessagePreview: boolean;
  muteAll: boolean;
}

const NotificationsTab: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enableDesktop: true,
    enableSound: true,
    showMessagePreview: true,
    muteAll: false,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("user_notification_settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse notification settings", e);
      }
    }
  }, []);

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem("user_notification_settings", JSON.stringify(newSettings));
    toast.success("Đã cập nhật cài đặt thông báo!");
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const playTestSound = () => {
    const audio = new Audio("/sounds/notification.mp3");
    audio.play().catch(e => {
      console.warn("Could not play test sound", e);
      toast.error("Không thể phát âm thanh thử nghiệm");
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Cài đặt thông báo</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
          Quản lý cách ứng dụng thông báo cho bạn về tin nhắn và cuộc gọi mới.
        </p>
      </div>

      <div className="space-y-4">
        {/* Desktop Notifications */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <span className="material-symbols-outlined font-fill">desktop_windows</span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">Thông báo trên máy tính</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hiển thị thông báo ngay cả khi trình duyệt đang ẩn.</p>
            </div>
          </div>
          <button
            onClick={() => toggleSetting("enableDesktop")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              settings.enableDesktop ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <span className={`${settings.enableDesktop ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
          </button>
        </div>

        {/* Sound Notifications */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <span className="material-symbols-outlined font-fill">volume_up</span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">Âm báo tin nhắn</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Phát âm thanh khi có tin nhắn hoặc cuộc gọi đến.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={playTestSound}
              className="text-xs font-bold text-primary hover:underline"
            >
              Nghe thử
            </button>
            <button
              onClick={() => toggleSetting("enableSound")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                settings.enableSound ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <span className={`${settings.enableSound ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
            </button>
          </div>
        </div>

        {/* Message Preview */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <span className="material-symbols-outlined font-fill">visibility</span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">Xem trước nội dung</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hiển thị một phần nội dung tin nhắn trong thông báo.</p>
            </div>
          </div>
          <button
            onClick={() => toggleSetting("showMessagePreview")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              settings.showMessagePreview ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <span className={`${settings.showMessagePreview ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
          </button>
        </div>

        {/* Mute All */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-red-500/10 bg-red-500/5 dark:bg-red-500/10 shadow-sm">
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <span className="material-symbols-outlined font-fill">notifications_off</span>
            </div>
            <div>
              <p className="text-base font-bold text-red-600 dark:text-red-500">Tắt tất cả thông báo</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tạm dừng tất cả thông báo cho đến khi bạn bật lại.</p>
            </div>
          </div>
          <button
            onClick={() => toggleSetting("muteAll")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              settings.muteAll ? "bg-red-500" : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <span className={`${settings.muteAll ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsTab;
