import React from "react";
import { Conversation, FriendDto, StatusUser, User } from "../../types";
import { getStatusUserColor, getStatusUserLabel } from "../../utils/enum-helpers";

interface SearchResultData {
  conversations: Conversation[];
  friends: FriendDto[];
}

interface ChatPageSearchResultsProps {
  searchResults: SearchResultData;
  user: User;
  onSelectConversation: (conv: Conversation) => void;
  onSelectFriend: (friend: FriendDto) => void;
}

const ChatPageSearchResults: React.FC<ChatPageSearchResultsProps> = ({
  searchResults,
  user,
  onSelectConversation,
  onSelectFriend,
}) => {
  const hasNoResults =
    searchResults.conversations.length === 0 &&
    searchResults.friends.length === 0;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-40 max-h-96 overflow-y-auto">
      {/* Conversations Results */}
      {searchResults.conversations.length > 0 && (
        <>
          <div className="sticky top-0 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            Kết quả cuộc trò chuyện
          </div>
          {searchResults.conversations.map((conv) => {
            const otherMember =
              conv.conversationType === 1
                ? conv.members.find((m) => m.id !== user.id)
                : null;
            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
              >
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shrink-0"
                  style={{
                    backgroundImage: `url("${otherMember?.avatar || ""}")`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black dark:text-white truncate">
                    {otherMember?.displayName || conv.groupName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{otherMember?.userName}
                  </p>
                </div>
              </button>
            );
          })}
        </>
      )}

      {/* Friends Results */}
      {searchResults.friends.length > 0 && (
        <>
          <div className="sticky top-0 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            Friends
          </div>
          {searchResults.friends.map((friend) => (
            <button
              key={friend.id}
              onClick={() => onSelectFriend(friend)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
            >
              <div className="relative">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shrink-0"
                  style={{
                    backgroundImage: `url("${friend.avatar || ""}")`,
                  }}
                />
                <div
                  className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white dark:border-gray-900"
                  style={{
                    backgroundColor: getStatusUserColor(
                      friend.status as StatusUser
                    ),
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black dark:text-white truncate">
                  {friend.displayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {getStatusUserLabel(friend.status as StatusUser)}
                </p>
              </div>
            </button>
          ))}
        </>
      )}

      {/* No Results */}
      {hasNoResults && (
        <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
          <span className="material-symbols-outlined block text-3xl mb-2">
            search_off
          </span>
          <p className="text-sm">No results found</p>
        </div>
      )}
    </div>
  );
};

export default ChatPageSearchResults;
