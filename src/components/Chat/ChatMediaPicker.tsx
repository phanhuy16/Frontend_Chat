import React, { useState, useRef, useEffect } from "react";
import { EmojiPicker } from "./EmojiPicker";
import GiphyPicker from "./GiphyPicker";

interface ChatMediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (gif: any) => void;
}

const ChatMediaPicker: React.FC<ChatMediaPickerProps> = ({
  isOpen,
  onClose,
  onEmojiSelect,
  onGifSelect,
}) => {
  const [activeTab, setActiveTab] = useState<"emoji" | "giphy">("emoji");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-10 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-2xl z-50 w-[300px] h-[320px] overflow-hidden flex flex-col animate-slide-up"
    >
      {/* Tabs */}
      <div className="flex p-1 gap-1 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
        <button
          onClick={() => setActiveTab("emoji")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 ${
            activeTab === "emoji"
              ? "bg-white dark:bg-slate-800 text-primary shadow-sm shadow-primary/5 ring-1 ring-black/5 dark:ring-white/5"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/30"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            sentiment_satisfied
          </span>
          Emoji
        </button>
        <button
          onClick={() => setActiveTab("giphy")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 ${
            activeTab === "giphy"
              ? "bg-white dark:bg-slate-800 text-primary shadow-sm shadow-primary/5 ring-1 ring-black/5 dark:ring-white/5"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/30"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">gif</span>
          Giphy
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "emoji" ? (
          <EmojiPicker
            isOpen={true}
            onClose={onClose}
            onEmojiSelect={onEmojiSelect}
          />
        ) : (
          <GiphyPicker onGifSelect={onGifSelect} onClose={onClose} />
        )}
      </div>
    </div>
  );
};

export default ChatMediaPicker;
