import React, { useState } from "react";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import ThemeSelector from "./ThemeSelector";
import { CHAT_WALLPAPERS } from "../../config/themes.config";

const ACCENT_COLORS = [
  { name: "Indigo", value: "#6366f1", class: "bg-[#6366f1]" },
  { name: "Blue", value: "#3b82f6", class: "bg-[#3b82f6]" },
  { name: "Rose", value: "#f43f5e", class: "bg-[#f43f5e]" },
  { name: "Amber", value: "#f59e0b", class: "bg-[#f59e0b]" },
  { name: "Emerald", value: "#10b981", class: "bg-[#10b981]" },
  { name: "Violet", value: "#8b5cf6", class: "bg-[#8b5cf6]" },
];

const InterfaceTab: React.FC = () => {
  const {
    theme,
    accentColor,
    fontSize,
    updateAccentColor,
    updateFontSize,
    globalChatWallpaper,
    setGlobalChatWallpaper,
  } = useTheme();
  const { t, i18n } = useTranslation();
  const [themeSelectorOpen, setThemeSelectorOpen] = useState(false);

  const handleAccentUpdate = (color: string) => {
    updateAccentColor(color);
    toast.success(t("toast.success_update_accent"));
  };

  const updateWallpaper = (id: string) => {
    setGlobalChatWallpaper(id);
    toast.success(t("toast.success_bg_set"));
  };

  const handleFontSizeUpdate = (size: string) => {
    updateFontSize(size);
    toast.success(t("toast.success_font_size"));
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    toast.success(
      lng === "vi" ? t("toast.switched_to_vi") : t("toast.switched_to_en"),
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
          {t("settings.interface.title")}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
          {t("settings.interface.subtitle")}
        </p>
      </div>

      <div className="space-y-8">
        {/* Theme Selection */}
        <div className="space-y-4">
          <label className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              palette
            </span>
            {t("settings.interface.theme_label")}
          </label>
          <button
            onClick={() => setThemeSelectorOpen(true)}
            className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">brush</span>
            {t("settings.interface.theme_select")} ({theme})
          </button>
        </div>

        <hr className="border-t border-slate-200 dark:border-white/10" />

        {/* Language Settings */}
        <div className="space-y-4">
          <label className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              language
            </span>
            {t("settings.interface.language")}
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => changeLanguage("vi")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                i18n.language === "vi"
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
            >
              <img
                src="https://flagcdn.com/w40/vn.png"
                alt="Vietnamese"
                className="w-4 h-3 object-cover rounded-sm"
              />
              Tiếng Việt
            </button>
            <button
              onClick={() => changeLanguage("en")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                i18n.language === "en"
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
            >
              <img
                src="https://flagcdn.com/w40/us.png"
                alt="English"
                className="w-4 h-3 object-cover rounded-sm"
              />
              English
            </button>
          </div>
        </div>

        <hr className="border-t border-slate-200 dark:border-white/10" />

        {/* Accent Color */}
        <div className="space-y-4">
          <label className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              colorize
            </span>
            {t("settings.interface.accent_color")}
          </label>
          <div className="flex flex-wrap gap-4">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => handleAccentUpdate(color.value)}
                className={`w-10 h-10 rounded-full ${
                  color.class
                } flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg ${
                  accentColor === color.value
                    ? "ring-4 ring-offset-2 ring-primary dark:ring-offset-slate-900"
                    : ""
                }`}
                title={color.name}
              >
                {accentColor === color.value && (
                  <span className="material-symbols-outlined text-white text-lg font-bold">
                    check
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-t border-slate-200 dark:border-white/10" />

        {/* Chat Wallpaper */}
        <div className="space-y-4">
          <label className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              wallpaper
            </span>
            {t("settings.interface.wallpaper")}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {CHAT_WALLPAPERS.map((wp) => (
              <button
                key={wp.id}
                onClick={() => updateWallpaper(wp.id)}
                className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${
                  globalChatWallpaper === wp.id
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                <div
                  className="w-full aspect-[4/3] rounded-lg shadow-sm"
                  style={{
                    background: wp.value,
                    backgroundSize: wp.size,
                  }}
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {wp.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <hr className="border-t border-slate-200 dark:border-white/10" />

        {/* Font Size */}
        <div className="space-y-4">
          <label className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              text_fields
            </span>
            {t("settings.interface.font_size")}
          </label>
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl w-fit">
            {["small", "normal", "large"].map((size) => (
              <button
                key={size}
                onClick={() => handleFontSizeUpdate(size)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  fontSize === size
                    ? "bg-white dark:bg-white/10 text-primary shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {size === "small"
                  ? t("settings.interface.sizes.small")
                  : size === "normal"
                    ? t("settings.interface.sizes.medium")
                    : t("settings.interface.sizes.large")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Theme Selector Modal */}
      <ThemeSelector
        open={themeSelectorOpen}
        onClose={() => setThemeSelectorOpen(false)}
      />
    </div>
  );
};

export default InterfaceTab;
