import React from "react";
import { Message } from "../../types/message.types";
import { User, Conversation, MessageType } from "../../types";
import MessageBubble from "../Message/MessageBubble";
import { formatTime } from "../../utils/formatters";

interface MessageListProps {
  messages: Message[];
  user: User | null;
  loading: boolean;
  conversation: Conversation;
  typingUsers: Set<number>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  getWallpaperStyle: () => React.CSSProperties;
  handleDeleteForMe: (messageId: number) => void;
  handleDeleteForEveryone: (messageId: number) => void;
  handleAddReaction: (messageId: number, emoji: string) => void;
  setReplyingTo: (msg: Message) => void;
  handlePinMessage: (messageId: number) => void;
  setForwardingMessage: (msg: Message) => void;
  setEditingMessage: (msg: Message) => void;
  setInputValue: (val: string) => void;
  scrollToBottom: () => void;
  loadMoreMessages: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  onReportMessage?: (msg: Message) => void;
  onSetReminder?: (msg: Message) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  user,
  loading,
  conversation,
  typingUsers,
  scrollRef,
  messagesEndRef,
  handleScroll,
  getWallpaperStyle,
  handleDeleteForMe,
  handleDeleteForEveryone,
  handleAddReaction,
  setReplyingTo,
  handlePinMessage,
  setForwardingMessage,
  setEditingMessage,
  setInputValue,
  scrollToBottom,
  loadMoreMessages,
  hasMore,
  loadingMore,
  onReportMessage,
  onSetReminder,
}) => {
  const topObserverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreMessages();
        }
      },
      { threshold: 1.0 },
    );

    if (topObserverRef.current) {
      observer.observe(topObserverRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMoreMessages]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 space-y-6 transition-all duration-500 relative"
      style={getWallpaperStyle()}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
          <div className="animate-spin text-primary">
            <span className="material-symbols-outlined text-4xl">sync</span>
          </div>
          <p className="font-bold">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 opacity-60">
          <span className="material-symbols-outlined text-6xl">
            chat_bubble_outline
          </span>
          <p className="text-xl font-bold">No messages yet</p>
          <p className="text-sm">Be the first to say hello!</p>
        </div>
      ) : (
        <>
          <div
            ref={topObserverRef}
            className="h-10 flex items-center justify-center"
          >
            {loadingMore && (
              <div className="flex items-center gap-2 text-primary animate-pulse">
                <span className="material-symbols-outlined animate-spin text-sm">
                  sync
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Loading earlier messages...
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">
              Today
            </span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>
          {messages.map((message) => {
            const isOwn = message.senderId === user?.id;
            const currentUserMember = conversation.members.find(
              (m) => m.id === user?.id,
            );
            const canPin =
              currentUserMember?.canPinMessages ||
              currentUserMember?.role === "Admin";
            const canDeleteEveryone =
              currentUserMember?.canDeleteMessages ||
              currentUserMember?.role === "Admin";

            return (
              <div
                key={message.id}
                id={`message-${message.id}`}
                className={`flex animate-fade-in ${
                  isOwn ? "justify-end" : "justify-start"
                }`}
              >
                <MessageBubble
                  message={message}
                  isOwn={isOwn}
                  onDeleteForMe={handleDeleteForMe}
                  onDeleteForEveryone={handleDeleteForEveryone}
                  onReact={(messageId, emoji) =>
                    handleAddReaction(messageId, emoji)
                  }
                  onReply={(msg) => setReplyingTo(msg)}
                  onPin={handlePinMessage}
                  onForward={(msg) => setForwardingMessage(msg)}
                  onEdit={(msg) => {
                    setEditingMessage(msg);
                    setInputValue(msg.content || "");
                  }}
                  onReport={(msg) => onReportMessage?.(msg)}
                  currentUserId={user?.id || 0}
                  canPin={canPin}
                  canDeleteEveryone={canDeleteEveryone}
                  onSetReminder={onSetReminder}
                />
              </div>
            );
          })}

          {Array.from(typingUsers).map((typingUserId) => {
            const typingUser = conversation.members.find(
              (m) => m.id === typingUserId,
            );
            if (!typingUser || typingUserId === user?.id) return null;
            return (
              <div
                key={typingUserId}
                className="flex justify-start animate-fade-in"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border border-slate-200/30 dark:border-white/5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-xs font-bold">
                    {typingUser.displayName} đang nhập...
                  </span>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

export default MessageList;
