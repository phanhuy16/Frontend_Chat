import React, { useEffect, useRef, useState } from "react";
import { messageApi } from "../../api/message.api";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import { useSignalR } from "../../hooks/useSignalR";
import "../../styles/chat.css";
import {
  Conversation,
  ConversationType,
  StatusUser,
  MessageType,
} from "../../types";
import { Message } from "../../types/message.types";
import { SIGNALR_HUB_URL_CHAT, TYPING_TIMEOUT } from "../../utils/constants";
import MessageBubble from "../Message/MessageBubble";
import { conversationApi } from "../../api/conversation.api";
import { GroupMembersModal } from "./GroupMembersModal";
import { AddMembersModal } from "./AddMembersModal";
import toast from "react-hot-toast";
import blockApi from "../../api/block.api";
import { EmojiPicker } from "./EmojiPicker";
import ContactInfoSidebar from "./ContactInfoSidebar";
import attachmentApi from "../../api/attachment.api";
import { Progress, Spin } from "antd";
import { getAvatarUrl, formatLastActive } from "../../utils/helpers";
import { useCallIntegration } from "../../hooks/useCallIntegration";
import { SIGNALR_HUB_URL_CALL } from "../../utils/constants";
import IncomingCallModal from "../Call/IncomingCallModal";
import CallModal from "../Call/CallModal";
import VideoCallWindow from "../Call/VideoCallWindow";
import AudioCallWindow from "../Call/AudioCallWindow";
import { CallType } from "../../types";

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

  const {
    callState,
    incomingCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
  } = useCallIntegration(SIGNALR_HUB_URL_CALL as string);

  const { invoke, on, off, isConnected } = useSignalR(
    SIGNALR_HUB_URL_CHAT as string
  );
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showContactSidebar, setShowContactSidebar] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenerSetupRef = useRef<number | undefined>(undefined);
  const processedMessageIdsRef = useRef<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadMenuRef = useRef<HTMLDivElement | null>(null);
  const uploadButtonRef = useRef<HTMLButtonElement | null>(null);

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
    const handler = (e: MouseEvent) => {
      if (
        uploadMenuRef.current &&
        !uploadMenuRef.current.contains(e.target as Node) &&
        uploadButtonRef.current &&
        !uploadButtonRef.current.contains(e.target as Node)
      ) {
        setShowUploadMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Check block status
  useEffect(() => {
    const checkBlockStatus = async () => {
      const otherMember = getOtherMember();
      if (
        user?.id &&
        otherMember?.id &&
        conversation.conversationType === ConversationType.Direct
      ) {
        try {
          const { isBlocked } = await blockApi.isUserBlockedMutual(
            user.id,
            otherMember.id
          );
          setIsBlocked(isBlocked);
        } catch (err) {
          console.error("Error checking block status:", err);
        }
      } else {
        setIsBlocked(false);
      }
    };

    checkBlockStatus();
  }, [conversation, user?.id]);

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

    on("Error", (errorMessage: string) => {
      console.error("SignalR Error:", errorMessage);

      if (errorMessage.includes("chặn")) {
        setIsBlocked(true);
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    });

    on("ReceiveMessage", (data: any) => {
      // Handle both camelCase and PascalCase
      const messageId = data.messageId ?? data.MessageId;
      const conversationId = data.conversationId ?? data.ConversationId;
      const senderId = data.senderId ?? data.SenderId;
      const senderName = data.senderName ?? data.SenderName;
      const senderAvatar = data.senderAvatar ?? data.SenderAvatar;
      const content = data.content ?? data.Content;
      const messageType = data.messageType ?? data.MessageType;
      const createdAt = data.createdAt ?? data.CreatedAt;

      if (conversationId === convId) {
        if (!processedMessageIdsRef.current.has(messageId)) {
          processedMessageIdsRef.current.add(messageId);

          const mappedMessage: Message = {
            id: messageId,
            conversationId: conversationId,
            senderId: senderId,
            sender: {
              id: senderId,
              displayName: senderName,
              avatar: senderAvatar,
            } as any,
            content: content,
            messageType: messageType,
            createdAt: createdAt,
            updatedAt: createdAt,
            isDeleted: false,
            reactions: [],
            attachments: [],
          };

          addMessage(mappedMessage);
          scrollToBottom();
        }
      }
    });

    on("UserTyping", (typing: any) => {
      const typingConvId = typing.conversationId ?? typing.ConversationId;
      const typingUserId =
        typing.userId ?? typing.UserId ?? typing.id ?? typing.Id;
      if (typingConvId === convId) {
        addTypingUser(typingUserId);
      }
    });

    on("UserStoppedTyping", (userId: number) => {
      removeTypingUser(userId);
    });

    return () => {
      off("Error");
      off("ReceiveMessage");
      off("UserTyping");
      off("UserStoppedTyping");
    };
  }, [conversation?.id, addMessage, addTypingUser, removeTypingUser, on, off]);

  useEffect(() => {
    // small delay to ensure DOM painted
    const t = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(t);
  }, [messages.length]);

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

    if (isBlocked) {
      toast.error("Bạn đã chặn người dùng này, không thể gửi tin nhắn");
      return;
    }

    try {
      await invoke(
        "SendMessage",
        conversation.id,
        user.id,
        inputValue.trim(),
        MessageType.Text
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

    if (isBlocked) {
      toast.error("Bạn đã chặn người dùng này, không thể gửi file");
      return;
    }

    // CRITICAL: Capture conversation ID at the START
    const conversationIdAtStart = conversation.id;
    const userIdAtStart = user?.id;

    if (!userIdAtStart) return;

    setUploadingFiles(true);
    setUploadProgress(0);

    try {
      // Determine message type based on files
      const isAllImages = Array.from(files).every((f) =>
        f.type.startsWith("image/")
      );
      const messageType = isAllImages ? MessageType.Image : MessageType.File;
      // Step 1: Send placeholder message using HTTP API to get ID immediately
      const sentMessage = await messageApi.sendMessage({
        conversationId: conversationIdAtStart,
        senderId: userIdAtStart,
        content: "",
        messageType: messageType,
      });

      const messageId = sentMessage.id;

      if (!messageId) {
        toast.error("Failed to get message ID");
        setUploadingFiles(false);
        return;
      }

      const totalFiles = files.length;
      let successCount = 0;

      // Step 2: Upload files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          await attachmentApi.uploadAttachment(file, messageId.toString());
          successCount++;

          const progress = Math.round(((i + 1) / totalFiles) * 100);
          setUploadProgress(progress);

          toast.success("Uploaded " + file.name);
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
          toast.error("Lỗi khi tải lên " + file.name);
        }
      }

      if (successCount > 0) {
        // Reload messages using CAPTURED conversation ID
        const updatedMessages = await messageApi.getConversationMessages(
          conversationIdAtStart,
          1,
          50
        );
        const sortedMessages = [...updatedMessages].reverse();
        setMessages(sortedMessages);
        toast.success(`Uploaded ${successCount} of ${totalFiles} files`);
      }
    } catch (err) {
      console.error("Failed to upload files:", err);
      toast.error("Failed to upload files");
    } finally {
      setUploadingFiles(false);
      setUploadProgress(0);
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
      return formatLastActive(otherMember?.lastActiveAt);
    }
    return `${conversation.members.length} members`;
  };

  const handleStartAudioCall = async () => {
    const otherMember = getOtherMember();
    if (otherMember && conversation.id) {
      await startCall(
        otherMember.id,
        otherMember.displayName,
        conversation.id,
        CallType.Audio
      );
    }
  };

  const handleStartVideoCall = async () => {
    const otherMember = getOtherMember();
    if (otherMember && conversation.id) {
      await startCall(
        otherMember.id,
        otherMember.displayName,
        conversation.id,
        CallType.Video
      );
    }
  };

  return (
    // ← Main wrapper với flex layout
    <div className="flex h-full w-full overflow-hidden">
      {/* Left side: Chat window */}
      <div
        className="flex flex-1 flex-col h-full"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Incoming Call Modal */}
        {incomingCall && (
          <IncomingCallModal
            caller={{
              id: incomingCall.callerId,
              name: incomingCall.callerName,
              avatar: getAvatarUrl(incomingCall.callerAvatar),
            }}
            callType={incomingCall.callType}
            onAccept={acceptCall}
            onReject={rejectCall}
          />
        )}

        {/* Call Modal (during ringing) */}
        <CallModal
          callState={callState}
          isIncoming={false}
          onAnswer={() => {}}
          onReject={rejectCall}
          onEnd={endCall}
          callerAvatar={getAvatarUrl(incomingCall?.callerAvatar)}
        />

        {/* Video Call Window */}
        {callState.callStatus === "connected" && (
          <VideoCallWindow
            localStream={callState.localStream}
            remoteStream={callState.remoteStream}
            remoteUserName={callState.remoteUserName}
            duration={callState.duration}
            onEndCall={endCall}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            audioEnabled={callState.isAudioEnabled}
            videoEnabled={callState.isVideoEnabled}
          />
        )}

        {/* Audio Call Window */}
        {callState.callStatus === "connected" &&
          callState.callType === CallType.Audio && (
            <AudioCallWindow
              remoteStream={callState.remoteStream}
              remoteUserName={callState.remoteUserName}
              remoteUserAvatar={getAvatarUrl(getOtherMember()?.avatar)}
              duration={callState.duration}
              onEndCall={endCall}
              onToggleAudio={toggleAudio}
              audioEnabled={callState.isAudioEnabled}
            />
          )}

        {/* Chat Header */}
        <header className="flex items-center justify-between gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111418] shrink-0">
          <div className="flex items-center gap-4">
            {conversation.conversationType === ConversationType.Group ? (
              <div className="bg-blue-500 bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 flex items-center justify-center text-white">
                <span className="material-symbols-outlined">group</span>
              </div>
            ) : (
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                style={{
                  backgroundImage: `url("${getAvatarUrl(
                    getOtherMember()?.avatar
                  )}")`,
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
                className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                title="Xem thành viên"
              >
                <span className="material-symbols-outlined">group</span>
              </button>
            )}
            <button
              onClick={handleStartVideoCall}
              disabled={isBlocked}
              className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">videocam</span>
            </button>
            <button
              onClick={handleStartAudioCall}
              disabled={isBlocked}
              className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">call</span>
            </button>
            <button
              onClick={() => setShowContactSidebar(!showContactSidebar)}
              className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
              title="Thông tin liên hệ"
            >
              <span className="material-symbols-outlined">info</span>
            </button>
          </div>
        </header>

        {/* Messages Pane */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 shadow-inner">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              Đang tải tin nhắn...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Chưa có tin nhắn
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
                  <MessageBubble
                    message={message}
                    isOwn={message.senderId === user?.id}
                    onReact={async (messageId, emoji) => {
                      try {
                        await invoke(
                          "AddReaction",
                          messageId,
                          conversation.id,
                          user?.id,
                          emoji,
                          user?.displayName
                        );
                      } catch (err) {
                        console.error("Failed to add reaction:", err);
                        toast.error("Failed to add reaction");
                      }
                    }}
                  />
                </div>
              ))}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111418] shrink-0">
          {uploadingFiles && (
            <div className="mb-2">
              <Progress percent={uploadProgress} size="small" />
            </div>
          )}

          {isBlocked ? (
            <div className="p-3 text-center text-red-500 bg-red-100 dark:bg-red-900/20 rounded-lg">
              Bạn không thể gửi tin nhắn trong cuộc trò chuyện này
            </div>
          ) : (
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
              <button
                type="button"
                onClick={() => setShowUploadMenu(!showUploadMenu)}
                className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors shrink-0"
              >
                <span className="material-symbols-outlined">add_circle</span>
              </button>

              {showUploadMenu && (
                <div
                  ref={uploadMenuRef}
                  className="absolute bottom-20 left-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-2"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = "image/*";
                        fileInputRef.current.click();
                      }
                      setShowUploadMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">image</span>
                    <span>Hình ảnh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = "*/*";
                        fileInputRef.current.click();
                      }
                      setShowUploadMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">
                      description
                    </span>
                    <span>Tệp tin</span>
                  </button>
                </div>
              )}

              <div className="flex-1 relative">
                <input
                  className="w-full pl-4 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-full bg-gray-50 dark:bg-gray-800 text-black dark:text-white"
                  placeholder="Nhập tin nhắn..."
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    sentiment_satisfied
                  </span>
                </button>
                <EmojiPicker
                  isOpen={showEmojiPicker}
                  onClose={() => setShowEmojiPicker(false)}
                  onEmojiSelect={(emoji) => {
                    setInputValue((prev) => prev + emoji);
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() || uploadingFiles}
                className="w-10 h-10 flex items-center justify-center text-white bg-primary rounded-full disabled:opacity-50 hover:brightness-110 transition-all shrink-0"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Right side: Contact Info Sidebar */}
      {showContactSidebar && (
        <>
          {/* Mobile overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setShowContactSidebar(false)}
          />
        </>
      )}

      <ContactInfoSidebar
        isOpen={showContactSidebar}
        onClose={() => setShowContactSidebar(false)}
        otherMember={getOtherMember()}
        conversation={conversation}
        messages={messages}
        onBlockChange={setIsBlocked}
        onStartAudioCall={handleStartAudioCall}
        onStartVideoCall={handleStartVideoCall}
      />

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
