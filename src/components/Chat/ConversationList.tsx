// src/components/Chat/ConversationList.tsx
import React from "react";
import { Conversation } from "../../types/conversation.types";
import { ConversationType } from "../../types/enums";
import { User } from "../../types/user.types";
import { formatDate } from "../../utils/formatters";
import { getAvatarUrl } from "../../utils/helpers";

interface ConversationListProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  user: User;
  unreadCounts?: { [key: number]: number };
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversation,
  onSelectConversation,
  user,
  unreadCounts = {},
}) => {
  const getConversationName = (conversation: Conversation): string => {
    if (conversation.conversationType === ConversationType.Direct) {
      const otherMember = conversation.members.find((m) => m.id !== user.id);
      return otherMember?.displayName || "Unknown";
    }
    return conversation.groupName || "Unnamed Group";
  };

  const getConversationPreview = (conversation: Conversation): string => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return "Chưa có tin nhắn";
    }

    const lastMessage = conversation.messages[0];
    if (!lastMessage || !lastMessage.content) {
      return "Chưa có tin nhắn";
    }

    const senderName =
      lastMessage.senderId === user.id
        ? "Bạn"
        : lastMessage.sender?.displayName || "Người dùng";

    const preview = lastMessage.content.substring(0, 40);
    const suffix = lastMessage.content.length > 40 ? "..." : "";

    return `${senderName}: ${preview}${suffix}`;
  };

  const getConversationAvatar = (conversation: Conversation): string => {
    if (conversation.conversationType === ConversationType.Direct) {
      const otherMember = conversation.members.find((m) => m.id !== user.id);
      return getAvatarUrl(otherMember?.avatar);
    }
    return "";
  };

  const isUserOnline = (conversation: Conversation): boolean => {
    if (conversation.conversationType === ConversationType.Direct) {
      const otherMember = conversation.members.find((m) => m.id !== user.id);
      return otherMember?.status === 1;
    }
    return false;
  };

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center px-4">
        <div>
          <p className="text-gray-500 dark:text-gray-400">
            No conversations yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Start a new chat to begin messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-1">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onSelectConversation(conversation)}
          className={`group flex items-center gap-4 px-4 min-h-[64px] py-2.5 rounded-2xl cursor-pointer transition-all duration-300 ${
            currentConversation?.id === conversation.id
              ? "bg-primary text-white shadow-lg shadow-primary/30"
              : "hover:bg-slate-100 dark:hover:bg-white/5"
          }`}
        >
          {/* Avatar Container */}
          <div className="relative shrink-0">
            <div className="relative">
              <div
                className={`absolute -inset-0.5 rounded-full blur opacity-50 transition duration-300 ${
                  currentConversation?.id === conversation.id
                    ? "bg-white/50"
                    : "bg-primary opacity-0 group-hover:opacity-30"
                }`}
              />
              <div
                className="relative bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-white/10"
                style={{
                  backgroundImage: `url("${getConversationAvatar(
                    conversation
                  )}")`,
                }}
              />
            </div>
            {isUserOnline(conversation) && (
              <div className="absolute bottom-0 right-0 size-3.5 rounded-full bg-[#0bda5b] border-2 border-white dark:border-[#111418] shadow-sm" />
            )}
          </div>

          {/* Conversation Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <h4
                className={`text-sm font-bold truncate ${
                  currentConversation?.id === conversation.id
                    ? "text-white"
                    : "text-slate-900 dark:text-white"
                }`}
              >
                {getConversationName(conversation)}
              </h4>
              <span
                className={`text-[10px] font-medium shrink-0 ml-2 ${
                  currentConversation?.id === conversation.id
                    ? "text-white/70"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {formatDate(
                  conversation.messages[0]?.createdAt || conversation.createdAt
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p
                className={`text-xs truncate ${
                  currentConversation?.id === conversation.id
                    ? "text-white/80"
                    : (unreadCounts[conversation.id] || 0) > 0
                    ? "text-slate-900 dark:text-white font-bold"
                    : "text-slate-500 dark:text-slate-400 font-medium"
                }`}
              >
                {getConversationPreview(conversation)}
              </p>
              {/* Unread badge */}
              {(unreadCounts[conversation.id] || 0) > 0 && (
                <div
                  className={`flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full text-[10px] font-bold shrink-0 ml-2 ${
                    currentConversation?.id === conversation.id
                      ? "bg-white text-primary shadow-sm"
                      : "bg-primary text-white"
                  }`}
                >
                  {unreadCounts[conversation.id] > 9
                    ? "9+"
                    : unreadCounts[conversation.id]}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
