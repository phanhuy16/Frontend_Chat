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

  const emojis =
    EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES] || [];

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-40 w-80 max-h-96 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <input
          type="text"
          placeholder="Search emoji..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-1 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-x-auto">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setSearchTerm("");
            }}
            className={`px-2 py-1 rounded text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategory === category
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300"
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Emojis Grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-6 gap-2">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onEmojiSelect(emoji);
              onClose();
            }}
            className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors hover:scale-110"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500">
        Click emoji to add reaction
      </div>
    </div>
  );
};
