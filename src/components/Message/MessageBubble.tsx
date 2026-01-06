// src/components/Chat/MessageBubble.tsx
import React from "react";
import { Message } from "../../types/message.types";
import { formatTime } from "../../utils/formatters";
import { getAvatarUrl } from "../../utils/helpers";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReact?: (messageId: number, emoji: string) => void;
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  onReact,
}) => {
  const getFileUrl = (fileUrl: string) => {
    if (fileUrl.startsWith("http")) {
      return fileUrl;
    }
    const baseUrl = process.env.REACT_APP_API_URL?.replace("/api", "");
    return `${baseUrl}${fileUrl}`;
  };

  return (
    <div
      className={`group flex ${
        isOwn ? "justify-end" : "justify-start"
      } relative mb-2`}
    >
      <div
        className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
      >
        {/* Avatar for received messages */}
        {!isOwn && (
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 shrink-0 mb-1"
            style={{
              backgroundImage: `url("${getAvatarUrl(message.sender?.avatar)}")`,
            }}
          />
        )}

        {/* Message Bubble Container */}
        <div className="relative max-w-md group/bubble">
          {/* Reaction Button (Three dots) - Shows on hover */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 ${
              isOwn ? "right-full mr-2" : "left-full ml-2"
            } opacity-0 group-hover:opacity-100 transition-opacity z-10`}
          >
            <div className="relative group/reaction">
              <button className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700">
                <span className="material-symbols-outlined text-lg">
                  more_horiz
                </span>
              </button>

              {/* Reaction Picker Popup */}
              <div
                className={`absolute bottom-full ${
                  isOwn ? "right-0" : "left-0"
                } mb-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 flex gap-1 hidden group-hover/reaction:flex animate-fade-in`}
              >
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onReact?.(message.id, emoji)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-transform hover:scale-125 text-lg leading-none"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Message Content Bubble */}
          <div
            className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
          >
            {(message.content ||
              (!isOwn && message.sender) ||
              (message.reactions && message.reactions.length > 0)) && (
              <div
                className={`p-3 rounded-2xl ${
                  isOwn
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-bl-sm"
                }`}
              >
                {/* Sender name for group chats */}
                {!isOwn && message.sender && (
                  <p className="text-xs font-bold mb-1 opacity-70">
                    {message.sender.displayName}
                  </p>
                )}

                {/* Message content */}
                {message.content && (
                  <p className="text-sm leading-normal whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}
              </div>
            )}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-col gap-2 mt-1 w-full">
                {message.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={getFileUrl(attachment.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={attachment.fileName}
                    className="block"
                  >
                    {attachment.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <img
                        src={getFileUrl(attachment.fileUrl)}
                        alt={attachment.fileName}
                        className="rounded-xl max-h-60 object-cover hover:opacity-90 transition-opacity border border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div
                        className={`p-3 rounded-xl flex items-center gap-3 ${
                          isOwn
                            ? "bg-primary/90 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
                        }`}
                      >
                        <span className="material-symbols-outlined text-2xl">
                          description
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {attachment.fileName}
                          </span>
                          <span className="text-xs opacity-70">
                            Click to download
                          </span>
                        </div>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            )}

            {/* Reactions Display */}
            {message.reactions && message.reactions.length > 0 && (
              <div
                className={`flex gap-1 mt-1 -mb-2 z-10 ${
                  isOwn ? "justify-end" : "justify-start"
                }`}
              >
                {message.reactions.map((reaction, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm"
                    title={reaction.username}
                  >
                    {reaction.emojiType}
                  </div>
                ))}
              </div>
            )}

            {/* Time and read status */}
            {isOwn && (
              <div className="flex items-center gap-1 mt-1 mr-1">
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {formatTime(message.createdAt)}
                </p>
                <span className="material-symbols-outlined !text-[14px] text-primary">
                  done_all
                </span>
              </div>
            )}
            {!isOwn && (
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 ml-1">
                {formatTime(message.createdAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
