import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { userApi } from "../../api/user.api";
import { useTranslation } from "react-i18next";

const PrivacyTab: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const [privacySettings, setPrivacySettings] = useState({
    lastSeen: user?.lastSeenPrivacy || "everyone",
    onlineStatus: user?.onlineStatusPrivacy || "everyone",
    readReceipts: user?.readReceiptsEnabled ?? true,
  });

  useEffect(() => {
    if (user) {
      setPrivacySettings({
        lastSeen: user.lastSeenPrivacy,
        onlineStatus: user.onlineStatusPrivacy,
        readReceipts: user.readReceiptsEnabled,
      });
    }
  }, [user]);

  const handlePrivacyChange = async (key: string, value: any) => {
    const updatedSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(updatedSettings);

    try {
      const responseUser = await userApi.updateProfile({
        displayName: user?.displayName || "",
        lastSeenPrivacy: key === "lastSeen" ? value : updatedSettings.lastSeen,
        onlineStatusPrivacy:
          key === "onlineStatus" ? value : updatedSettings.onlineStatus,
        readReceiptsEnabled:
          key === "readReceipts" ? value : updatedSettings.readReceipts,
      });
      updateUser(responseUser);
      toast.success("Đã cập nhật cài đặt quyền riêng tư!");
    } catch (err) {
      console.error("Failed to update privacy settings:", err);
      toast.error("Không thể cập nhật cài đặt quyền riêng tư");
      // Revert state on error
      if (user) {
        setPrivacySettings({
          lastSeen: user.lastSeenPrivacy,
          onlineStatus: user.onlineStatusPrivacy,
          readReceipts: user.readReceiptsEnabled,
        });
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
          {t("settings.privacy.title")}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
          {t("settings.privacy.subtitle")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Last Seen */}
        <div className="space-y-3">
          <label className="text-base font-bold text-slate-900 dark:text-white">
            {t("settings.privacy.last_seen")}
          </label>
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
                {option === "everyone"
                  ? t("settings.privacy.everyone")
                  : option === "contacts"
                  ? t("settings.privacy.contacts")
                  : t("settings.privacy.nobody")}
              </button>
            ))}
          </div>
        </div>

        {/* Online Status */}
        <div className="space-y-3">
          <label className="text-base font-bold text-slate-900 dark:text-white">
            {t("settings.privacy.online_status")}
          </label>
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
                {option === "everyone"
                  ? t("settings.privacy.everyone")
                  : option === "contacts"
                  ? t("settings.privacy.contacts")
                  : t("settings.privacy.nobody")}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-t border-slate-200 dark:border-white/10 my-8" />

        {/* Read Receipts */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined font-fill">
                done_all
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {t("settings.privacy.read_receipts")}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t("settings.privacy.read_receipts_desc")}
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              handlePrivacyChange("readReceipts", !privacySettings.readReceipts)
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              privacySettings.readReceipts
                ? "bg-primary"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <span
              className={`${
                privacySettings.readReceipts ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </button>
        </div>

        {/* Blocked Users */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <span className="material-symbols-outlined font-fill">
                  block
                </span>
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {t("settings.privacy.blocked_users")}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t("settings.privacy.blocked_count", { count: 0 })}
                </p>
              </div>
            </div>
            <button className="text-sm font-bold text-primary px-4 py-2 hover:bg-primary/10 rounded-xl transition-all">
              {t("settings.privacy.manage")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyTab;
