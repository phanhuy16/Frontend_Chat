import React, { useState } from "react";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";

const ACCENT_COLORS = [
  { name: "Indigo", value: "#6366f1", class: "bg-[#6366f1]" },
  { name: "Blue", value: "#3b82f6", class: "bg-[#3b82f6]" },
  { name: "Rose", value: "#f43f5e", class: "bg-[#f43f5e]" },
  { name: "Amber", value: "#f59e0b", class: "bg-[#f59e0b]" },
  { name: "Emerald", value: "#10b981", class: "bg-[#10b981]" },
  { name: "Violet", value: "#8b5cf6", class: "bg-[#8b5cf6]" },
];

const InterfaceTab: React.FC = () => {
  const { accentColor, fontSize, updateAccentColor, updateFontSize } =
    useTheme();
  const { t, i18n } = useTranslation();
  const [wallpaper, setWallpaperState] = useState(
    localStorage.getItem("chat-wallpaper") || "default"
  );

  const WALLPAPERS = [
    {
      id: "default",
      name: t("settings.interface.wallpapers.default"),
      value: "transparent",
    },
    {
      id: "solid-dark",
      name: t("settings.interface.wallpapers.minimal"),
      value: "#0f172a",
    },
    {
      id: "gradient-blue",
      name: t("settings.interface.wallpapers.ocean"),
      value: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
    },
    {
      id: "gradient-purple",
      name: t("settings.interface.wallpapers.dream"),
      value: "linear-gradient(135deg, #4c1d95, #7c3aed)",
    },
    {
      id: "pattern-dots",
      name: t("settings.interface.wallpapers.pattern"),
      value: "radial-gradient(#ffffff22 1px, transparent 1px)",
      size: "20px 20px",
    },
  ];

  const handleAccentUpdate = (color: string) => {
    updateAccentColor(color);
    toast.success("Đã cập nhật màu chủ đạo!");
  };

  const updateWallpaper = (id: string) => {
    setWallpaperState(id);
    localStorage.setItem("chat-wallpaper", id);
    toast.success("Đã cài đặt hình nền chat!");
  };

  const handleFontSizeUpdate = (size: string) => {
    updateFontSize(size);
    toast.success("Đã điều chỉnh cỡ chữ!");
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    toast.success(
      lng === "vi" ? "Đã chuyển sang Tiếng Việt" : "Switched to English"
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
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                i18n.language === "vi"
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
            >
              <img
                src="https://flagcdn.com/w40/vn.png"
                alt="Vietnamese"
                className="w-5 h-3.5 object-cover rounded-sm"
              />
              Tiếng Việt
            </button>
            <button
              onClick={() => changeLanguage("en")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                i18n.language === "en"
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
            >
              <img
                src="https://flagcdn.com/w40/us.png"
                alt="English"
                className="w-5 h-3.5 object-cover rounded-sm"
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
                className={`w-12 h-12 rounded-full ${
                  color.class
                } flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg ${
                  accentColor === color.value
                    ? "ring-4 ring-offset-2 ring-primary dark:ring-offset-slate-900"
                    : ""
                }`}
                title={color.name}
              >
                {accentColor === color.value && (
                  <span className="material-symbols-outlined text-white text-xl font-bold">
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
            {WALLPAPERS.map((wp) => (
              <button
                key={wp.id}
                onClick={() => updateWallpaper(wp.id)}
                className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${
                  wallpaper === wp.id
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
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
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
    </div>
  );
};

export default InterfaceTab;
