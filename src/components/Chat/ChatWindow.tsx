import React, { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import attachmentApi from "../../api/attachment.api";
import blockApi from "../../api/block.api";
import { conversationApi } from "../../api/conversation.api";
import { messageApi } from "../../api/message.api";
import { useAuth } from "../../hooks/useAuth";
import { useCallIntegration } from "../../hooks/useCallIntegration";
import { useChat } from "../../hooks/useChat";
import { useSignalR } from "../../hooks/useSignalR";
import "../../styles/chat.css";
import {
  CallType,
  Conversation,
  ConversationType,
  MessageType,
  StatusUser,
} from "../../types";
import { Message, Reaction } from "../../types/message.types";
import {
  SIGNALR_HUB_URL_CALL,
  SIGNALR_HUB_URL_CHAT,
  TYPING_TIMEOUT,
} from "../../utils/constants";
import { formatLastActive, getAvatarUrl } from "../../utils/helpers";
import AudioCallWindow from "../Call/AudioCallWindow";
import CallModal from "../Call/CallModal";
import GroupCallWindow from "../Call/GroupCallWindow";
import IncomingCallModal from "../Call/IncomingCallModal";
import VideoCallWindow from "../Call/VideoCallWindow";
import { AddMembersModal } from "./AddMembersModal";
import ChatHeader from "./ChatHeader";
import ChatSearchPanel from "./ChatSearchPanel";
import ContactInfoSidebar from "./ContactInfoSidebar";
import ReportModal from "./ReportModal";
import { ForwardMessageModal } from "./ForwardMessageModal";
import { GroupMembersModal } from "./GroupMembersModal";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import PollCreationModal from "../CreatePoll/PollCreationModal";
import PinnedHeader from "./PinnedHeader";

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
    typingUsers,
    setConversations,
    setCurrentConversation,
    pinnedMessages,
    setPinnedMessages,
    fetchPinnedMessages,
    addReaction,
    drafts,
    setDraft,
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
    SIGNALR_HUB_URL_CHAT as string,
  );
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGiphyPicker, setShowGiphyPicker] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showContactSidebar, setShowContactSidebar] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockerId, setBlockerId] = useState<number | undefined>(undefined);
  const [chatWallpaper, setChatWallpaper] = useState(
    localStorage.getItem("chat-wallpaper") || "default",
  );
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(
    null,
  );
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [forwardingLoading, setForwardingLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetUser, setReportTargetUser] = useState<{
    id: number;
    displayName: string;
  } | null>(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selfDestructAfterSeconds, setSelfDestructAfterSeconds] = useState<
    number | null
  >(null);
  const [mentionedUserIds, setMentionedUserIds] = useState<number[]>([]);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Search states
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [currentSearchResultIndex, setCurrentSearchResultIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Pinned messages index
  const [currentPinnedIndex, setCurrentPinnedIndex] = useState(0);

  // Jump to bottom state
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync local inputValue with draft whenever it changes globally (e.g. from other components)
    // or when the conversation changes
    const currentDraft = drafts[conversation.id] || "";
    if (inputValue !== currentDraft) {
      setInputValue(currentDraft);
    }
  }, [conversation.id]);

  // Update global draft when local input changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (conversation.id) {
        setDraft(conversation.id, inputValue);
      }
    }, 300); // Debounce to avoid too many context updates

    return () => clearTimeout(timeoutId);
  }, [inputValue, conversation.id, setDraft]);

  useEffect(() => {
    if (conversation?.id) {
      fetchPinnedMessages(conversation.id);
    }
  }, [conversation?.id, fetchPinnedMessages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!conversation?.id) return;
    setLoading(true);
    try {
      const data = await messageApi.getConversationMessages(
        conversation.id,
        1,
        50,
      );
      // Reverse to get [oldest -> newest] for bottom-up display
      setMessages([...data].reverse());
      setPage(1);
      setHasMore(data.length === 50);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  }, [conversation?.id, setMessages, scrollToBottom]);

  const loadMoreMessages = useCallback(async () => {
    if (!conversation?.id || loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await messageApi.getConversationMessages(
        conversation.id,
        nextPage,
        50,
      );
      if (data.length > 0) {
        // Reverse new batch and prepend to existing messages
        const reversedNewData = [...data].reverse();
        setMessages((prev) => [...reversedNewData, ...prev]);
        setPage(nextPage);
        setHasMore(data.length === 50);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more messages:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [conversation?.id, page, hasMore, loadingMore, setMessages]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || !conversation?.id) {
      setSearchResults([]);
      return;
    }

    setIsSearchLoading(true);
    try {
      const results = await messageApi.searchMessages(conversation.id, query);
      setSearchResults(results);
      setCurrentSearchResultIndex(0); // Reset to first result
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const scrollToMessage = useCallback((messageId: number) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      el.classList.add("highlight-message");
      setTimeout(() => el.classList.remove("highlight-message"), 2000);
    } else {
      // If message not in DOM, we might need to load it (advanced feature)
      toast.error("Message not found in local view");
    }
  }, []);

  const handleJumpToMessage = (messageId: number) => {
    scrollToMessage(messageId);
  };

  const handleUnpinMessage = async (messageId: number) => {
    try {
      await messageApi.togglePin(messageId);
      // Update local state
      setPinnedMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("Message unpinned");
    } catch (err) {
      toast.error("Failed to unpin message");
      console.error(err);
    }
  };

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
        user?.id || 0,
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
          const { isBlocked, blockerId } = await blockApi.isUserBlockedMutual(
            user?.id || 0,
            otherMember.id,
          );
          setIsBlocked(isBlocked);
          setBlockerId(blockerId);
        } catch (err) {
          console.error("Error checking block status:", err);
        }
      } else {
        setIsBlocked(false);
        setBlockerId(undefined);
      }
    };

    checkBlockStatus();
  }, [conversation, user?.id]);

  useEffect(() => {
    if (conversation.id) {
      loadMessages();
    }
  }, [conversation.id, loadMessages]);

  // Join conversation via SignalR
  useEffect(() => {
    const joinConversation = async () => {
      if (user?.id && conversation?.id) {
        const convId = conversation.id;

        try {
          await invoke("JoinConversation", convId, user?.id);
          console.log("Joined conversation successfully");
        } catch (err) {
          console.error("Failed to join conversation:", err);
        }
      }
    };

    joinConversation();
  }, [user?.id, conversation?.id, invoke]);

  // Listeners moved to useSignalRHandlers

  useEffect(() => {
    // small delay to ensure DOM painted
    const t = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(t);
  }, [messages.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowJumpToBottom(!isAtBottom);
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
      if (editingMessage) {
        await invoke(
          "EditMessage",
          editingMessage.id,
          conversation.id,
          inputValue.trim(),
          user?.id,
        );
        setEditingMessage(null);
      } else {
        const content = inputValue.trim();
        const clientGeneratedId = `opt-${Date.now()}-${Math.random()}`;

        // Optimistic Add
        const optimisticMessage: Message = {
          id: -Date.now(), // Temp negative ID
          conversationId: conversation.id,
          senderId: user?.id || 0,
          sender: user as any,
          content: content,
          messageType: MessageType.Text,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDeleted: false,
          isDeletedForMe: false,
          isPinned: false,
          reactions: [],
          attachments: [],
          isOptimistic: true,
          clientGeneratedId: clientGeneratedId,
        };

        addMessage(optimisticMessage);
        scrollToBottom();

        await invoke(
          "SendMessage",
          conversation.id,
          user?.id,
          content,
          MessageType.Text,
          replyingTo?.id,
          scheduledAt ? new Date(scheduledAt).toISOString() : null,
          mentionedUserIds,
          selfDestructAfterSeconds,
        );
      }
      setInputValue("");
      setReplyingTo(null);
      setScheduledAt(null);
      setSelfDestructAfterSeconds(null);
      setMentionedUserIds([]);
      setShowDateTimePicker(false);
      invoke("StopTyping", conversation.id, user?.id);
      if (reloadConversations) {
        await reloadConversations();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleGifSelect = async (gif: any) => {
    if (!user || !conversation) return;

    try {
      const gifUrl = gif.images.fixed_height.url;
      await invoke(
        "SendMessage",
        conversation.id,
        user?.id,
        gifUrl,
        MessageType.Image, // Treat GIFs as images for rendering
        replyingTo?.id,
      );
      setShowGiphyPicker(false);
      setReplyingTo(null);
      if (reloadConversations) {
        await reloadConversations();
      }
    } catch (err) {
      console.error("Failed to send GIF:", err);
      toast.error("Failed to send GIF");
    }
  };

  const handlePinMessage = async (messageId: number) => {
    try {
      await invoke("PinMessage", messageId, conversation.id, user?.id);
    } catch (err) {
      console.error("Failed to pin message:", err);
      toast.error("Không thể ghim tin nhắn");
    }
  };

  const handleForwardMessage = async (targetConversationIds: number[]) => {
    if (!forwardingMessage || !user?.id) return;
    setForwardingLoading(true);
    try {
      for (const targetId of targetConversationIds) {
        await invoke(
          "ForwardMessage",
          forwardingMessage.id,
          targetId,
          user?.id,
        );
      }
      toast.success(
        `Đã chuyển tiếp tới ${targetConversationIds.length} cuộc trò chuyện`,
      );
      setForwardingMessage(null);
    } catch (err) {
      console.error("Forward error:", err);
      toast.error("Có lỗi xảy ra khi chuyển tiếp");
    } finally {
      setForwardingLoading(false);
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
      prev.filter((conv: any) => conv.id !== conversation.id),
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
        f.type.startsWith("image/"),
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
          50,
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([audioBlob], `voice_message_${Date.now()}.webm`, {
          type: "audio/webm",
        });

        // Upload voice message
        await handleVoiceUpload(file);

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      toast.error("Không thể truy cập micro");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.onstop = null; // Prevent upload
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      toast.error("Đã hủy ghi âm");
    }
  };

  const handleVoiceUpload = async (file: File) => {
    const conversationIdAtStart = conversation.id;
    const userIdAtStart = user?.id;
    if (!userIdAtStart) return;

    setUploadingFiles(true);
    try {
      const sentMessage = await messageApi.sendMessage({
        conversationId: conversationIdAtStart,
        senderId: userIdAtStart,
        content: "[Voice Message]",
        messageType: MessageType.Voice,
      });

      if (sentMessage.id) {
        await attachmentApi.uploadAttachment(file, sentMessage.id.toString());

        const updatedMessages = await messageApi.getConversationMessages(
          conversationIdAtStart,
          1,
          50,
        );
        setMessages([...updatedMessages].reverse());
      }
    } catch (err) {
      console.error("Failed to upload voice message:", err);
      toast.error("Lỗi khi gửi tin nhắn thoại");
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDeleteForMe = async (messageId: number) => {
    try {
      await messageApi.deleteMessageForMe(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isDeletedForMe: true, content: null, attachments: [] }
            : m,
        ),
      );

      // Update conversation list preview
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== conversation.id) return conv;
          return {
            ...conv,
            lastMessage:
              conv.lastMessage?.id === messageId
                ? {
                    ...conv.lastMessage,
                    isDeletedForMe: true,
                    content: null,
                    attachments: [],
                  }
                : conv.lastMessage,
            messages: conv.messages.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    isDeletedForMe: true,
                    content: null,
                    attachments: [],
                  }
                : msg,
            ),
          };
        }),
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
      toast.success("Đã xóa tin nhắn");
    } catch (err) {
      console.error("Failed to recall message:", err);
      toast.error("Không thể xóa tin nhắn");
    }
  };

  const handleReportMessage = (msg: Message) => {
    if (msg.sender) {
      setReportTargetUser({
        id: msg.senderId,
        displayName: msg.sender.displayName,
      });
      setShowReportModal(true);
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
          CallType.Audio,
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
          CallType.Video,
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

        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUser={reportTargetUser || undefined}
          conversationId={conversation?.id}
        />

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

        <ChatHeader
          conversation={{ ...conversation, currentUserId: user?.id } as any}
          isBlocked={isBlocked}
          isSearching={isSearching}
          setIsSearching={setIsSearching}
          setShowGroupMembers={setShowGroupMembers}
          setShowContactSidebar={setShowContactSidebar}
          showContactSidebar={showContactSidebar}
          onStartVideoCall={handleStartVideoCall}
          onStartAudioCall={handleStartAudioCall}
        />

        <PinnedHeader
          pinnedMessages={pinnedMessages}
          onJumpToMessage={handleJumpToMessage}
          onUnpin={handleUnpinMessage}
        />

        <MessageList
          messages={messages}
          user={user}
          loading={loading}
          conversation={conversation}
          typingUsers={typingUsers}
          scrollRef={scrollRef}
          messagesEndRef={messagesEndRef}
          handleScroll={handleScroll}
          getWallpaperStyle={getWallpaperStyle}
          handleDeleteForMe={handleDeleteForMe}
          handleDeleteForEveryone={handleDeleteForEveryone}
          handleAddReaction={async (messageId, emoji) => {
            if (!user) return;

            // Optimistic Add Reaction
            const optimisticReaction: Reaction = {
              id: -Date.now(), // Temp negative ID
              messageId: messageId,
              userId: user?.id || 0,
              username: user.displayName,
              emojiType: emoji,
              isOptimistic: true,
            };
            addReaction(messageId, optimisticReaction);

            try {
              await invoke(
                "AddReaction",
                messageId,
                conversation.id,
                user?.id,
                emoji,
                user.displayName,
              );
            } catch (err) {
              console.error("Failed to add reaction:", err);
              toast.error("Failed to add reaction");
              // Error handling: removing the optimistic reaction would be complex
              // but usually SignalR handles retries or we just let it be for now.
            }
          }}
          setReplyingTo={setReplyingTo}
          handlePinMessage={handlePinMessage}
          setForwardingMessage={setForwardingMessage}
          setEditingMessage={setEditingMessage}
          setInputValue={setInputValue}
          onReportMessage={handleReportMessage}
          scrollToBottom={scrollToBottom}
          loadMoreMessages={loadMoreMessages}
          hasMore={hasMore}
          loadingMore={loadingMore}
        />

        {showJumpToBottom && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-32 right-12 z-50 size-10 flex items-center justify-center rounded-full bg-primary text-white shadow-premium animate-bounce-slow hover:scale-110 active:scale-95 transition-all"
            title="Cuộn xuống dưới cùng"
          >
            <span className="material-symbols-outlined text-xl font-black">
              keyboard_double_arrow_down
            </span>
          </button>
        )}

        {isSearching && (
          <ChatSearchPanel
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            isSearchLoading={isSearchLoading}
            searchResults={searchResults}
            setIsSearching={setIsSearching}
            currentResultIndex={currentSearchResultIndex}
            setCurrentResultIndex={setCurrentSearchResultIndex}
            scrollToMessage={scrollToMessage}
          />
        )}

        {/* Reply Preview */}
        {replyingTo && (
          <div className="px-8 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 animate-slide-up flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-1 bg-primary h-10 rounded-full" />
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-bold text-primary">
                  Đang trả lời {replyingTo.sender.displayName}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {replyingTo.content || "Tin nhắn"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}

        {/* Editing Preview */}
        {editingMessage && (
          <div className="px-8 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-900/30 animate-slide-up flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-1 bg-amber-500 h-10 rounded-full" />
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-500">
                  Đang chỉnh sửa tin nhắn
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {editingMessage.content}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingMessage(null);
                setInputValue("");
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-600 transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}

        <MessageInput
          inputValue={inputValue}
          handleInputChange={handleInputChange}
          handleSendMessage={handleSendMessage}
          isBlocked={isBlocked}
          uploadingFiles={uploadingFiles}
          uploadProgress={uploadProgress}
          showUploadMenu={showUploadMenu}
          setShowUploadMenu={setShowUploadMenu}
          fileInputRef={fileInputRef}
          handleFileInput={handleFileInput}
          isRecording={isRecording}
          recordingTime={recordingTime}
          startRecording={startRecording}
          stopRecording={stopRecording}
          cancelRecording={cancelRecording}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          setInputValue={setInputValue}
          uploadMenuRef={uploadMenuRef}
          showGiphyPicker={showGiphyPicker}
          setShowGiphyPicker={setShowGiphyPicker}
          onGifSelect={handleGifSelect}
          blockerId={blockerId}
          currentUserId={user?.id}
          conversationId={conversation?.id}
          onOpenPollModal={() => setShowPollModal(true)}
          scheduledAt={scheduledAt}
          setScheduledAt={setScheduledAt}
          showDateTimePicker={showDateTimePicker}
          setShowDateTimePicker={setShowDateTimePicker}
          members={conversation.members.map((m) => ({
            id: m.id,
            displayName: m.displayName,
            avatar: m.avatar,
          }))}
          onMentionSelect={(userId) =>
            setMentionedUserIds((prev) => [...prev, userId])
          }
          isGroup={conversation.conversationType === ConversationType.Group}
          selfDestructAfterSeconds={selfDestructAfterSeconds}
          setSelfDestructAfterSeconds={setSelfDestructAfterSeconds}
        />
      </div>

      <PollCreationModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        conversationId={conversation.id}
      />

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
      {/* Forward Message Modal */}
      {user?.id && (
        <ForwardMessageModal
          visible={!!forwardingMessage}
          onCancel={() => setForwardingMessage(null)}
          onForward={handleForwardMessage}
          userId={user?.id || 0}
          loading={forwardingLoading}
        />
      )}
    </div>
  );
};

export default ChatWindow;
