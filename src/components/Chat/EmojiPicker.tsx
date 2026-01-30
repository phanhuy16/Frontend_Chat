// components/Chat/EmojiPicker.tsx
import React, { useState, useRef, useEffect } from "react";

const EMOJI_CATEGORIES = {
  smileys: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "🙃",
    "😉",
    "😊",
    "😇",
  ],
  hearts: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "💕",
    "💞",
    "💓",
  ],
  hands: [
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "👌",
    "🤌",
    "🤏",
    "✌️",
    "🤞",
    "🫰",
    "🤟",
    "🤘",
  ],
  gestures: [
    "👍",
    "👎",
    "👊",
    "✊",
    "👊",
    "🤛",
    "🤜",
    "👏",
    "🙌",
    "👐",
    "🤲",
    "🤝",
    "🙏",
  ],
  celebration: [
    "🎉",
    "🎊",
    "🎈",
    "🎁",
    "🏆",
    "🥇",
    "🥈",
    "🥉",
    "⭐",
    "✨",
    "🌟",
    "🎯",
    "🎪",
  ],
  activity: [
    "⚽",
    "🏀",
    "🏈",
    "⚾",
    "🥎",
    "🎾",
    "🏐",
    "🏉",
    "🥏",
    "🎳",
    "🏓",
    "🏸",
    "🏒",
  ],
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  isOpen,
  onClose,
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState("smileys");
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const emojis =
    EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES] || [];

  return (
    <div className="bg-transparent rounded-xl z-40 w-full h-full overflow-hidden flex flex-col">
      <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50">
        <input
          type="text"
          placeholder="Search emoji..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-1 px-3 py-2 border-b border-gray-200/50 dark:border-gray-700/50 overflow-x-auto scrollbar-hide">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setSearchTerm("");
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
              selectedCategory === category
                ? "bg-primary text-white shadow-sm shadow-primary/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Emojis Grid */}
      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-8 gap-1 content-start">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onEmojiSelect(emoji);
              onClose();
            }}
            className="text-xl hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-1 transition-colors hover:scale-110 aspect-square flex items-center justify-center"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200/50 dark:border-gray-700/50 text-[10px] text-slate-400 font-medium text-center">
        Click to insert
      </div>
    </div>
  );
};
