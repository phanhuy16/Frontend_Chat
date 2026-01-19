import React, { useEffect, useMemo } from "react";
import { Conversation } from "../../types/conversation.types";
import { ConversationType, StatusUser } from "../../types/enums";
import { getStatusUserColor } from "../../utils/enum-helpers";
import { useAuth } from "../../hooks/useAuth";
import { userApi } from "../../api/user.api";
import { REACT_APP_AVATAR_URL } from "../../utils/constants";
import { getAvatarUrl } from "../../utils/helpers";

interface ConversationItemProps {
  conversation: Conversation;
  onSelect: (conversation: Conversation) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onSelect,
}) => {
  const { user } = useAuth();

  // Memoize calculations to prevent re-renders
  const otherMember = useMemo(() => {
    if (conversation.conversationType === ConversationType.Direct) {
      const found = conversation.members.find((m) => m.id !== user?.id);

      return found;
    }
    return null;
  }, [conversation, user?.id]);

  const displayName = useMemo(() => {
    if (conversation.conversationType === ConversationType.Direct) {
      return otherMember?.displayName || "Direct Chat";
    }
    return conversation.groupName || "Group Chat";
  }, [conversation.conversationType, conversation.groupName, otherMember]);

  const status = useMemo(() => {
    if (conversation.conversationType === ConversationType.Direct) {
      return otherMember?.status || StatusUser.Offline;
    }
    return StatusUser.Offline;
  }, [conversation.conversationType, otherMember]);

  const onlineMembersCount = useMemo(() => {
    return conversation.members.filter((m) => m.status === StatusUser.Online)
      .length;
  }, [conversation.members]);

  const statusLabel = useMemo(() => {
    if (conversation.conversationType === ConversationType.Direct) {
      return status === StatusUser.Online ? "Online" : "Offline";
    }
    return `${conversation.members.length} members • ${onlineMembersCount} online`;
  }, [
    conversation.conversationType,
    status,
    conversation.members.length,
    onlineMembersCount,
  ]);

  const avatarUrl = useMemo(() => {
    if (conversation.conversationType === ConversationType.Direct) {
      return getAvatarUrl(otherMember?.avatar);
    }

    return "";
  }, [conversation.conversationType, otherMember]);

  return (
    <div
      className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
      onClick={() => onSelect(conversation)}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12"
            style={{ backgroundImage: `url("${avatarUrl}")` }}
          />
          {/* Status indicator for direct chat */}
          {conversation.conversationType === ConversationType.Direct && (
            <div
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-[#111418]"
              style={{
                backgroundColor: getStatusUserColor(status),
              }}
            />
          )}
        </div>

        {/* Conversation info */}
        <div className="flex-1 min-w-0">
          <p className="text-black dark:text-white font-medium text-sm truncate">
            {displayName}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
            {statusLabel}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
