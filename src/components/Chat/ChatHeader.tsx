import React from "react";
import { Conversation, StatusUser, CallType, ConversationType } from "../../types";
import { getAvatarUrl, formatLastActive } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";

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
  const { user } = useAuth();
  const { typingUsersByConversation } = useChat();

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
      return formatLastActive(otherMember?.lastActiveAt);
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
      <div className="flex items-center gap-4">
        <div
          className="relative group cursor-pointer"
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
