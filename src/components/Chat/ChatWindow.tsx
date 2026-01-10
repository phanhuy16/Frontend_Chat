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
import GroupCallWindow from "../Call/GroupCallWindow";
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
    startGroupCall,
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
  const [chatWallpaper, setChatWallpaper] = useState(
    localStorage.getItem("chat-wallpaper") || "default"
  );

  const getWallpaperStyle = () => {
    switch (chatWallpaper) {
      case "solid-dark":
        return { backgroundColor: "#0f172a" };
      case "gradient-blue":
        return { background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)" };
      case "gradient-purple":
        return { background: "linear-gradient(135deg, #4c1d95, #7c3aed)" };
      case "pattern-dots":
        return {
          backgroundColor: "#1e293b",
          backgroundImage: "radial-gradient(#ffffff11 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        };
      default:
        return {};
    }
  };

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

    on("MessageDeleted", (data: any) => {
      const messageId = data.messageId ?? data.MessageId;
      const conversationId = data.conversationId ?? data.ConversationId;

      if (conversationId === convId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isDeleted: true, content: null, attachments: [] }
              : m
          )
        );
      }
    });

    return () => {
      off("Error");
      off("ReceiveMessage");
      off("UserTyping");
      off("UserStoppedTyping");
      off("MessageDeleted");
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

  const handleDeleteForMe = async (messageId: number) => {
    try {
      await messageApi.deleteMessageForMe(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isDeletedForMe: true, content: null, attachments: [] }
            : m
        )
      );
      toast.success("Đã xoá tin nhắn ở phía bạn");
    } catch (err) {
      console.error("Failed to delete message for me:", err);
      toast.error("Không thể xoá tin nhắn");
    }
  };

  const handleDeleteForEveryone = async (messageId: number) => {
    try {
      await invoke("DeleteMessage", messageId, conversation.id, user?.id);
      // The local state will be updated via SignalR "MessageDeleted" event
      toast.success("Đã thu hồi tin nhắn");
    } catch (err) {
      console.error("Failed to recall message:", err);
      toast.error("Không thể thu hồi tin nhắn");
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
    if (conversation.conversationType === ConversationType.Direct) {
      const otherMember = getOtherMember();
      if (otherMember && conversation.id) {
        await startCall(
          otherMember.id,
          otherMember.displayName,
          conversation.id,
          CallType.Audio
        );
      }
    } else {
      // Group Audio Call
      const memberIds = conversation.members.map((m) => m.id);
      await startGroupCall(memberIds, conversation.id, CallType.Audio);
    }
  };

  const handleStartVideoCall = async () => {
    if (conversation.conversationType === ConversationType.Direct) {
      const otherMember = getOtherMember();
      if (otherMember && conversation.id) {
        await startCall(
          otherMember.id,
          otherMember.displayName,
          conversation.id,
          CallType.Video
        );
      }
    } else {
      // Group Video Call
      const memberIds = conversation.members.map((m) => m.id);
      await startGroupCall(memberIds, conversation.id, CallType.Video);
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
            callType={
              incomingCall.callType === "Video"
                ? CallType.Video
                : CallType.Audio
            }
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
        {callState.callStatus === "connected" && !callState.isGroup && (
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
          !callState.isGroup &&
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

        {/* Group Call Window */}
        {callState.callStatus === "connected" && callState.isGroup && (
          <GroupCallWindow
            participants={callState.participants}
            localStream={callState.localStream}
            callType={callState.callType}
            duration={callState.duration}
            isAudioEnabled={callState.isAudioEnabled}
            isVideoEnabled={callState.isVideoEnabled}
            onEndCall={endCall}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
          />
        )}

        {/* Chat Header */}
        <header className="flex items-center justify-between gap-4 px-8 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <div
              className="relative group cursor-pointer"
              onClick={() => setShowContactSidebar(true)}
            >
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-secondary rounded-full blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
              {conversation.conversationType === ConversationType.Group ? (
                <div className="relative bg-gradient-to-br from-primary to-primary-dark aspect-square rounded-full size-10 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-[24px]">
                    group
                  </span>
                </div>
              ) : (
                <div
                  className="relative bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-white/20 shadow-lg"
                  style={{
                    backgroundImage: `url("${getAvatarUrl(
                      getOtherMember()?.avatar
                    )}")`,
                  }}
                />
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-slate-900 dark:text-white text-base font-extrabold leading-tight">
                {getHeaderTitle()}
              </h2>
              <div className="flex items-center gap-1.5">
                {conversation.conversationType === ConversationType.Direct &&
                  getOtherMember()?.status === StatusUser.Online && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                  {getHeaderSubtitle()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <div className="flex items-center bg-slate-100/50 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/50 dark:border-white/5">
              {conversation.conversationType === ConversationType.Group && (
                <button
                  onClick={() => setShowGroupMembers(true)}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
                  title="Members"
                >
                  <span className="material-symbols-outlined !text-[20px]">
                    group
                  </span>
                </button>
              )}
              <button
                onClick={handleStartVideoCall}
                disabled={isBlocked}
                className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all duration-200 disabled:opacity-30"
                title="Video Call"
              >
                <span className="material-symbols-outlined !text-[20px]">
                  videocam
                </span>
              </button>
              <button
                onClick={handleStartAudioCall}
                disabled={isBlocked}
                className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all duration-200 disabled:opacity-30"
                title="Audio Call"
              >
                <span className="material-symbols-outlined !text-[20px]">
                  call
                </span>
              </button>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
              <button
                onClick={() => setShowContactSidebar(!showContactSidebar)}
                className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
                title="Info"
              >
                <span className="material-symbols-outlined !text-[20px]">
                  info
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Messages Pane */}
        <div
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6 transition-all duration-500"
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
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">
                  Today
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex animate-fade-in ${
                    message.senderId === user?.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <MessageBubble
                    message={message}
                    isOwn={message.senderId === user?.id}
                    onDeleteForMe={handleDeleteForMe}
                    onDeleteForEveryone={handleDeleteForEveryone}
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
        <div className="px-8 py-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 shrink-0 z-20">
          {uploadingFiles && (
            <div className="mb-4 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {isBlocked ? (
            <div className="p-4 text-center text-red-500 bg-red-100/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-900/50 rounded-2xl font-bold animate-pulse-subtle">
              <p>Chat is disabled due to blockade</p>
            </div>
          ) : (
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUploadMenu(!showUploadMenu)}
                  className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary/10 rounded-2xl transition-all duration-200 shrink-0"
                >
                  <span className="material-symbols-outlined text-[24px]">
                    add
                  </span>
                </button>

                {showUploadMenu && (
                  <div
                    ref={uploadMenuRef}
                    className="absolute bottom-16 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 py-2 min-w-[180px] animate-slide-up"
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
                      className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors text-slate-700 dark:text-slate-300 font-bold"
                    >
                      <span className="material-symbols-outlined text-primary">
                        image
                      </span>
                      <span className="text-sm">Images</span>
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
                      className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors text-slate-700 dark:text-slate-300 font-bold"
                    >
                      <span className="material-symbols-outlined text-secondary">
                        description
                      </span>
                      <span className="text-sm">Files</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 relative group">
                <input
                  className="w-full pl-6 pr-14 py-2 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-500 border-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 font-medium text-xs h-9"
                  placeholder="Type a message..."
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-accent transition-colors rounded-xl hover:bg-accent/10"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    sentiment_satisfied
                  </span>
                </button>
                <div className="absolute right-0 bottom-full mb-4">
                  <EmojiPicker
                    isOpen={showEmojiPicker}
                    onClose={() => setShowEmojiPicker(false)}
                    onEmojiSelect={(emoji) => {
                      setInputValue((prev) => prev + emoji);
                    }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() || uploadingFiles}
                className="w-9 h-9 flex items-center justify-center text-white bg-primary rounded-xl disabled:opacity-30 hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all duration-200 shrink-0 transform active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">
                  send
                </span>
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
