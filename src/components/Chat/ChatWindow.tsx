import React, { useEffect, useRef, useState } from "react";
import { messageApi } from "../../api/message.api";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import { useSignalR } from "../../hooks/useSignalR";
import "../../styles/chat.css";
import { Conversation, ConversationType, StatusUser } from "../../types";
import { Message } from "../../types/message.types";
import { SIGNALR_HUB_URL, TYPING_TIMEOUT } from "../../utils/constants";
import MessageBubble from "../Message/MessageBubble";
import { conversationApi } from "../../api/conversation.api";
import { GroupMembersModal } from "./GroupMembersModal";
import { AddMembersModal } from "./AddMembersModal";
import toast from "react-hot-toast";
import { EmojiPicker } from "./EmojiPicker";

interface ChatWindowProps {
  conversation: Conversation;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation }) => {
  const { user } = useAuth();
  const {
    messages,
    setMessages,
    addMessage,
    addTypingUser,
    removeTypingUser,
    setConversations,
    setCurrentConversation,
  } = useChat();
  const { invoke, on, isConnected } = useSignalR(SIGNALR_HUB_URL);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenerSetupRef = useRef<number | undefined>(undefined);

  const reloadConversations = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      const updatedConversations = await conversationApi.getUserConversations(
        user.id
      );
      setConversations(updatedConversations);
    } catch (err) {
      console.error("Failed to reload conversations:", err);
    }
  }, [user?.id, setConversations]);

  useEffect(() => {
    const loadMessage = async () => {
      setLoading(true);

      try {
        const data = await messageApi.getConversationMessages(
          conversation.id,
          1,
          50
        );
        const sortedMessages = [...data].reverse();
        setMessages(sortedMessages);
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setLoading(false);
      }
    };

    if (conversation.id) {
      loadMessage();
    }
  }, [conversation.id, setMessages]);

  // Join conversation via SignalR
  useEffect(() => {
    const joinConversation = async () => {
      if (user?.id && conversation?.id) {
        const convId = conversation.id;
        console.log("🚪 Joining conversation:", convId, "User:", user.id);

        try {
          await invoke("JoinConversation", convId, user.id);
          console.log("Joined conversation successfully");
        } catch (err) {
          console.error("Failed to join conversation:", err);
        }
      }
    };

    joinConversation();
  }, [user?.id, conversation?.id, invoke]);

  // Setup SignalR event handlers
  useEffect(() => {
    const convId = conversation?.id;

    if (listenerSetupRef.current && listenerSetupRef.current === convId) {
      return;
    }
    listenerSetupRef.current = convId;

    on("ReceiveMessage", (message: Message) => {
      if (message.conversationId === convId) {
        addMessage(message);
        scrollToBottom();
      }
    });

    on("UserTyping", (typing: any) => {
      if (typing.conversationId === convId) {
        addTypingUser(typing.id);
      }
    });

    on("UserStoppedTyping", (userId: number) => {
      removeTypingUser(userId);
    });
  }, [conversation?.id, addMessage, addTypingUser, removeTypingUser, on]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    if (!isConnected) {
      return;
    }

    if (e.target.value.trim()) {
      const convId = conversation?.id;
      invoke("SendTyping", convId, user?.id, user?.displayName)
        .then(() => console.log("Typing indicator sent"))
        .catch((err) => console.warn("Failed to send typing indicator:", err));

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        invoke("StopTyping", convId, user?.id)
          .then(() => console.log("Stop typing sent"))
          .catch((err) => console.warn("Failed to stop typing:", err));
      }, TYPING_TIMEOUT);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;

    try {
      await invoke(
        "SendMessage",
        conversation.id,
        user.id,
        inputValue.trim(),
        0 // MessageType.Text
      );
      setInputValue("");
      invoke("StopTyping", conversation.id, user.id);
      if (reloadConversations) {
        await reloadConversations();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleMembersChanged = async () => {
    await reloadConversations();
    setRefreshKey((prev) => prev + 1);
  };

  // Thêm handler cho group deleted
  const handleGroupDeleted = async () => {
    // Xoá group khỏi conversations
    setConversations((prev: any) =>
      prev.filter((conv: any) => conv.id !== conversation.id)
    );
    // Clear current conversation
    setCurrentConversation(null);
    setShowGroupMembers(false);
    toast.success("Nhóm đã được xoá");
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingFiles(true);

    try {
      // Create FormData
      const formData = new FormData();

      for (let i = 0; i < files.length; i++) {
        formData.append("file", files[i]);
      }

      // Send first message as text placeholder
      const placeholderMessage: any = await invoke(
        "SendMessage",
        conversation.id,
        user?.id,
        `📎 Sending ${files.length} file(s)...`,
        0
      );

      // Upload files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileForm = new FormData();
        fileForm.append("file", file);

        try {
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/attachments/upload?messageId=${placeholderMessage?.messageId}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: fileForm,
            }
          );

          if (!response.ok) throw new Error("Upload failed");
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
        }
      }

      await reloadConversations();
    } catch (err) {
      console.error("Failed to upload files:", err);
      toast.error("Failed to upload files");
    } finally {
      setUploadingFiles(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileUpload(e.dataTransfer.files);
  };

  // Handle file input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const getOtherMember = () => {
    if (conversation.conversationType === ConversationType.Direct) {
      return conversation.members.find((m) => m.id !== user?.id);
    }
    return null;
  };

  const getHeaderTitle = (): string => {
    if (conversation.conversationType === ConversationType.Direct) {
      const otherMember = getOtherMember();
      return otherMember?.displayName || "Direct Chat";
    }
    return conversation.groupName || "Group Chat";
  };

  const getHeaderSubtitle = (): string => {
    if (conversation.conversationType === ConversationType.Direct) {
      const otherMember = getOtherMember();
      if (otherMember?.status === StatusUser.Online) {
        return "Online";
      }
      return `Active 15 minutes ago`;
    }
    return `${conversation.members.length} members`;
  };

  return (
    <div
      className="flex flex-1 flex-col h-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Chat Header */}
      <header className="flex items-center justify-between gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111418] shrink-0">
        <div className="flex items-center gap-4">
          {conversation.conversationType === ConversationType.Group ? (
            // Group Avatar (placeholder với icon)
            <div className="bg-blue-500 bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined">group</span>
            </div>
          ) : (
            // Direct Chat Avatar
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{
                backgroundImage: `url("${getOtherMember()?.avatar || ""}")`,
              }}
            />
          )}
          <div className="flex flex-col">
            <h2 className="text-black dark:text-white text-base font-semibold leading-normal">
              {getHeaderTitle()}
            </h2>
            <p className="text-[#64748b] dark:text-[#9dabb9] text-sm font-normal leading-normal">
              {getHeaderSubtitle()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {conversation.conversationType === ConversationType.Group && (
            <button
              onClick={() => setShowGroupMembers(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
              title="Xem thành viên"
            >
              <span className="material-symbols-outlined">group</span>
            </button>
          )}
          <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
            <span className="material-symbols-outlined">videocam</span>
          </button>
          <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
            <span className="material-symbols-outlined">call</span>
          </button>
          <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
            <span className="material-symbols-outlined">info</span>
          </button>
        </div>
      </header>

      {/* Messages Pane */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-[#111418]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-500 dark:text-gray-400">
              Loading messages...
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-500 dark:text-gray-400">
              No messages yet. Start the conversation!
            </span>
          </div>
        ) : (
          <>
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Today
            </div>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.senderId === user?.id
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  key={index}
                  className={`flex ${
                    message.senderId === user?.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <MessageBubble
                    message={message}
                    isOwn={message.senderId === user?.id}
                  />
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111418] shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-4">
          {/* File upload button */}
          <input
            type="file"
            id="file-input"
            multiple
            accept="*/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={uploadingFiles}
          />
          <label
            htmlFor="file-input"
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined">
              {uploadingFiles ? "hourglass_empty" : "attach_file"}
            </span>
          </label>

          <input
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-background-dark border border-gray-300 dark:border-gray-700 rounded-full focus:ring-primary focus:border-primary text-black dark:text-white placeholder-gray-500 transition-all"
            placeholder="Nhập tin nhắn..."
            type="text"
            value={inputValue}
            onChange={handleInputChange}
          />
          {/* Emoji picker button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined">emoji_emotions</span>
            </button>
            <EmojiPicker
              isOpen={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              onEmojiSelect={async (emoji) => {
                // Send emoji as reaction
                await invoke(
                  "AddReaction",
                  messages[messages.length - 1]?.id,
                  conversation.id,
                  user?.id,
                  emoji,
                  user?.displayName
                );
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </form>
      </div>

      {/* Group Members Modal */}
      <GroupMembersModal
        key={refreshKey}
        conversation={conversation}
        isOpen={showGroupMembers}
        onClose={() => setShowGroupMembers(false)}
        onMemberRemoved={handleMembersChanged}
        onGroupDeleted={handleGroupDeleted}
      />

      {/* Add Members Modal */}
      <AddMembersModal
        conversation={conversation}
        isOpen={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        onMembersAdded={handleMembersChanged}
      />
    </div>
  );
};

export default ChatWindow;
