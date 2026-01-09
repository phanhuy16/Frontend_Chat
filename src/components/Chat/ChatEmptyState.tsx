import React from "react";

interface ChatEmptyStateProps {
  onStartNewChat?: () => void;
}

const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ onStartNewChat }) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white dark:bg-[#111418] p-8 text-center">
      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 mb-6">
        <span className="material-symbols-outlined !text-6xl text-primary">
          chat_bubble
        </span>
      </div>
      <h3 className="text-xl font-bold text-black dark:text-white">
        Your conversations live here
      </h3>
      <p className="mt-2 max-w-sm text-gray-600 dark:text-gray-400">
        Select a chat to see the conversation or start a new one with your
        friends and colleagues.
      </p>
      {onStartNewChat && (
        <button
          onClick={onStartNewChat}
          className="mt-6 flex h-10 min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary px-5 text-white font-display text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined !text-xl">add</span>
          <span className="truncate">Start a New Chat</span>
        </button>
      )}
    </div>
  );
};

export default ChatEmptyState;
