import React, { useState } from "react";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";

const ACCENT_COLORS = [
  { name: "Indigo", value: "#6366f1", class: "bg-[#6366f1]" },
  { name: "Blue", value: "#3b82f6", class: "bg-[#3b82f6]" },
  { name: "Rose", value: "#f43f5e", class: "bg-[#f43f5e]" },
  { name: "Amber", value: "#f59e0b", class: "bg-[#f59e0b]" },
  { name: "Emerald", value: "#10b981", class: "bg-[#10b981]" },
  { name: "Violet", value: "#8b5cf6", class: "bg-[#8b5cf6]" },
];

const WALLPAPERS = [
  { id: "default", name: "Mặc định", value: "transparent" },
  { id: "solid-dark", name: "Tối giản", value: "#0f172a" },
  {
    id: "gradient-blue",
    name: "Xanh biển",
    value: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
  },
  {
    id: "gradient-purple",
    name: "Tím mộng",
    value: "linear-gradient(135deg, #4c1d95, #7c3aed)",
  },
  {
    id: "pattern-dots",
    name: "Họa tiết",
    value: "radial-gradient(#ffffff22 1px, transparent 1px)",
    size: "20px 20px",
  },
];

const InterfaceTab: React.FC = () => {
  const { accentColor, fontSize, updateAccentColor, updateFontSize } =
    useTheme();
  const [wallpaper, setWallpaperState] = useState(
    localStorage.getItem("chat-wallpaper") || "default"
  );

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
          Giao diện & Trải nghiệm
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
          Tùy chỉnh màu sắc, hình nền và hiển thị để ứng dụng trở nên cá tính
          hơn.
        </p>
      </div>

      <div className="space-y-8">
        {/* Accent Color */}
        <div className="space-y-4">
          <label className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              colorize
            </span>
            Màu sắc chủ đạo
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
            Hình nền cuộc trò chuyện
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
            Cỡ chữ tin nhắn
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
                {size === "small" ? "Nhỏ" : size === "normal" ? "Vừa" : "Lớn"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterfaceTab;
