import React from "react";
import { User } from "../../types";
import { useNavigate, useLocation } from "react-router-dom";
import { useFriendRequest } from "../../context/FriendRequestContext";

interface SidebarNavProps {
  user: User;
  avatar: string;
  onNewChat: () => void;
  onNewGroup: () => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({
  user,
  avatar,
  onNewChat,
  onNewGroup,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingCount } = useFriendRequest();

  const navItems = [
    { id: "chats", icon: "forum", label: "Chats", path: "/chat" },
    {
      id: "contacts",
      icon: "contacts",
      label: "Contacts",
      path: "/friends/list",
    },
    {
      id: "requests",
      icon: "person_add",
      label: "Requests",
      path: "/friends/requests",
    },
    { id: "settings", icon: "settings", label: "Settings", path: "/settings" },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;

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
        <nav className="flex flex-col items-center gap-3 w-full px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`relative flex items-center justify-center w-full h-9 lg:h-10 rounded-2xl transition-all duration-300 group ${
                isActive(item.path)
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-primary"
              }`}
              title={item.label}
            >
              <span
                className={`material-symbols-outlined text-[18px] lg:text-[22px] ${
                  isActive(item.path) ? "font-fill" : ""
                }`}
              >
                {item.icon}
              </span>
              {isActive(item.path) && (
                <div className="absolute left-0 w-0.5 h-6 bg-white rounded-r-full" />
              )}
              {/* Notification Badge for Requests */}
              {item.id === "requests" && pendingCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-lg animate-pulse">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </div>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Actions at Bottom */}
      <div className="flex flex-col items-center gap-3 px-2 w-full mt-auto">
        <button
          onClick={onNewGroup}
          className="flex items-center justify-center w-full h-9 lg:h-10 rounded-2xl bg-white/10 text-slate-400 hover:text-primary hover:bg-white/20 transition-all duration-300 group"
          title="New Group"
        >
          <span className="material-symbols-outlined text-[20px]">
            group_add
          </span>
        </button>
        <button
          onClick={onNewChat}
          className="flex items-center justify-center w-full h-9 lg:h-10 rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-300 group"
          title="New Chat"
        >
          <span className="material-symbols-outlined text-[22px] font-bold">
            add
          </span>
        </button>
      </div>
    </aside>
  );
};

export default SidebarNav;
