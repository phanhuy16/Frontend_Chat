import React from "react";
import { Message } from "../../types/message.types";
import { formatTime } from "../../utils/formatters";
import { getAvatarUrl } from "../../utils/helpers";

interface PinnedMessagesModalProps {
  pinnedMessages: Message[];
  onClose: () => void;
  onJumpToMessage: (messageId: number) => void;
  onUnpin: (messageId: number) => void;
}

const PinnedMessagesModal: React.FC<PinnedMessagesModalProps> = ({
  pinnedMessages,
  onClose,
  onJumpToMessage,
  onUnpin,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1e1e2d] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-zoom-in">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <span className="material-symbols-outlined font-fill">push_pin</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Pinned Messages
              </h3>
              <p className="text-xs text-slate-500 font-medium tracking-wide">
                {pinnedMessages.length} items pinned in this chat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {pinnedMessages.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
              <span className="material-symbols-outlined text-6xl opacity-20">push_pin</span>
              <p className="italic text-sm">No pinned messages yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pinnedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="group relative flex items-start gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-primary/20 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
                  onClick={() => onJumpToMessage(msg.id)}
                >
                  <img
                    src={getAvatarUrl(msg.sender?.avatar)}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {msg.sender?.displayName}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {msg.content || (msg.attachments?.length ? "Shared an attachment" : "Pinned item")}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnpin(msg.id);
                    }}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    title="Unpin"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Tip: Click on a message to jump to it in the chat
            </p>
        </div>
      </div>
    </div>
  );
};

export default PinnedMessagesModal;
