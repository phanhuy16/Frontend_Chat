import React from "react";
import { Message } from "../../types/message.types";
import { MessageType } from "../../types";
import { getAvatarUrl } from "../../utils/helpers";
import { formatTime } from "../../utils/formatters";

interface ChatSearchPanelProps {
  searchQuery: string;
  handleSearch: (query: string) => void;
  isSearchLoading: boolean;
  searchResults: Message[];
  setIsSearching: (isSearching: boolean) => void;
  currentResultIndex: number;
  setCurrentResultIndex: (index: number) => void;
  scrollToMessage: (messageId: number) => void;
}

const ChatSearchPanel: React.FC<ChatSearchPanelProps> = ({
  searchQuery,
  handleSearch,
  isSearchLoading,
  searchResults,
  setIsSearching,
  currentResultIndex,
  setCurrentResultIndex,
  scrollToMessage,
}) => {
  const handleNavigate = (direction: "prev" | "next") => {
    const newIndex =
      direction === "prev"
        ? Math.max(0, currentResultIndex - 1)
        : Math.min(searchResults.length - 1, currentResultIndex + 1);
    setCurrentResultIndex(newIndex);
    if (searchResults[newIndex]) {
      scrollToMessage(searchResults[newIndex].id);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          className="bg-yellow-200 dark:bg-yellow-600/40 px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="absolute top-[64px] left-0 right-0 z-40 px-6 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5 animate-slide-up">
      <div className="relative max-w-2xl mx-auto">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">
          search
        </span>
        <input
          type="text"
          placeholder="Tìm kiếm tin nhắn..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          autoFocus
          className="w-full pl-10 pr-10 py-2 bg-slate-100 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/50 transition-all text-xs"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-xs">cancel</span>
          </button>
        )}
      </div>

      {/* Result counter and navigation */}
      {searchQuery.trim() && searchResults.length > 0 && !isSearchLoading && (
        <div className="max-w-2xl mx-auto mt-3 flex items-center justify-between px-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {currentResultIndex + 1} / {searchResults.length} kết quả
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => handleNavigate("prev")}
              disabled={currentResultIndex === 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined text-sm">
                keyboard_arrow_up
              </span>
            </button>
            <button
              onClick={() => handleNavigate("next")}
              disabled={currentResultIndex === searchResults.length - 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined text-sm">
                keyboard_arrow_down
              </span>
            </button>
          </div>
        </div>
      )}

      {searchQuery.trim() && (
        <div className="max-w-2xl mx-auto mt-4 max-h-[400px] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2">
          {isSearchLoading ? (
            <div className="py-8 text-center text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              Đang tìm kiếm...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => {
                    const index = searchResults.findIndex(
                      (m) => m.id === msg.id
                    );
                    setCurrentResultIndex(index);
                    scrollToMessage(msg.id);
                  }}
                  className={`w-full flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors text-left group ${
                    searchResults[currentResultIndex]?.id === msg.id
                      ? "bg-primary/10 dark:bg-primary/20 border-l-4 border-primary"
                      : ""
                  }`}
                >
                  <img
                    src={getAvatarUrl(msg.sender?.avatar)}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-bold text-sm truncate">
                        {msg.sender?.displayName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 break-words">
                      {msg.messageType === MessageType.Voice
                        ? "Tin nhắn thoại"
                        : highlightText(msg.content || "", searchQuery)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm italic">
              Không tìm thấy tin nhắn nào khớp với "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatSearchPanel;
