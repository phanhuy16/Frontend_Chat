import React, { useState } from "react";
import { Message } from "../../types/message.types";

interface PinnedHeaderProps {
  pinnedMessages: Message[];
  onJumpToMessage: (messageId: number) => void;
  onUnpin: (messageId: number) => void;
  onViewAll?: () => void;
}

const PinnedHeader: React.FC<PinnedHeaderProps> = ({
  pinnedMessages,
  onJumpToMessage,
  onUnpin,
  onViewAll,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (pinnedMessages.length === 0) return null;

  const currentMessage = pinnedMessages[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(
      (prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length,
    );
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 bg-white/50 dark:bg-slate-800/40 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/50 cursor-pointer hover:bg-white/80 dark:hover:bg-slate-800/60 transition-colors group animate-in slide-in-from-top duration-300"
      onClick={() => onJumpToMessage(currentMessage.id)}
    >
      <div className="flex-shrink-0 w-1 h-8 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm font-fill">
            push_pin
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-primary">
            Pinned Message{" "}
            {pinnedMessages.length > 1
              ? `(${currentIndex + 1}/${pinnedMessages.length})`
              : ""}
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">
          {currentMessage.content || "Attachment"}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {pinnedMessages.length > 1 && (
          <div className="flex items-center mr-2 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
            <button
              onClick={handlePrev}
              className="p-1 hover:bg-primary hover:text-white transition-colors text-slate-500 dark:text-slate-400"
            >
              <span className="material-symbols-outlined text-base">
                chevron_left
              </span>
            </button>
            <div className="w-px h-3 bg-slate-200 dark:bg-slate-600" />
            <button
              onClick={handleNext}
              className="p-1 hover:bg-primary hover:text-white transition-colors text-slate-500 dark:text-slate-400"
            >
              <span className="material-symbols-outlined text-base">
                chevron_right
              </span>
            </button>
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnpin(currentMessage.id);
          }}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
          title="Unpin"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
        {onViewAll && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewAll();
            }}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors"
            title="View all pinned messages"
          >
            <span className="material-symbols-outlined text-xl">
              visibility
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PinnedHeader;
