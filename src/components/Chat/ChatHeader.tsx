import React, { useState, useRef, useEffect } from "react";
import {
  Conversation,
  StatusUser,
  CallType,
  ConversationType,
  Message,
} from "../../types";
import { getAvatarUrl, formatLastActive } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import { exportToPDF, exportToText } from "../../services/ExportService";
import { useTranslation } from "react-i18next";

interface ChatHeaderProps {
  conversation: Conversation;
  isBlocked: boolean;
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
  setShowGroupMembers: (show: boolean) => void;
  setShowContactSidebar: (show: boolean) => void;
  showContactSidebar: boolean;
  onStartVideoCall: () => void;
  onStartAudioCall: () => void;
  messages: Message[];
  onBack?: () => void;
  onToggleSidebar?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  isBlocked,
  isSearching,
  setIsSearching,
  setShowGroupMembers,
  setShowContactSidebar,
  showContactSidebar,
  onStartVideoCall,
  onStartAudioCall,
  messages,
  onBack,
  onToggleSidebar,
}) => {
  const { user } = useAuth();
  const { typingUsersByConversation } = useChat();
  const { t } = useTranslation();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showExportMenu &&
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node) &&
        exportButtonRef.current &&
        !exportButtonRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportMenu]);

  const typingUsers =
    typingUsersByConversation[conversation.id] || new Set<number>();

  const getOtherMember = () => {
    if (conversation.conversationType === ConversationType.Direct) {
      return conversation.members.find((m) => m.id !== user?.id);
    }
    return null;
  };

  const getHeaderTitle = (): string => {
    if (conversation.conversationType === ConversationType.Direct) {
      const otherMember = getOtherMember();
      return otherMember?.displayName || "Direct Chat";
    }
    return conversation.groupName || "Group Chat";
  };

  const getHeaderSubtitle = (): string => {
    if (conversation.conversationType === ConversationType.Direct) {
      const otherMember = getOtherMember();

      // If other member is typing, show that
      if (otherMember && typingUsers.has(otherMember.id)) {
        return "typing...";
      }

      if (otherMember?.status === StatusUser.Online) {
        return "Online";
      }
      return formatLastActive(otherMember?.lastActiveAt, t);
    }

    // For groups, show who is typing
    if (typingUsers.size > 0) {
      const typingMembers = conversation.members
        .filter((m) => typingUsers.has(m.id) && m.id !== user?.id)
        .map((m) => m.displayName.split(" ")[0]); // Use first names

      if (typingMembers.length === 1) {
        return `${typingMembers[0]} is typing...`;
      }
      if (typingMembers.length > 1) {
        return `${typingMembers.length} people are typing...`;
      }
    }

    return `${conversation.members.length} members`;
  };

  return (
    <header className="flex items-center justify-between gap-4 px-4 py-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shrink-0 z-20">
      <div className="flex items-center gap-2 md:gap-4">
        {/* Back Button (Mobile) */}
        <button
          onClick={onBack}
          className="flex md:hidden items-center justify-center w-8 h-8 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined !text-[24px]">
            arrow_back
          </span>
        </button>

        {/* Toggle Sidebar (Tablet) */}
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex lg:hidden items-center justify-center w-8 h-8 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined !text-[24px]">menu</span>
        </button>

        <div
          className="relative group cursor-pointer flex items-center gap-3"
          onClick={() => setShowContactSidebar(true)}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-secondary rounded-full blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
          {conversation.conversationType === ConversationType.Group ? (
            <div className="relative bg-gradient-to-br from-primary to-primary-dark aspect-square rounded-full size-8 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[20px]">
                group
              </span>
            </div>
          ) : (
            <div
              className="relative bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 border-2 border-white/20 shadow-lg"
              style={{
                backgroundImage: `url("${getAvatarUrl(
                  getOtherMember()?.avatar,
                )}")`,
              }}
            />
          )}
        </div>
        <div className="flex flex-col">
          <h2 className="text-slate-900 dark:text-white text-base font-extrabold leading-tight">
            {getHeaderTitle()}
          </h2>
          <div className="flex items-center gap-1.5">
            {conversation.conversationType === ConversationType.Direct &&
            getOtherMember()?.status === StatusUser.Online ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : null}
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
              {getHeaderSubtitle()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex items-center bg-slate-100/50 dark:bg-white/5 p-1.5 rounded-full border border-slate-200/50 dark:border-white/5 gap-1">
          {conversation.conversationType === ConversationType.Group && (
            <button
              onClick={() => setShowGroupMembers(true)}
              className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all duration-200"
              title="Members"
            >
              <span className="material-symbols-outlined !text-[18px]">
                group
              </span>
            </button>
          )}
          <button
            onClick={() => setIsSearching(!isSearching)}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
              isSearching
                ? "text-primary bg-white dark:bg-slate-800 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800"
            }`}
            title="Search Messages"
          >
            <span className="material-symbols-outlined !text-[18px]">
              search
            </span>
          </button>
          <button
            onClick={onStartVideoCall}
            disabled={isBlocked}
            className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all duration-200 disabled:opacity-30"
            title="Video Call"
          >
            <span className="material-symbols-outlined !text-[18px]">
              videocam
            </span>
          </button>
          <button
            onClick={onStartAudioCall}
            disabled={isBlocked}
            className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all duration-200 disabled:opacity-30"
            title="Audio Call"
          >
            <span className="material-symbols-outlined !text-[18px]">call</span>
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Export Menu */}
          <div className="relative">
            <button
              ref={exportButtonRef}
              onClick={() => setShowExportMenu(!showExportMenu)}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
                showExportMenu
                  ? "text-primary bg-white dark:bg-slate-800 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800"
              }`}
              title="Export Chat"
            >
              <span className="material-symbols-outlined !text-[18px]">
                ios_share
              </span>
            </button>

            {showExportMenu && (
              <div
                ref={exportMenuRef}
                className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 py-2 animate-slide-up"
              >
                <button
                  onClick={() => {
                    exportToPDF(messages, getHeaderTitle());
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors text-slate-700 dark:text-slate-300 font-bold"
                >
                  <span className="material-symbols-outlined text-red-500">
                    picture_as_pdf
                  </span>
                  <span className="text-sm">Export to PDF</span>
                </button>
                <button
                  onClick={() => {
                    exportToText(messages, getHeaderTitle());
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors text-slate-700 dark:text-slate-300 font-bold"
                >
                  <span className="material-symbols-outlined text-blue-500">
                    description
                  </span>
                  <span className="text-sm">Export to Text</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowContactSidebar(!showContactSidebar)}
            className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all duration-200"
            title="Info"
          >
            <span className="material-symbols-outlined !text-[18px]">info</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
