// src/components/Chat/MessageBubble.tsx
import React from "react";
import { Message } from "../../types/message.types";
import { formatTime } from "../../utils/formatters";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const getFileUrl = (fileUrl: string) => {
    if (fileUrl.startsWith("http")) {
      return fileUrl;
    }
    const baseUrl = process.env.REACT_APP_API_URL?.replace("/api", "");
    return `${baseUrl}${fileUrl}`;
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-end gap-2 ${isOwn ? "max-w-md" : "max-w-md"}`}
      >
        {/* Avatar for received messages */}
        {!isOwn && (
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 shrink-0"
            style={{
              backgroundImage: `url("${message.sender?.avatar}")`,
            }}
          />
        )}

        {/* Message Bubble */}
        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
          <div
            className={`p-3 rounded-lg ${
              isOwn
                ? "bg-primary text-white rounded-br-none"
                : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-bl-none"
            }`}
          >
            {/* Sender name for group chats */}
            {!isOwn && message.sender && (
              <p className="text-xs font-semibold mb-1 opacity-75">
                {message.sender.displayName}
              </p>
            )}

            {/* Message content */}
            <p className="text-sm leading-normal break-words">
              {message.content}
            </p>

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {message.reactions.map((reaction, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/20 dark:bg-black/20"
                  >
                    {reaction.emojiType}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Attachments - inside message bubble */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-col gap-2 mt-2 w-full">
              {message.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={getFileUrl(attachment.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={attachment.fileName}
                >
                  {attachment.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img
                      src={getFileUrl(attachment.fileUrl)}
                      alt={attachment.fileName}
                      className="rounded-lg max-h-40 hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div
                      className={`p-3 rounded-lg flex items-center gap-2 ${
                        isOwn
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-300 dark:bg-gray-600 text-black dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500"
                      } transition-colors`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        file_download
                      </span>
                      <span className="text-sm truncate max-w-xs">
                        {attachment.fileName}
                      </span>
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}

          {/* Time and read status */}
          {isOwn && (
            <div className="flex items-center gap-1 mt-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(message.createdAt)}
              </p>
              <span className="material-symbols-outlined !text-sm text-primary">
                done_all
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
