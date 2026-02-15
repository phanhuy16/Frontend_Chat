import { Button, Modal, Switch } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import blockApi from "../../api/block.api";
import reportApi from "../../api/report.api";
import { conversationApi } from "../../api/conversation.api";
import { useAuth } from "../../hooks/useAuth";
import {
  Conversation,
  ConversationMember,
  StatusUser,
  User,
} from "../../types";
import { useTranslation } from "react-i18next";
import { Message } from "../../types/message.types";
import { getAvatarUrl, formatLastActive } from "../../utils/helpers";
import ConversationMedia from "./ConversationMedia";
import ReportModal from "./ReportModal";
import SlowModeSelector from "./SlowModeSelector";
import { ChatContext } from "../../context/ChatContext";
import { useContext } from "react";

interface ContactInfoSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  otherMember?: User | ConversationMember | null;
  conversation?: Conversation | null;
  messages?: Message[];
  onPinMessage?: (messageId: number) => void;
  onBlockChange?: (isBlocked: boolean) => void;
  onStartAudioCall: () => void;
  onStartVideoCall: () => void;
  onThemeChange?: (theme: "default" | "dark" | "light" | "custom") => void;
  onNotificationChange?: (settings: any) => void;
  onConversationUpdate?: (updatedConversation: Conversation) => void;
}

const ContactInfoSidebar: React.FC<ContactInfoSidebarProps> = ({
  isOpen,
  onClose,
  otherMember,
  conversation,
  messages = [],
  onBlockChange,
  onStartAudioCall,
  onStartVideoCall,
  onThemeChange,
  onNotificationChange,
  onConversationUpdate,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"info" | "media">("info");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [isAdminToolsOpen, setIsAdminToolsOpen] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [groupName, setGroupName] = useState(conversation?.groupName || "");
  const [groupDescription, setGroupDescription] = useState(
    conversation?.description || "",
  );

  // Notification settings
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    sound: true,
    preview: true,
    mute: false,
    muteUntil: "never",
  });

  // Theme settings
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<
    "default" | "dark" | "light" | "custom"
  >("default");

  // Report settings
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Check if user is blocked
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (user?.id && otherMember?.id) {
        try {
          const blocked = await blockApi.isUserBlocked(user.id, otherMember.id);
          setIsBlocked(blocked);
        } catch (err) {
          console.error("Error checking block status:", err);
        }
      }
    };

    if (isOpen) {
      checkBlockStatus();
    }
  }, [isOpen, user?.id, otherMember?.id]);

  // Load notification settings from localStorage
  useEffect(() => {
    const convId = conversation?.id;
    if (convId) {
      const saved = localStorage.getItem(`notif_${convId}`);
      if (saved) {
        setNotificationSettings(JSON.parse(saved));
      }
    }
  }, [conversation?.id]);

  // Load theme settings from localStorage
  useEffect(() => {
    const convId = conversation?.id;
    if (convId) {
      const saved = localStorage.getItem(`theme_${convId}`);
      if (saved) {
        setSelectedTheme(saved as any);
      } else {
        setSelectedTheme("default");
      }
    }
  }, [conversation?.id]);

  useEffect(() => {
    if (conversation) {
      setGroupName(conversation.groupName || "");
      setGroupDescription(conversation.description || "");
    }
  }, [conversation]);

  const isGroupAdmin = useMemo(() => {
    if (!conversation || !user) return false;
    return conversation.createdBy === user.id;
  }, [conversation, user]);

  // Handle block/unblock
  const handleBlockUser = async () => {
    if (!user?.id || !otherMember?.id) return;

    setBlockLoading(true);
    try {
      if (isBlocked) {
        await blockApi.unblockUser(user.id, otherMember.id);
        toast.success(
          t("toast.unblock_success", { name: otherMember.displayName }),
        );
        setIsBlocked(false);
        onBlockChange?.(false);
      } else {
        await blockApi.blockUser(user.id, otherMember.id);
        toast.success(
          t("toast.block_success", { name: otherMember.displayName }),
        );
        setIsBlocked(true);
        onBlockChange?.(true);
      }
    } catch (err) {
      console.error("Error blocking user:", err);
      toast.error(t("toast.block_error"));
    } finally {
      setBlockLoading(false);
    }
  };

  // Handle notification settings save
  const handleNotificationSave = () => {
    const convId = conversation?.id;
    if (convId) {
      localStorage.setItem(
        `notif_${convId}`,
        JSON.stringify(notificationSettings),
      );
      onNotificationChange?.(notificationSettings);
      toast.success(t("toast.save_notif_success"));
      setNotificationModalOpen(false);
    }
  };

  // Handle theme settings save
  const handleThemeSave = () => {
    const convId = conversation?.id;
    if (convId) {
      localStorage.setItem(`theme_${convId}`, selectedTheme);
      onThemeChange?.(selectedTheme);
      toast.success(t("toast.save_theme_success"));
      setThemeModalOpen(false);
    }
  };

  // Removed: handleReportSubmit function
  // Removed: handleReportModalClose function

  // Extract all attachments from messages
  const allAttachments = useMemo(() => {
    const attachments: Array<{
      id: number;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      type: "image" | "file";
      messageId: number;
      senderName: string;
    }> = [];

    messages.forEach((msg) => {
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((attachment) => {
          const isImage = attachment.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i);
          attachments.push({
            id: attachment.id,
            fileName: attachment.fileName,
            fileUrl: attachment.fileUrl,
            fileSize: attachment.fileSize,
            type: isImage ? "image" : "file",
            messageId: msg.id,
            senderName: msg.sender?.displayName || "Unknown",
          });
        });
      }
    });

    return attachments.sort(
      (a, b) => new Date(b.fileUrl).getTime() - new Date(a.fileUrl).getTime(),
    );
  }, [messages]);

  const pinnedMessages = useMemo(() => {
    return messages.filter(
      (m) => m.isPinned && !m.isDeleted && !m.isDeletedForMe,
    );
  }, [messages]);

  const getFileUrl = (fileUrl: string) => {
    if (fileUrl.startsWith("http")) {
      return fileUrl;
    }
    const baseUrl = process.env.REACT_APP_API_URL?.replace("/api", "");
    return `${baseUrl}${fileUrl}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed lg:relative top-0 right-0 flex flex-col w-full md:max-w-sm glass-effect md:rounded-l-none lg:rounded-3xl h-full transition-transform duration-500 ease-in-out z-[110] lg:z-50 shadow-2xl lg:shadow-none overflow-hidden
        ${isOpen ? "translate-x-0" : "translate-x-full"}
        lg:translate-x-0 ${isOpen ? "lg:block" : "lg:hidden"}`}
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 shrink-0">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            {activeTab === "info"
              ? t("contact_info.title_info")
              : t("contact_info.title_media")}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
          >
            <span className="material-symbols-outlined !text-[20px]">
              close
            </span>
          </button>
        </header>

        {/* Tabs */}
        <div className="flex px-6 py-1.5 border-b border-slate-200/50 dark:border-slate-800/50 shrink-0 gap-2">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 rounded-lg ${
              activeTab === "info"
                ? "text-primary bg-primary/10 shadow-sm shadow-primary/10"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5"
            }`}
          >
            {t("common.profile")}
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`flex-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 rounded-lg relative ${
              activeTab === "media"
                ? "text-primary bg-primary/10 shadow-sm shadow-primary/10"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5"
            }`}
          >
            {t("contact_info.title_media")}
            {allAttachments.length > 0 && (
              <span className="ml-2 px-1 py-0.5 text-[9px] bg-primary text-white rounded">
                {allAttachments.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === "info" ? (
            <div className="animate-fade-in">
              {/* Contact Info Card */}
              <div className="flex flex-col items-center p-8 gap-5 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-white/[0.02]">
                {/* Avatar */}
                <div className="relative group">
                  <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary to-secondary rounded-[2rem] blur-md opacity-20 group-hover:opacity-40 transition duration-500"></div>
                  <div
                    className="relative bg-center bg-no-repeat aspect-square bg-cover rounded-[1.5rem] size-28 border-4 border-white dark:border-slate-800 shadow-premium"
                    style={{
                      backgroundImage: `url("${
                        getAvatarUrl(otherMember?.avatar) || ""
                      }")`,
                    }}
                  />
                </div>

                {/* Name and Status */}
                <div className="flex flex-col items-center text-center space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    {otherMember?.displayName || conversation?.groupName}
                  </h2>
                  <div className="flex items-center gap-2">
                    {otherMember?.status === StatusUser.Online && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                    )}
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                      {otherMember?.status === StatusUser.Online
                        ? t("contact_info.active_now")
                        : formatLastActive(otherMember?.lastActiveAt, t)}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2.5 w-full">
                  <button
                    onClick={onStartAudioCall}
                    disabled={isBlocked}
                    className="flex-1 h-9 flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 disabled:opacity-30 disabled:hover:shadow-none"
                  >
                    <span className="material-symbols-outlined !text-[18px]">
                      call
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {t("contact_info.call")}
                    </span>
                  </button>
                  <button
                    onClick={onStartVideoCall}
                    disabled={isBlocked}
                    className="flex-1 h-9 flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 disabled:opacity-30 disabled:hover:shadow-none"
                  >
                    <span className="material-symbols-outlined !text-[18px]">
                      videocam
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {t("contact_info.video")}
                    </span>
                  </button>
                </div>
              </div>

              {/* Options Section */}
              <div className="p-6 space-y-6">
                {/* Preferences */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase px-2">
                    {t("contact_info.section_basic")}
                  </h4>

                  <div className="space-y-0.5">
                    {/* Notifications */}
                    <button
                      onClick={() => setNotificationModalOpen(true)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/[0.05] group transition-all duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined !text-[18px]">
                          notifications
                        </span>
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-slate-900 dark:text-white font-bold text-[13px]">
                          {t("contact_info.notifications.title")}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium truncate">
                          {notificationSettings.mute
                            ? t("contact_info.notifications.off")
                            : t("contact_info.notifications.on")}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 group-hover:translate-x-1 transition-transform !text-[18px]">
                        chevron_right
                      </span>
                    </button>

                    {/* Theme */}
                    <button
                      onClick={() => setThemeModalOpen(true)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/[0.05] group transition-all duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined !text-[18px]">
                          palette
                        </span>
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-slate-900 dark:text-white font-bold text-[13px]">
                          {t("contact_info.theme.title")}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium truncate">
                          {t(
                            `contact_info.theme.${selectedTheme as "default" | "dark"}`,
                          )}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 group-hover:translate-x-1 transition-transform !text-[18px]">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>

                {/* Pinned Messages Section */}
                {pinnedMessages.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
                        {t("contact_info.section_pinned")}
                      </h4>
                      <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 text-[9px] font-black rounded-md">
                        {pinnedMessages.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {pinnedMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="group/pin p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-900/30 hover:border-amber-400/50 transition-all cursor-pointer relative overflow-hidden"
                          onClick={() => {
                            const el = document.getElementById(
                              `message-${msg.id}`,
                            );
                            el?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                            el?.classList.add("highlight-message");
                            setTimeout(
                              () => el?.classList.remove("highlight-message"),
                              2000,
                            );
                          }}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="material-symbols-outlined !text-[16px] text-amber-500 mt-0.5">
                              push_pin
                            </span>
                            <div className="flex flex-col min-w-0 flex-1">
                              <p className="text-[11px] font-black text-amber-600 uppercase tracking-wide">
                                {msg.sender?.displayName ||
                                  t("chat.unknown_user")}
                              </p>
                              <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium truncate line-clamp-2">
                                {msg.content ||
                                  (msg.attachments?.length
                                    ? t("settings.profile.save_changes") // Reuse or add specific key
                                    : t("chat.pinned"))}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Privacy & Safety */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase px-2">
                    {t("contact_info.section_security")}
                  </h4>

                  <div className="space-y-0.5">
                    <button
                      onClick={handleBlockUser}
                      disabled={blockLoading}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl group transition-all duration-200 ${
                        isBlocked
                          ? "bg-red-50 dark:bg-red-900/10 text-red-600"
                          : "hover:bg-slate-100/80 dark:hover:bg-white/[0.05] text-slate-600 dark:text-slate-300"
                      } disabled:opacity-50`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
                          isBlocked
                            ? "bg-red-100 text-red-600"
                            : "bg-slate-100 dark:bg-white/5 text-slate-500"
                        }`}
                      >
                        <span className="material-symbols-outlined !text-[18px]">
                          {isBlocked ? "verified_user" : "block"}
                        </span>
                      </div>
                      <span className="flex-1 text-left font-bold text-[13px]">
                        {isBlocked
                          ? t("contact_info.unblock_user")
                          : t("contact_info.block_user")}
                      </span>
                    </button>

                    <button
                      onClick={() => setReportModalOpen(true)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 group transition-all duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined !text-[18px]">
                          report_gmailerrorred
                        </span>
                      </div>
                      <span className="flex-1 text-left font-bold text-[13px]">
                        {t("contact_info.report")}
                      </span>
                      <span className="material-symbols-outlined text-red-300 group-hover:translate-x-1 transition-transform !text-[18px]">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>

                {/* Admin Tools - Only for Group Admins */}
                {conversation?.conversationType === 1 && isGroupAdmin && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setIsAdminToolsOpen(!isAdminToolsOpen)}
                      className="w-full flex items-center justify-between px-2 group"
                    >
                      <h4 className="text-[9px] font-black text-primary tracking-[0.2em] uppercase">
                        {t("chat.admin_tools")}
                      </h4>
                      <span
                        className={`material-symbols-outlined text-sm text-primary transition-transform duration-300 ${isAdminToolsOpen ? "rotate-180" : ""}`}
                      >
                        expand_more
                      </span>
                    </button>

                    {isAdminToolsOpen && (
                      <div className="space-y-1 animate-in slide-in-from-top-1 px-1">
                        {/* Edit Group Info */}
                        <div className="p-3 bg-white/40 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              {t("contact_info.group_identity")}
                            </span>
                            <button
                              onClick={async () => {
                                if (isEditingGroup) {
                                  try {
                                    if (conversation) {
                                      const updated =
                                        await conversationApi.updateGroupInfo(
                                          conversation.id,
                                          {
                                            groupName,
                                            description: groupDescription,
                                          },
                                        );
                                      onConversationUpdate?.(updated);
                                      toast.success(
                                        t("toast.update_group_success"),
                                      );
                                    }
                                  } catch (error) {
                                    toast.error("Failed to update group info");
                                  }
                                }
                                setIsEditingGroup(!isEditingGroup);
                              }}
                              className="text-[10px] font-bold text-primary hover:underline"
                            >
                              {isEditingGroup
                                ? t("common.save")
                                : t("common.edit")}
                            </button>
                          </div>

                          {isEditingGroup ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary placeholder:text-slate-400 dark:text-white font-medium shadow-sm transition-all"
                                placeholder="Group Name"
                              />
                              <textarea
                                value={groupDescription}
                                onChange={(e) =>
                                  setGroupDescription(e.target.value)
                                }
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary min-h-[60px] placeholder:text-slate-400 dark:text-white font-medium shadow-sm transition-all"
                                placeholder="Group Description..."
                              />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {groupName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {groupDescription ||
                                  "No description set (tap Edit to add one)."}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Global Permissions */}
                        <div className="p-3 bg-white/40 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-3">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            {t("contact_info.global_restrictions")}
                          </span>

                          <div className="pt-2">
                            <SlowModeSelector
                              value={conversation?.slowMode || 0}
                              onChange={async (val) => {
                                if (conversation) {
                                  try {
                                    const updated =
                                      await conversationApi.updateGroupInfo(
                                        conversation.id,
                                        { slowMode: val },
                                      );
                                    onConversationUpdate?.(updated);
                                    toast.success(
                                      t("toast.update_slow_mode_success", {
                                        val: val,
                                      }),
                                    );
                                  } catch (error) {
                                    toast.error("Failed to update slow mode");
                                  }
                                }
                              }}
                            />
                          </div>

                          {/* Removed redundant Admin Only switches as they were not connected to backend */}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Media Tab
            <div className="flex flex-col h-full overflow-hidden animate-fade-in">
              <ConversationMedia conversationId={conversation?.id || 0} />
            </div>
          )}
        </div>
      </aside>
      {/* Notifications Modal */}
      <Modal
        title="Cài đặt thông báo"
        open={notificationModalOpen}
        onOk={handleNotificationSave}
        onCancel={() => setNotificationModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <p className="font-medium text-black dark:text-white">Âm thanh</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Phát âm thanh khi có tin nhắn mới
              </p>
            </div>
            <Switch
              checked={notificationSettings.sound}
              onChange={(checked) =>
                setNotificationSettings({
                  ...notificationSettings,
                  sound: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <p className="font-medium text-black dark:text-white">
                Xem trước nội dung
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hiển thị nội dung tin nhắn trong thông báo
              </p>
            </div>
            <Switch
              checked={notificationSettings.preview}
              onChange={(checked) =>
                setNotificationSettings({
                  ...notificationSettings,
                  preview: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <p className="font-medium text-black dark:text-white">
                Tắt tiếng
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tạm dừng thông báo từ cuộc trò chuyện này
              </p>
            </div>
            <Switch
              checked={notificationSettings.mute}
              onChange={(checked) =>
                setNotificationSettings({
                  ...notificationSettings,
                  mute: checked,
                })
              }
            />
          </div>

          {notificationSettings.mute && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tắt tiếng cho đến
              </p>
              <select
                value={notificationSettings.muteUntil}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    muteUntil: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white"
              >
                <option value="1hour">1 giờ</option>
                <option value="8hour">8 giờ</option>
                <option value="1day">1 ngày</option>
                <option value="never">Vĩnh viễn</option>
              </select>
            </div>
          )}
        </div>
      </Modal>
      {/* Theme Modal */}
      <Modal
        title="Chọn chủ đề cuộc trò chuyện"
        open={themeModalOpen}
        onOk={handleThemeSave}
        onCancel={() => setThemeModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <div className="space-y-3">
          <div
            onClick={() => setSelectedTheme("default")}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedTheme === "default"
                ? "border-primary bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-gradient-to-br from-blue-500 to-blue-600" />
              <div>
                <p className="font-medium text-black dark:text-white">
                  Mặc định
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sử dụng hình nền chung
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedTheme("dark")}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedTheme === "dark"
                ? "border-primary bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-gradient-to-br from-gray-800 to-gray-900" />
              <div>
                <p className="font-medium text-black dark:text-white">Tối</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tối để bảo vệ mắt
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedTheme("light")}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedTheme === "light"
                ? "border-primary bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-gradient-to-br from-gray-100 to-gray-200" />
              <div>
                <p className="font-medium text-black dark:text-white">Sáng</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sáng để dễ đọc
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedTheme("custom")}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedTheme === "custom"
                ? "border-primary bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" />
              <div>
                <p className="font-medium text-black dark:text-white">
                  Tuỳ chỉnh
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Màu sắc cá nhân
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportedUser={
          otherMember
            ? { id: otherMember.id, displayName: otherMember.displayName }
            : undefined
        }
        conversationId={conversation?.id}
      />
    </>
  );
};

export default ContactInfoSidebar;
