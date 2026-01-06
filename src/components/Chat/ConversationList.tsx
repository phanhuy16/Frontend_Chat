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
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversation,
  onSelectConversation,
  user,
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
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className={`flex items-center gap-4 px-4 min-h-[72px] py-2 justify-between cursor-pointer transition-colors ${
              currentConversation?.id === conversation.id
                ? "bg-primary/20 dark:bg-primary/20"
                : "hover:bg-gray-100 dark:hover:bg-white/5"
            }`}
          >
            {/* Avatar Container */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12"
                  style={{
                    backgroundImage: `url("${getConversationAvatar(
                      conversation
                    )}")`,
                  }}
                />
                {isUserOnline(conversation) && (
                  <div className="absolute bottom-0 right-0 size-3 rounded-full bg-[#0bda5b] border-2 border-white dark:border-[#111418]" />
                )}
              </div>

              {/* Conversation Info */}
              <div className="flex flex-col justify-center min-w-0">
                <p className="text-black dark:text-white text-base font-medium leading-normal line-clamp-1">
                  {getConversationName(conversation)}
                </p>
                <p className="text-[#64748b] dark:text-[#9dabb9] text-sm font-normal leading-normal line-clamp-1">
                  {getConversationPreview(conversation)}
                </p>
              </div>
            </div>

            {/* Time & Badge */}
            <div className="shrink-0 flex flex-col items-end gap-1">
              <p className="text-[#64748b] dark:text-[#9dabb9] text-xs font-normal leading-normal">
                {formatDate(
                  conversation.messages[0]?.createdAt || conversation.createdAt
                )}
              </p>
              {/* Unread badge (if needed) */}
              {Math.random() > 0.7 && (
                <div className="flex size-5 items-center justify-center rounded-full bg-primary text-white">
                  <p className="text-white text-xs font-bold">1</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationList;
