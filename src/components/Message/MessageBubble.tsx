// src/components/Chat/MessageBubble.tsx
import React from "react";
import { Message } from "../../types/message.types";
import { formatTime } from "../../utils/formatters";
import { getAvatarUrl } from "../../utils/helpers";
import { MessageType } from "../../types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReact?: (messageId: number, emoji: string) => void;
  onDeleteForMe?: (messageId: number) => void;
  onDeleteForEveryone?: (messageId: number) => void;
  onReply?: (message: Message) => void;
  onPin?: (messageId: number) => void;
  onForward?: (message: Message) => void;
  onEdit?: (message: Message) => void;
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  onReact,
  onDeleteForMe,
  onDeleteForEveryone,
  onReply,
  onPin,
  onForward,
  onEdit,
}) => {
  const [showOptions, setShowOptions] = React.useState(false);
  const [showReactions, setShowReactions] = React.useState(false);

  // Audio player states
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const getFileUrl = (fileUrl: string) => {
    if (fileUrl.startsWith("http")) {
      return fileUrl;
    }
    const baseUrl = process.env.REACT_APP_API_URL?.replace("/api", "");
    return `${baseUrl}${fileUrl}`;
  };

  const formatAudioTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  return (
    <div
      className={`group flex ${
        isOwn ? "justify-end pl-12" : "justify-start pr-12"
      } relative mb-4`}
    >
      <div
        className={`flex items-end gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
      >
        {/* Avatar for received messages */}
        {!isOwn && (
          <div className="relative shrink-0 mb-1">
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-secondary rounded-full blur-[2px] opacity-40"></div>
            <div
              className="relative bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 border border-white/20 shadow-sm"
              style={{
                backgroundImage: `url("${getAvatarUrl(
                  message.sender?.avatar
                )}")`,
              }}
            />
          </div>
        )}

        {/* Message Bubble Container */}
        <div
          className={`relative flex flex-col ${
            isOwn ? "items-end" : "items-start"
          }`}
        >
          {/* Message Options Button - Shows on hover */}
          {!message.isDeleted && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 ${
                isOwn ? "right-full mr-12" : "left-full ml-12"
              } opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 scale-90 group-hover:scale-100 flex gap-2`}
            >
              {/* Reaction Picker Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowReactions(!showReactions);
                    setShowOptions(false);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-500 hover:text-primary shadow-premium border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg font-bold">
                    add_reaction
                  </span>
                </button>

                {/* Reaction Picker Popup */}
                {showReactions && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowReactions(false)}
                    />
                    <div
                      className={`absolute bottom-full mb-2 ${
                        isOwn ? "right-0" : "left-0"
                      } z-30 animate-slide-up flex`}
                    >
                      <div className="p-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex gap-1.5 min-w-max">
                        {REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              onReact?.(message.id, emoji);
                              setShowReactions(false);
                            }}
                            className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all hover:scale-125 text-xl"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Reply Button */}
              <button
                onClick={() => onReply?.(message)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-500 hover:text-primary shadow-premium border border-slate-200 dark:border-slate-700 transition-colors"
                title="Trả lời"
              >
                <span className="material-symbols-outlined text-lg font-bold">
                  reply
                </span>
              </button>

              {/* More Options Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowOptions(!showOptions);
                    setShowReactions(false);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-500 hover:text-primary shadow-premium border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg font-bold">
                    more_vert
                  </span>
                </button>

                {showOptions && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowOptions(false)}
                    />
                    <div
                      className={`absolute bottom-full mb-2 ${
                        isOwn ? "right-0" : "left-0"
                      } z-30 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1 min-w-[160px] animate-slide-up`}
                    >
                      <button
                        onClick={() => {
                          onPin?.(message.id);
                          setShowOptions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                      >
                        <span className="material-symbols-outlined text-base">
                          push_pin
                        </span>
                        {message.isPinned ? "Bỏ ghim" : "Ghim tin nhắn"}
                      </button>
                      <button
                        onClick={() => {
                          onDeleteForMe?.(message.id);
                          setShowOptions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                      >
                        <span className="material-symbols-outlined text-base">
                          delete
                        </span>
                        Xoá ở phía bạn
                      </button>
                      <button
                        onClick={() => {
                          onForward?.(message);
                          setShowOptions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                      >
                        <span className="material-symbols-outlined text-base">
                          forward
                        </span>
                        Chuyển tiếp
                      </button>
                      {isOwn && (
                        <button
                          onClick={() => {
                            onDeleteForEveryone?.(message.id);
                            setShowOptions(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 text-red-500"
                        >
                          <span className="material-symbols-outlined text-base">
                            history
                          </span>
                          Thu hồi cho mọi người
                        </button>
                      )}
                      {isOwn && !message.isDeleted && (
                        <button
                          onClick={() => {
                            onEdit?.(message);
                            setShowOptions(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                        >
                          <span className="material-symbols-outlined text-base">
                            edit
                          </span>
                          Chỉnh sửa
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Message Content Bubble */}
          {((message.content && message.messageType !== MessageType.Voice) ||
            (!isOwn &&
              message.sender &&
              message.messageType !== MessageType.Voice) ||
            message.isDeleted ||
            message.isDeletedForMe) && (
            <div
              className={`relative px-4 py-2 rounded-2xl ${
                message.isDeleted || message.isDeletedForMe
                  ? "bg-transparent shadow-none border-none"
                  : isOwn
                  ? "bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl rounded-br-none shadow-premium shadow-primary/20"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-2xl rounded-bl-none border border-slate-200/50 dark:border-white/5 shadow-sm"
              }`}
            >
              {message.forwardedFromId && (
                <div className="flex items-center gap-1 text-[11px] opacity-70 mb-1 italic">
                  <span className="material-symbols-outlined text-sm">
                    forward
                  </span>
                  <span>Đã chuyển tiếp</span>
                </div>
              )}
              {/* Replying to display */}
              {message.parentMessage && (
                <div
                  className={`mb-2 p-2 rounded-lg border-l-4 ${
                    isOwn
                      ? "bg-white/10 border-white/40"
                      : "bg-slate-200 dark:bg-slate-700 border-primary"
                  } text-[12px] opacity-80 cursor-pointer`}
                  onClick={() => {
                    const el = document.getElementById(
                      `message-${message.parentMessageId}`
                    );
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    el?.classList.add("highlight-message");
                    setTimeout(
                      () => el?.classList.remove("highlight-message"),
                      2000
                    );
                  }}
                >
                  <p className="font-bold mb-0.5">
                    {message.parentMessage.sender?.displayName || "User"}
                  </p>
                  <p className="truncate line-clamp-1">
                    {message.parentMessage.content || "Tin nhắn"}
                  </p>
                </div>
              )}

              {/* Sender name for group chats */}
              {!isOwn && message.sender && (
                <p className="text-[11px] font-black mb-1.5 text-primary tracking-wide uppercase">
                  {message.sender.displayName}
                </p>
              )}

              {/* Message content */}
              {message.isDeleted || message.isDeletedForMe ? (
                <div className="py-1 px-4 border border-slate-200 dark:border-white/20 rounded-full bg-slate-50/50 dark:bg-white/5 mx-auto">
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap text-center">
                    {message.isDeletedForMe
                      ? "Bạn đã xóa một tin nhắn"
                      : isOwn
                      ? "Bạn đã xóa một tin nhắn"
                      : "Tin nhắn đã được thu hồi"}
                  </p>
                </div>
              ) : (
                message.content && (
                  <p
                    className="leading-normal whitespace-pre-wrap break-words font-medium"
                    style={{ fontSize: "var(--message-text)" }}
                  >
                    {message.content}
                  </p>
                )
              )}

              {message.isModified &&
                !message.isDeleted &&
                !message.isDeletedForMe && (
                  <p className="text-[10px] opacity-50 mt-1 italic text-right">
                    Đã chỉnh sửa
                  </p>
                )}

              {/* Reactions Display overlay */}
              {message.reactions && message.reactions.length > 0 && (
                <div
                  className={`absolute -bottom-3 ${
                    isOwn ? "right-2" : "left-2"
                  } flex gap-1 items-center bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded-full shadow-premium border border-slate-100 dark:border-slate-600 animate-fade-in`}
                >
                  {message.reactions.map((reaction, idx) => (
                    <span
                      key={idx}
                      className="text-xs"
                      title={reaction.username}
                    >
                      {reaction.emojiType}
                    </span>
                  ))}
                  {message.reactions.length > 1 && (
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-0.5">
                      {message.reactions.length}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {!(message.isDeleted || message.isDeletedForMe) &&
            message.messageType !== MessageType.Voice &&
            message.attachments &&
            message.attachments.length > 0 && (
              <div
                className={`flex flex-col gap-2 mt-2 w-full max-w-[300px] ${
                  isOwn ? "items-end" : "items-start"
                }`}
              >
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="w-full relative group/attachment"
                  >
                    <a
                      href={getFileUrl(attachment.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm"
                    >
                      {attachment.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <div className="relative">
                          <img
                            src={getFileUrl(attachment.fileUrl)}
                            alt={attachment.fileName}
                            className="max-h-80 w-full object-cover transition-transform duration-500 group-hover/attachment:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/attachment:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/attachment:opacity-100">
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
                              <span className="material-symbols-outlined text-3xl">
                                open_in_new
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`p-4 flex items-center gap-4 transition-all duration-300 ${
                            isOwn
                              ? "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100"
                              : "bg-white dark:bg-slate-800/40 text-slate-900 dark:text-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-3xl">
                              description
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold truncate">
                              {attachment.fileName}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider font-black opacity-50">
                              Download File
                            </span>
                          </div>
                        </div>
                      )}
                    </a>
                  </div>
                ))}
              </div>
            )}

          {/* Voice Message Player */}
          {!(message.isDeleted || message.isDeletedForMe) &&
            message.messageType === MessageType.Voice &&
            message.attachments &&
            message.attachments.length > 0 && (
              <div className={`mt-1 ${isOwn ? "mr-0" : "ml-0"}`}>
                <div
                  className={`flex items-center gap-3 p-3 rounded-2xl border ${
                    isOwn
                      ? "bg-gradient-to-br from-primary to-primary-dark border-white/20 text-white shadow-premium"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  } shadow-sm min-w-[260px]`}
                >
                  <button
                    className={`w-10 h-10 flex items-center justify-center rounded-full ${
                      isOwn ? "bg-white text-primary" : "bg-primary text-white"
                    } hover:scale-105 active:scale-95 transition-all shrink-0 shadow-sm`}
                    onClick={togglePlayPause}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {isPlaying ? "pause" : "play_arrow"}
                    </span>
                  </button>
                  <div className="flex-1 flex flex-col gap-1.5">
                    {!isOwn && message.sender && (
                      <p className="text-[10px] font-black text-primary tracking-wide uppercase mb-0.5">
                        {message.sender.displayName}
                      </p>
                    )}
                    <div className="flex items-center gap-1 h-6 px-1">
                      {[
                        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
                        17, 18, 19, 20,
                      ].map((i) => {
                        const progress =
                          duration > 0 ? (currentTime / duration) * 20 : 0;
                        const isActive = i <= progress;
                        return (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-all duration-300 ${
                              isActive
                                ? isOwn
                                  ? "bg-white"
                                  : "bg-primary"
                                : isOwn
                                ? "bg-white/30"
                                : "bg-slate-200 dark:bg-slate-700"
                            }`}
                            style={{
                              height: `${30 + (Math.sin(i * 1.5) * 15 + 15)}%`,
                              opacity: isActive ? 1 : 0.6,
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-80">
                      <span>
                        {formatAudioTime(currentTime)} /{" "}
                        {formatAudioTime(duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">
                          mic
                        </span>
                        VOICE
                      </span>
                    </div>
                    <audio
                      ref={audioRef}
                      src={getFileUrl(message.attachments[0].fileUrl)}
                      className="hidden"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => {
                        setIsPlaying(false);
                        setCurrentTime(0);
                      }}
                      onTimeUpdate={(e) =>
                        setCurrentTime(e.currentTarget.currentTime)
                      }
                      onLoadedMetadata={(e) =>
                        setDuration(e.currentTarget.duration)
                      }
                    />
                  </div>
                </div>
              </div>
            )}

          {/* Metadata: Time and Status */}
          <div
            className={`flex items-center gap-1.5 mt-1.5 ${
              isOwn ? "mr-1" : "ml-1"
            }`}
          >
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
              {formatTime(message.createdAt)}
            </p>
            {isOwn && (
              <span
                className={`material-symbols-outlined !text-[14px] ${
                  (message.readCount || 0) > 0
                    ? "text-blue-400"
                    : "text-slate-400"
                }`}
                title={
                  message.readCount
                    ? `Đã xem bởi ${message.readCount} người`
                    : "Chưa xem"
                }
              >
                {(message.readCount || 0) > 0 ? "done_all" : "done"}
              </span>
            )}
            {message.isPinned && (
              <span className="material-symbols-outlined !text-[14px] text-amber-500">
                push_pin
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
