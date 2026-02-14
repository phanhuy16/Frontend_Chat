import React from "react";
import { User } from "../../types";
import { useNavigate, useLocation } from "react-router-dom";
import { useFriendRequest } from "../../context/FriendRequestContext";
import { useTranslation } from "react-i18next";

interface SidebarNavProps {
  user: User;
  avatar: string;
  onNewChat: () => void;
  onNewGroup: () => void;
  onGlobalSearch?: () => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({
  user,
  avatar,
  onNewChat,
  onNewGroup,
  onGlobalSearch,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingCount } = useFriendRequest();
  const { i18n, t } = useTranslation();

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
      id: "archived",
      icon: "archive",
      label: t("sidebar.archived"),
      path: "/chat/archived",
    },
    {
      id: "settings",
      icon: "settings",
      label: t("sidebar.settings"),
      path: "/settings",
    },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === "/chat") {
      // For main chats, active if it starts with /chat but NOT /chat/archived
      return (
        location.pathname.startsWith("/chat") &&
        !location.pathname.startsWith("/chat/archived")
      );
    }
    if (path === "/chat/archived") {
      // For archived, active if it starts with /chat/archived
      return location.pathname.startsWith("/chat/archived");
    }
    return location.pathname === path;
  };

  return (
    <aside className="hidden md:flex flex-col w-14 lg:w-16 glass-effect lg:rounded-3xl shrink-0 overflow-hidden py-4 items-center justify-between">
      <div className="flex flex-col items-center gap-6 w-full">
        {/* User Profile */}
        <div
          className="relative group cursor-pointer"
          onClick={() => navigate("/settings")}
        >
          <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-secondary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
          <div
            className="relative bg-center bg-no-repeat aspect-square bg-cover rounded-2xl size-9 lg:size-10 border-2 border-white/20 dark:border-white/10 shadow-premium"
            style={{ backgroundImage: `url("${avatar}")` }}
            title={user.displayName}
          />
          <div className="absolute bottom-0 right-0 size-3 rounded-full bg-[#0bda5b] border-2 border-white dark:border-slate-800" />
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-4 w-full">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`relative flex items-center justify-center size-9 lg:size-10 rounded-2xl transition-all duration-300 group ${
                isActive(item.path)
                  ? "bg-primary text-white shadow-xl shadow-primary/40 scale-105"
                  : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-primary"
              }`}
              title={item.label}
            >
              <span
                className={`material-symbols-outlined text-[20px] lg:text-[22px] transition-transform duration-300 group-hover:scale-110 ${
                  isActive(item.path) ? "font-fill" : ""
                }`}
              >
                {item.icon}
              </span>
              {isActive(item.path) && (
                <div className="absolute -left-2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
              )}
              {/* Notification Badge for Requests */}
              {item.id === "requests" && pendingCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full size-4 flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 group-hover:scale-110 transition-transform">
                  {pendingCount > 9 ? "!" : pendingCount}
                </div>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Actions at Bottom */}
      <div className="flex flex-col items-center gap-4 w-full mt-auto">
        <button
          onClick={onGlobalSearch}
          className="flex items-center justify-center size-9 lg:size-10 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-primary hover:bg-slate-200 dark:hover:bg-white/10 transition-all duration-300 group"
          title={t("sidebar.global_search")}
        >
          <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
            manage_search
          </span>
        </button>
        <button
          onClick={onNewGroup}
          className="flex items-center justify-center size-9 lg:size-10 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-primary hover:bg-slate-200 dark:hover:bg-white/10 transition-all duration-300 group"
          title={t("sidebar.new_group")}
        >
          <span className="material-symbols-outlined text-[20px] group-hover:rotate-6 transition-transform">
            group_add
          </span>
        </button>
        <button
          onClick={onNewChat}
          className="flex items-center justify-center size-9 lg:size-10 rounded-2xl bg-primary text-white shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all duration-300 group"
          title={t("sidebar.new_chat")}
        >
          <span className="material-symbols-outlined text-[20px] font-black group-hover:rotate-12 transition-transform">
            add
          </span>
        </button>
      </div>
    </aside>
  );
};

export default SidebarNav;
