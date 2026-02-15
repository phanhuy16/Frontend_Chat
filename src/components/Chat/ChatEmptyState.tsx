import React from "react";
import { useTranslation } from "react-i18next";

interface ChatEmptyStateProps {
  onStartNewChat?: () => void;
}

const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ onStartNewChat }) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="relative mb-8 group">
        <div className="absolute -inset-4 bg-primary/10 rounded-full blur-[40px] group-hover:bg-primary/20 transition-all duration-700" />
        <div className="relative size-20 lg:size-24 rounded-[1.5rem] bg-slate-100/50 dark:bg-white/[0.03] backdrop-blur-md flex items-center justify-center shadow-premium border border-white/20 dark:border-white/5 transition-all duration-500 group-hover:scale-105 group-hover:rotate-1">
          <span className="material-symbols-outlined text-[40px] lg:text-[48px] text-slate-400 dark:text-slate-500 font-light">
            chat_bubble
          </span>
        </div>
      </div>

      <div className="max-w-md space-y-3">
        <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          {t("empty_state.title")}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-base font-medium leading-relaxed max-w-[280px] mx-auto">
          {t("empty_state.desc")}
        </p>
      </div>

      <button
        onClick={onStartNewChat}
        className="mt-10 px-6 h-10 bg-primary hover:bg-primary-hover text-white rounded-xl font-black uppercase tracking-[0.15em] text-[11px] shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 flex items-center gap-3 group"
      >
        <span className="material-symbols-outlined text-[18px] font-bold group-hover:rotate-12 transition-transform">
          add
        </span>
        {t("empty_state.btn_start")}
      </button>
    </div>
  );
};

export default ChatEmptyState;
