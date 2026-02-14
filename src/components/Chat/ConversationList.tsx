// src/components/Chat/ConversationList.tsx
import React, { useState, useEffect, useRef } from "react";
import { Conversation } from "../../types/conversation.types";
import { ConversationType } from "../../types/enums";
import { User } from "../../types/user.types";
import { formatDate } from "../../utils/formatters";
import { getAvatarUrl } from "../../utils/helpers";
import { useChat } from "../../hooks/useChat";
import { MessageType } from "../../types/enums";
import { useTranslation } from "react-i18next";

interface ConversationListProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onTogglePin?: (conversation: Conversation) => void;
  onToggleArchive?: (conversation: Conversation) => void;
  onDeleteConversation?: (conversation: Conversation) => void;
  user: User;
  unreadCounts?: { [key: number]: number };
  drafts: { [key: number]: string };
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversation,
  onSelectConversation,
  onTogglePin,
  onToggleArchive,
  onDeleteConversation,
  user,
  unreadCounts = {},
  drafts,
}) => {
  const { typingUsersByConversation } = useChat();
  const { t } = useTranslation();
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeMenuId !== null &&
        !(event.target as Element).closest(".conversation-menu-container")
      ) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuId]);

  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    const timeA = new Date(
      a.lastMessage?.createdAt || a.messages[0]?.createdAt || a.createdAt,
    ).getTime();
    const timeB = new Date(
      b.lastMessage?.createdAt || b.messages[0]?.createdAt || b.createdAt,
    ).getTime();
    return timeB - timeA;
  });
  const getConversationName = (conversation: Conversation): string => {
    if (conversation.conversationType === ConversationType.Direct) {
      const otherMember = conversation.members.find((m) => m.id !== user.id);
      return otherMember?.displayName || t("chat_list.user_deleted");
    }
    return conversation.groupName || t("group_members.no_name");
  };

  const getConversationPreview = (
    conversation: Conversation,
  ): string | React.ReactNode => {
    const draft = drafts[conversation.id];
    if (draft && draft.trim()) {
      return (
        <span className="flex items-center gap-1">
          <span className="text-red-500 font-black uppercase text-[9px] px-1 bg-red-500/10 rounded tracking-tighter">
            {t("chat_list.draft")}
          </span>
          <span className="truncate">{draft}</span>
        </span>
      );
    }

    const lastMessage = conversation.lastMessage || conversation.messages[0];
    if (!lastMessage) {
      return t("chat_list.no_conversations");
    }

    if (lastMessage.isDeleted || lastMessage.isDeletedForMe) {
      return (
        <span className="italic opacity-70">
          {lastMessage.isDeletedForMe
            ? t("chat_list.msg_deleted_me")
            : lastMessage.senderId === user.id
              ? t("chat_list.msg_deleted_me")
              : t("chat_list.msg_deleted")}
        </span>
      );
    }

    if (!lastMessage.content) {
      return t("chat_list.no_conversations");
    }

    const senderName =
      lastMessage.senderId === user.id
        ? t("chat_list.you")
        : lastMessage.sender?.displayName || t("chat_list.user_deleted");

    const preview = lastMessage.content.substring(0, 40);
    const suffix = lastMessage.content.length > 40 ? "..." : "";

    return `${senderName}: ${preview}${suffix}`;
  };

  const getConversationAvatar = (conversation: Conversation): string => {
    if (conversation.conversationType === ConversationType.Direct) {
      const otherMember = conversation.members.find((m) => m.id !== user.id);
      return getAvatarUrl(otherMember?.avatar || "") || "";
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
            {t("chat_list.no_conversations")}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            {t("chat_list.start_new")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-1">
      {sortedConversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onSelectConversation(conversation)}
          className={`group flex items-center gap-4 px-4 min-h-[64px] py-2.5 rounded-2xl cursor-pointer transition-all duration-300 relative ${
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
                    conversation,
                  )}")`,
                }}
              />
            </div>
            {isUserOnline(conversation) && (
              <div className="absolute bottom-0 right-0 size-3.5 rounded-full bg-[#0bda5b] border-2 border-white dark:border-[#111418] shadow-sm" />
            )}

            {/* Pin Badge */}
            {conversation.isPinned && (
              <div className="absolute -top-1 -left-1 bg-primary text-white size-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#111418] shadow-sm">
                <span className="material-symbols-outlined text-[12px] font-bold">
                  push_pin
                </span>
              </div>
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
                className={`text-[10px] font-medium shrink-0 ml-2 transition-opacity duration-200 ${
                  activeMenuId === conversation.id
                    ? "opacity-0"
                    : "group-hover:opacity-0"
                } ${
                  currentConversation?.id === conversation.id
                    ? "text-white/70"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {formatDate(
                  conversation.lastMessage?.createdAt ||
                    conversation.messages[0]?.createdAt ||
                    conversation.createdAt,
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p
                className={`text-xs truncate transition-all duration-300 ${
                  currentConversation?.id === conversation.id
                    ? "text-white/80"
                    : (unreadCounts[conversation.id] || 0) > 0
                      ? "text-slate-900 dark:text-white font-bold"
                      : "text-slate-500 dark:text-slate-400 font-medium"
                }`}
              >
                {typingUsersByConversation[conversation.id]?.size > 0 ? (
                  <span className="flex items-center gap-1.5 text-primary dark:text-primary-light animate-pulse font-bold">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                    </span>
                    {t("chat_list.is_typing")}
                  </span>
                ) : (
                  getConversationPreview(conversation)
                )}
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

          {/* Menu Trigger Button */}
          <div
            className={`absolute right-2 top-2 z-10 conversation-menu-container ${
              activeMenuId === conversation.id
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            } transition-all duration-300`}
            onClick={(e) => e.stopPropagation()} // Prevent row click
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(
                  activeMenuId === conversation.id ? null : conversation.id,
                );
              }}
              className={`size-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                activeMenuId === conversation.id ||
                currentConversation?.id === conversation.id
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 dark:bg-slate-700 dark:text-white text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-600"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                more_horiz
              </span>
            </button>

            {/* Dropdown Menu */}
            {activeMenuId === conversation.id && (
              <div
                className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1 animate-fade-in z-50 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Pin Option */}
                {onTogglePin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(conversation);
                      setActiveMenuId(null);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        conversation.isPinned ? "font-fill" : ""
                      }`}
                    >
                      push_pin
                    </span>
                    {conversation.isPinned
                      ? t("chat_list.menu.unpin")
                      : t("chat_list.menu.pin")}
                  </button>
                )}

                {/* Archive Option */}
                {onToggleArchive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleArchive(conversation);
                      setActiveMenuId(null);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-3 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        conversation.isArchived ? "font-fill" : ""
                      }`}
                    >
                      archive
                    </span>
                    {conversation.isArchived
                      ? t("chat_list.menu.unarchive")
                      : t("chat_list.menu.archive")}
                  </button>
                )}

                {/* Delete Option (Visual/Prop) */}
                {onDeleteConversation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conversation);
                      setActiveMenuId(null);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      delete
                    </span>
                    {t("chat_list.menu.delete")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
