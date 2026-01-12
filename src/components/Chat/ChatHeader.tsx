import React from "react";
import { Conversation, StatusUser, CallType, ConversationType } from "../../types";
import { getAvatarUrl, formatLastActive } from "../../utils/helpers";

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
}) => {
  const getOtherMember = () => {
    if (conversation.conversationType === ConversationType.Direct) {
      // Note: In a real app, 'user' info might be needed here or passed from parent
      // For now, assume it's filtered outside or we have enough info
      return conversation.members.find((m) => m.id !== (conversation as any).currentUserId); // Abstracted
    }
    return null;
  };

  const getHeaderTitle = (): string => {
    if (conversation.conversationType === ConversationType.Direct) {
      const otherMember = conversation.members.find(m => (conversation as any).currentUserId ? m.id !== (conversation as any).currentUserId : true); // Fallback
      return otherMember?.displayName || "Direct Chat";
    }
    return conversation.groupName || "Group Chat";
  };

  const getHeaderSubtitle = (): string => {
    if (conversation.conversationType === ConversationType.Direct) {
      const otherMember = conversation.members.find(m => (conversation as any).currentUserId ? m.id !== (conversation as any).currentUserId : true);
      if (otherMember?.status === StatusUser.Online) {
        return "Online";
      }
      return formatLastActive(otherMember?.lastActiveAt);
    }
    return `${conversation.members.length} members`;
  };

  return (
    <header className="flex items-center justify-between gap-4 px-8 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shrink-0 z-20">
      <div className="flex items-center gap-4">
        <div
          className="relative group cursor-pointer"
          onClick={() => setShowContactSidebar(true)}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-secondary rounded-full blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
          {conversation.conversationType === ConversationType.Group ? (
            <div className="relative bg-gradient-to-br from-primary to-primary-dark aspect-square rounded-full size-10 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[24px]">group</span>
            </div>
          ) : (
            <div
              className="relative bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-white/20 shadow-lg"
              style={{
                backgroundImage: `url("${getAvatarUrl(
                  conversation.conversationType === ConversationType.Direct 
                    ? conversation.members.find(m => true)?.avatar // Needs cleanup
                    : ""
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
              conversation.members.some(m => m.status === StatusUser.Online) && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
              {getHeaderSubtitle()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex items-center bg-slate-100/50 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/50 dark:border-white/5">
          {conversation.conversationType === ConversationType.Group && (
            <button
              onClick={() => setShowGroupMembers(true)}
              className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
              title="Members"
            >
              <span className="material-symbols-outlined !text-[20px]">group</span>
            </button>
          )}
          <button
            onClick={() => setIsSearching(!isSearching)}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200 ${
              isSearching
                ? "text-primary bg-white dark:bg-slate-800 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800"
            }`}
            title="Search Messages"
          >
            <span className="material-symbols-outlined !text-[20px]">search</span>
          </button>
          <button
            onClick={onStartVideoCall}
            disabled={isBlocked}
            className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all duration-200 disabled:opacity-30"
            title="Video Call"
          >
            <span className="material-symbols-outlined !text-[20px]">videocam</span>
          </button>
          <button
            onClick={onStartAudioCall}
            disabled={isBlocked}
            className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all duration-200 disabled:opacity-30"
            title="Audio Call"
          >
            <span className="material-symbols-outlined !text-[20px]">call</span>
          </button>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
          <button
            onClick={() => setShowContactSidebar(!showContactSidebar)}
            className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
            title="Info"
          >
            <span className="material-symbols-outlined !text-[20px]">info</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
