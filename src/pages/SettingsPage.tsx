import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { getAvatarUrl } from "../utils/helpers";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
// Tabs
import ProfileTab from "../components/Settings/ProfileTab";
import NotificationsTab from "../components/Settings/NotificationsTab";
import PrivacyTab from "../components/Settings/PrivacyTab";
import InterfaceTab from "../components/Settings/InterfaceTab";
import ReportsTab from "../components/Settings/ReportsTab";
import SecuritySettings from "../components/Settings/SecuritySettings";
import { userApi } from "../api/user.api";
import { User } from "../types";

type TabId =
  | "profile"
  | "notifications"
  | "privacy"
  | "interface"
  | "reports"
  | "security";

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(true); // Default to menu on mobile

  useEffect(() => {
    const fetchUser = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const userData = await userApi.getUserById(user.id);
        setCurrentUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [user?.id]);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/auth";
  };

  const tabs = [
    { id: "profile", label: t("settings.sidebar.profile"), icon: "person" },
    {
      id: "notifications",
      label: t("settings.sidebar.notifications"),
      icon: "notifications",
    },
    { id: "privacy", label: t("settings.sidebar.privacy"), icon: "lock" },
    {
      id: "interface",
      label: t("settings.sidebar.interface"),
      icon: "palette",
    },
    { id: "reports", label: t("settings.sidebar.reports"), icon: "flag" },
    { id: "security", label: t("settings.sidebar.security"), icon: "security" },
  ] as const;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (activeTab) {
      case "profile":
        return <ProfileTab user={currentUser} logout={logout} />;
      case "notifications":
        return <NotificationsTab />;
      case "privacy":
        return <PrivacyTab user={currentUser} />;
      case "interface":
        return <InterfaceTab />;
      case "reports":
        return <ReportsTab />;
      case "security":
        return <SecuritySettings />;
      default:
        return <ProfileTab user={currentUser} logout={logout} />;
    }
  };

  const handleTabSelect = (tabId: TabId) => {
    setActiveTab(tabId);
    setShowMobileMenu(false);
  };

  return (
    <div className="flex-1 flex gap-0 lg:gap-4 overflow-hidden h-full relative">
      {/* Column 2: Settings Sidebar */}
      <aside
        className={`flex flex-col w-full md:w-[280px] lg:w-[320px] glass-effect lg:rounded-3xl shrink-0 overflow-hidden p-6 transition-all duration-300 ${
          showMobileMenu ? "flex" : "hidden md:flex"
        }`}
      >
        <div className="flex flex-col justify-between h-full">
          <div className="flex flex-col gap-8">
            {/* User Info Card */}
            <div className="flex gap-3 items-center p-3 rounded-xl bg-slate-100/50 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-premium">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-10 shadow-lg border-2 border-white dark:border-white/10"
                style={{
                  backgroundImage: `url("${getAvatarUrl(user?.avatar)}")`,
                }}
              />

              <div className="flex flex-col min-w-0">
                <h1 className="text-slate-900 dark:text-white text-base font-black truncate">
                  {user?.displayName}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex flex-col gap-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1">
                {t("settings.sidebar.general")}
              </p>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group ${
                    activeTab === tab.id
                      ? "bg-primary text-white shadow-lg shadow-primary/25"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-lg ${
                      activeTab === tab.id ? "font-fill" : ""
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <p className="text-[11px] font-bold">{tab.label}</p>
                  {activeTab === tab.id && (
                    <div className="ml-auto w-1 h-1 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all font-bold group"
          >
            <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-1">
              logout
            </span>
            <p className="text-[11px]">{t("common.logout")}</p>
          </button>
        </div>
      </aside>

      {/* Column 3: Settings Content Area */}
      <main
        className={`flex-1 overflow-y-auto glass-effect lg:rounded-3xl transition-all duration-500 relative bg-white/30 dark:bg-transparent ${
          !showMobileMenu ? "flex" : "hidden md:flex"
        }`}
      >
        <div className="p-6 lg:p-10 mx-auto max-w-4xl w-full">
          {/* Back Button (Mobile) */}
          <button
            onClick={() => setShowMobileMenu(true)}
            className="flex md:hidden items-center gap-2 text-slate-500 hover:text-primary mb-6 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="font-bold text-sm">{t("common.back")}</span>
          </button>
          {/* Dynamic Page Heading */}
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-0.5 w-6 rounded-full bg-primary" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                {t("settings.title")}
              </p>
            </div>
            <h1 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight mb-2">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium max-w-2xl">
              {activeTab === "profile" && t("settings.descriptions.profile")}
              {activeTab === "notifications" &&
                t("settings.descriptions.notifications")}
              {activeTab === "privacy" && t("settings.descriptions.privacy")}
              {activeTab === "interface" &&
                t("settings.descriptions.interface")}
              {activeTab === "reports" && t("settings.descriptions.reports")}
              {activeTab === "security" && t("settings.descriptions.security")}
            </p>
          </div>

          {/* Render Tab Content */}
          <div className="relative min-h-[400px]">{renderContent()}</div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-40 left-20 -z-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      </main>
    </div>
  );
};

export default SettingsPage;
