import React, { useState, useEffect } from "react";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface NotificationSettings {
  enableDesktop: boolean;
  enableSound: boolean;
  showMessagePreview: boolean;
  muteAll: boolean;
}

const NotificationsTab: React.FC = () => {
  const { isSubscribed, toggleSubscription, loading } = usePushNotifications();
  const { t } = useTranslation();
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
    localStorage.setItem(
      "user_notification_settings",
      JSON.stringify(newSettings)
    );
    toast.success("Đã cập nhật cài đặt thông báo!");
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const playTestSound = () => {
    const audio = new Audio("/sounds/notification.mp3");
    audio.play().catch((e) => {
      console.warn("Could not play test sound", e);
      toast.error("Không thể phát âm thanh thử nghiệm");
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
          {t("settings.notifications.title")}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
          {t("settings.notifications.subtitle")}
        </p>
      </div>

      <div className="space-y-4">
        {/* Desktop Notifications */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <span className="material-symbols-outlined font-fill text-lg">
                desktop_windows
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {t("settings.notifications.desktop")}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t("settings.notifications.desktop_desc")}
              </p>
            </div>
          </div>
          <button
            onClick={toggleSubscription}
            disabled={loading}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
              isSubscribed ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
            } ${loading ? "opacity-50 cursor-wait" : ""}`}
          >
            <span
              className={`${
                isSubscribed ? "translate-x-5" : "translate-x-1"
              } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
            />
          </button>
        </div>

        {/* Sound Notifications */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <span className="material-symbols-outlined font-fill text-lg">
                volume_up
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {t("settings.notifications.sound")}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t("settings.notifications.sound_desc")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={playTestSound}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              {t("settings.notifications.test_sound")}
            </button>
            <button
              onClick={() => toggleSetting("enableSound")}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                settings.enableSound
                  ? "bg-primary"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <span
                className={`${
                  settings.enableSound ? "translate-x-5" : "translate-x-1"
                } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>
        </div>

        {/* Message Preview */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <span className="material-symbols-outlined font-fill text-lg">
                visibility
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {t("settings.notifications.preview")}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t("settings.notifications.preview_desc")}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleSetting("showMessagePreview")}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
              settings.showMessagePreview
                ? "bg-primary"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <span
              className={`${
                settings.showMessagePreview ? "translate-x-5" : "translate-x-1"
              } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
            />
          </button>
        </div>

        {/* Mute All */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-red-500/10 bg-red-500/5 dark:bg-red-500/10 shadow-sm">
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
              <span className="material-symbols-outlined font-fill text-lg">
                notifications_off
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-red-600 dark:text-red-500">
                {t("settings.notifications.mute_all")}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t("settings.notifications.mute_all_desc")}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleSetting("muteAll")}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
              settings.muteAll ? "bg-red-500" : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <span
              className={`${
                settings.muteAll ? "translate-x-5" : "translate-x-1"
              } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsTab;
