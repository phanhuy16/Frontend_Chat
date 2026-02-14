import React, { useState, useEffect } from "react";
import { userApi } from "../../api/user.api";
import { getAvatarUrl } from "../../utils/helpers";
import toast from "react-hot-toast";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { Modal } from "antd";
import { User } from "../../types/user.types";
import { useTranslation } from "react-i18next";

const { confirm } = Modal;

interface ProfileTabProps {
  user: User | null;
  logout: () => Promise<void>;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user, logout }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
    bio: user?.bio || "", // Initialize bio from user data
    customStatus: user?.customStatus || "", // Initialize customStatus from user data
    currentPassword: "",
    newPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Sync state when user prop changes (e.g., after initial fetch in SettingsPage)
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        email: user.email || "",
        bio: user.bio || "",
        customStatus: user.customStatus || "",
        currentPassword: "",
        newPassword: "",
      });
      setAvatarPreview(user.avatar || "");
    }
  }, [user]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      userApi
        .uploadAvatar(file)
        .then((data) => {
          setAvatarPreview(data.avatarUrl);
          toast.success(t("toast.avatar_updated"));
        })
        .catch((err) => {
          console.error("Avatar upload error:", err);
          toast.error(t("toast.avatar_error"));
        });
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userApi.updateProfile({
        displayName: formData.displayName,
        bio: formData.bio,
      });

      if (formData.customStatus !== user?.customStatus) {
        await userApi.updateCustomStatus(formData.customStatus || null);
      }

      toast.success(t("toast.profile_saved"));
    } catch (error) {
      // Changed err to error for consistency
      toast.error(t("toast.save_error"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.currentPassword || !formData.newPassword) {
      toast.error(t("settings.profile.enter_passwords"));
      return;
    }

    setLoading(true);
    try {
      await userApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success(t("toast.password_changed"));
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
      }));
    } catch (err) {
      toast.error(t("toast.password_error"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    confirm({
      title: t("settings.profile.delete_modal_title"),
      icon: <ExclamationCircleFilled style={{ color: "red" }} />,
      content: t("settings.profile.delete_modal_content"),
      onOk: async () => {
        setLoading(true);
        try {
          await userApi.deleteAccount();
          toast.success(t("toast.account_deleted"));
          await logout();
          window.location.href = "/auth";
        } catch (err) {
          toast.error(t("toast.delete_account_error"));
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Profile Header */}
      <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-premium">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex gap-4 items-center">
            <div className="relative group">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-16 w-16 border-4 border-white dark:border-white/10 shadow-lg"
                style={{
                  backgroundImage: `url("${getAvatarUrl(avatarPreview)}")`,
                }}
              />
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <span className="material-symbols-outlined text-lg">
                  photo_camera
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-gray-900 dark:text-white text-xl font-black tracking-tight">
                {user?.displayName}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
                {t("settings.descriptions.profile")}
              </p>
            </div>
          </div>
          <label className="flex min-w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white text-[11px] font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-all sm:w-auto">
            <span className="truncate">
              {t("settings.profile.upload_photo")}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Basic Info Form */}
      <form onSubmit={handleSaveChanges} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="flex flex-col gap-2">
            <label
              className="text-slate-700 dark:text-slate-300 text-sm font-bold px-1"
              htmlFor="displayName"
            >
              {t("settings.profile.display_name")}
            </label>
            <input
              className="w-full rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 h-9 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-400 text-sm"
              id="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-slate-700 dark:text-slate-300 text-sm font-bold px-1"
              htmlFor="email"
            >
              {t("settings.profile.email")}
            </label>
            <input
              className="w-full rounded-xl text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 h-9 px-4 cursor-not-allowed text-sm"
              id="email"
              type="email"
              value={formData.email}
              disabled
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 text-left">
          <label
            className="text-slate-700 dark:text-slate-300 text-sm font-bold px-1"
            htmlFor="bio"
          >
            {t("settings.profile.bio")}
          </label>
          <textarea
            className="w-full rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-400 min-h-[100px] resize-none text-sm"
            id="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder={t("settings.profile.placeholder_bio")}
          />
        </div>

        {/* Custom Status */}
        <div className="flex flex-col gap-2 text-left">
          <label
            className="text-slate-700 dark:text-slate-300 text-sm font-bold px-1"
            htmlFor="customStatus"
          >
            {t("settings.profile.custom_status")}
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined text-lg">
                sentiment_satisfied
              </span>
            </div>
            <input
              id="customStatus"
              type="text"
              placeholder={t("settings.profile.placeholder_status")}
              className="w-full h-9 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-400"
              value={formData.customStatus}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="flex justify-start">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl h-9 px-6 bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {loading ? t("common.loading") : t("settings.profile.save_changes")}
          </button>
        </div>
      </form>

      <hr className="border-t border-slate-200 dark:border-white/10 my-8" />

      {/* Security Section */}
      <div className="text-left">
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
          {t("settings.profile.change_password")}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
          {t("settings.profile.enter_passwords")}
        </p>

        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label
                className="text-slate-700 dark:text-slate-300 text-sm font-bold px-1"
                htmlFor="currentPassword"
              >
                {t("settings.profile.current_password")}
              </label>
              <input
                className="w-full rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 h-9 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-400 text-sm"
                id="currentPassword"
                placeholder="••••••••"
                type="password"
                value={formData.currentPassword}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                className="text-slate-700 dark:text-slate-300 text-sm font-bold px-1"
                htmlFor="newPassword"
              >
                {t("settings.profile.new_password")}
              </label>
              <input
                className="w-full rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 h-9 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-400 text-sm"
                id="newPassword"
                placeholder="••••••••"
                type="password"
                value={formData.newPassword}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex justify-start">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl h-9 px-6 bg-slate-800 dark:bg-white/10 text-white text-xs font-bold hover:bg-slate-900 dark:hover:bg-white/20 disabled:opacity-50 transition-all"
            >
              {loading
                ? t("common.loading")
                : t("settings.profile.update_password")}
            </button>
          </div>
        </form>
      </div>

      <hr className="border-t border-slate-200 dark:border-white/10 my-8" />

      {/* Danger Zone */}
      <div className="text-left bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
        <h2 className="text-xl font-black text-red-600 dark:text-red-500 mb-2">
          {t("settings.profile.danger_zone")}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
          {t("settings.profile.delete_confirm")}
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl h-9 px-5 bg-red-600 text-white text-xs font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
        >
          {loading ? t("common.loading") : t("settings.profile.delete_account")}
        </button>
      </div>
    </div>
  );
};

export default ProfileTab;
