import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useFriendRequest } from "../../context/FriendRequestContext";
import { useTranslation } from "react-i18next";

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingCount } = useFriendRequest();
  const { t } = useTranslation();

  const navItems = [
    { id: "chats", icon: "forum", label: t("sidebar.chats"), path: "/chat" },
    {
      id: "contacts",
      icon: "contacts",
      label: t("sidebar.contacts"),
      path: "/friends/list",
    },
    {
      id: "requests",
      icon: "person_add",
      label: t("sidebar.requests"),
      path: "/friends/requests",
    },
    {
      id: "settings",
      icon: "settings",
      label: t("sidebar.settings"),
      path: "/settings",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/chat") {
      return (
        location.pathname.startsWith("/chat") &&
        !location.pathname.startsWith("/chat/archived")
      );
    }
    return location.pathname === path;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-2 px-4 z-[100] pb-safe">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => navigate(item.path)}
          className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${
            isActive(item.path)
              ? "text-primary scale-110"
              : "text-slate-400 dark:text-slate-500"
          }`}
        >
          <span
            className={`material-symbols-outlined text-[24px] ${
              isActive(item.path) ? "font-fill" : ""
            }`}
          >
            {item.icon}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {item.label}
          </span>
          {item.id === "requests" && pendingCount > 0 && (
            <div className="absolute top-0 right-1 bg-red-500 text-white text-[9px] font-black rounded-full size-4 flex items-center justify-center border-2 border-white dark:border-slate-900">
              {pendingCount > 9 ? "!" : pendingCount}
            </div>
          )}
          {isActive(item.path) && (
            <div className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
          )}
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
