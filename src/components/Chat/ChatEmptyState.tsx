import React from "react";

interface ChatEmptyStateProps {
  onStartNewChat?: () => void;
}

const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ onStartNewChat }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div className="relative mb-10 group">
        <div className="absolute -inset-6 bg-primary/10 rounded-full blur-[60px] group-hover:bg-primary/20 transition-all duration-700" />
        <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-[2.5rem] bg-slate-100/50 dark:bg-white/[0.03] backdrop-blur-md flex items-center justify-center shadow-premium border border-white/20 dark:border-white/5 transition-all duration-500 group-hover:scale-105 group-hover:rotate-1">
          <span className="material-symbols-outlined text-[48px] lg:text-[64px] text-slate-400 dark:text-slate-500 font-light">
            chat_bubble
          </span>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Your conversations live here
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-base lg:text-lg font-medium leading-relaxed max-w-[320px] mx-auto">
          Select a chat to see the conversation or start a new one with your
          friends and colleagues.
        </p>
      </div>

      <button
        onClick={onStartNewChat}
        className="mt-12 px-8 h-12 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-300 flex items-center gap-4 group"
      >
        <span className="material-symbols-outlined font-bold group-hover:rotate-12 transition-transform">
          add
        </span>
        Start a New Chat
      </button>
    </div>
  );
};

export default ChatEmptyState;
