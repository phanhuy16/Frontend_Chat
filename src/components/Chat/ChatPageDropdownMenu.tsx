import React from "react";

interface ChatPageDropdownMenuProps {
  isOpen: boolean;
  pendingRequestCount: number;
  onMenuClick: (action: string) => void;
}

const ChatPageDropdownMenu: React.FC<ChatPageDropdownMenuProps> = ({
  isOpen,
  pendingRequestCount,
  onMenuClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-50">
      {/* Friends List */}
      <button
        onClick={() => onMenuClick("friends")}
        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors first:rounded-t-lg"
      >
        <span className="material-symbols-outlined text-lg">people</span>
        <div className="flex-1">
          <p className="font-medium text-sm">Friends</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            View your friends
          </p>
        </div>
      </button>

      {/* Friend Requests */}
      <button
        onClick={() => onMenuClick("requests")}
        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border-t border-gray-200 dark:border-gray-700 relative"
      >
        <span className="material-symbols-outlined text-lg">person_add</span>
        <div className="flex-1">
          <p className="font-medium text-sm">Friend Requests</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Manage requests
          </p>
        </div>
        {pendingRequestCount > 0 && (
          <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
            {pendingRequestCount > 9 ? "9+" : pendingRequestCount}
          </span>
        )}
      </button>

      {/* New Chat */}
      <button
        onClick={() => onMenuClick("new-chat")}
        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border-t border-gray-200 dark:border-gray-700"
      >
        <span className="material-symbols-outlined text-lg">add_circle</span>
        <div className="flex-1">
          <p className="font-medium text-sm">New Chat</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Start a conversation
          </p>
        </div>
      </button>

      {/* Create Group */}
      <button
        onClick={() => onMenuClick("create-group")}
        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border-t border-gray-200 dark:border-gray-700"
      >
        <span className="material-symbols-outlined text-lg">group_add</span>
        <div className="flex-1">
          <p className="font-medium text-sm">New Group</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Start a conversation
          </p>
        </div>
      </button>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

      {/* Settings */}
      <button
        onClick={() => onMenuClick("settings")}
        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors last:rounded-b-lg"
      >
        <span className="material-symbols-outlined text-lg">settings</span>
        <div className="flex-1">
          <p className="font-medium text-sm">Settings</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Profile & preferences
          </p>
        </div>
      </button>
    </div>
  );
};

export default ChatPageDropdownMenu;
