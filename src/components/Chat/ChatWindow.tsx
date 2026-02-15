import { format, addHours, addDays, startOfHour } from "date-fns";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import attachmentApi from "../../api/attachment.api";
import blockApi from "../../api/block.api";
import { conversationApi } from "../../api/conversation.api";
import { messageApi } from "../../api/message.api";
import { userApi } from "../../api/user.api";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import { useSignalR } from "../../hooks/useSignalR";
import { useCallContext } from "../../context/CallContext";
import { useTheme } from "../../context/ThemeContext";
import "../../styles/chat.css";
import {
  CallType,
  Conversation,
  ConversationType,
  MessageType,
  StatusUser,
} from "../../types";
import { Message, Reaction, MessageReader } from "../../types/message.types";
import {
  SIGNALR_HUB_URL_CALL,
  SIGNALR_HUB_URL_CHAT,
  TYPING_TIMEOUT,
} from "../../utils/constants";
import { formatLastActive, getAvatarUrl } from "../../utils/helpers";
import { CHAT_WALLPAPERS } from "../../config/themes.config";
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
import LinkPreview from "../Message/LinkPreview";
import PinnedMessagesModal from "./PinnedMessagesModal";
import { generateSmartReplies } from "../../utils/ai";
import ReminderModal from "../Message/ReminderModal";

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
  onToggleSidebar?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onBack,
  onToggleSidebar,
}) => {
  const { user } = useAuth();
  const {
    conversations,
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

  const { t } = useTranslation();

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
  } = useCallContext();

  const { globalChatWallpaper } = useTheme();

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
    localStorage.getItem(`theme_${conversation.id}`) || globalChatWallpaper,
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
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedReminderMessage, setSelectedReminderMessage] =
    useState<Message | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [currentPinnedIndex, setCurrentPinnedIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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

  const isGroupAdmin = useMemo(() => {
    return conversation && user && conversation.createdBy === user.id;
  }, [conversation, user]);

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
      const savedTheme = localStorage.getItem(`theme_${conversation.id}`);
      if (savedTheme) {
        setChatWallpaper(savedTheme);
      } else {
        setChatWallpaper(globalChatWallpaper);
      }
    }
  }, [conversation?.id, globalChatWallpaper]);

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
      toast.error(t("common.error"));
    }
  }, []);

  // When messages update, generate smart replies if the last message is from someone else
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderId !== user?.id && lastMsg.content) {
        setSmartReplies(generateSmartReplies(lastMsg.content));
      } else {
        setSmartReplies([]);
      }
    }
  }, [messages, user?.id]);

  const handleSmartReplyClick = (reply: string) => {
    handleSendMessage_manual(reply);
    setSmartReplies([]);
  };

  const handleSendMessage_manual = async (content: string) => {
    if (!content.trim() || !conversation?.id || !user?.id) return;
    try {
      await messageApi.sendMessage({
        conversationId: conversation.id,
        senderId: user.id,
        content: content,
        messageType: MessageType.Text,
      });
    } catch (err) {
      console.error("Failed to send smart reply", err);
    }
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

  const handleSetReminder = (msg: Date) => {
    if (!selectedReminderMessage) return;

    const reminder = {
      id: Date.now(),
      messageId: selectedReminderMessage.id,
      content: selectedReminderMessage.content,
      remindAt: msg.getTime(),
      conversationId: conversation?.id,
    };

    // Store in localStorage for persistence
    const savedReminders = JSON.parse(
      localStorage.getItem("message_reminders") || "[]",
    );
    savedReminders.push(reminder);
    localStorage.setItem("message_reminders", JSON.stringify(savedReminders));

    // Schedule a local timeout if it's within 24h
    const delay = msg.getTime() - Date.now();
    if (delay > 0 && delay < 86400000) {
      setTimeout(() => {
        toast(`🔔 Reminder: ${reminder.content}`, {
          duration: 5000,
          icon: "⏰",
        });
      }, delay);
    }

    toast.success(`Reminder set for ${format(msg, "MMM d, HH:mm")}`);
    setShowReminderModal(false);
  };

  const getWallpaperStyle = () => {
    // 1. Try to find in explicit shared wallpapers
    const wallpaper = CHAT_WALLPAPERS.find((w) => w.id === chatWallpaper);
    if (wallpaper) {
      if (
        wallpaper.value.startsWith("linear") ||
        wallpaper.value.startsWith("radial")
      ) {
        return {
          background: wallpaper.value,
          backgroundSize: (wallpaper as any).size || "cover",
        };
      }
      return { backgroundColor: wallpaper.value };
    }

    // 2. Fallback for legacy values or specific names
    switch (chatWallpaper) {
      case "dark":
        return {
          backgroundColor: "#0f172a",
          backgroundImage:
            "radial-gradient(circle at top right, #1e293b, #0f172a)",
        };
      case "light":
        return {
          backgroundColor: "#f8fafc",
          backgroundImage: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        };
      case "custom":
        return {
          background:
            "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)",
        };
      case "default":
      default:
        return {
          backgroundColor: "transparent",
        };
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
      toast.error(t("chat.disabled_blocked"));
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
      toast.error(t("toast.upload_error"));
    }
  };

  const handlePinMessage = async (messageId: number) => {
    try {
      await invoke("PinMessage", messageId, conversation.id, user?.id);
    } catch (err) {
      console.error("Failed to pin message:", err);
      toast.error(t("common.error"));
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
        t("toast.uploaded_success", { count: targetConversationIds.length }),
      );
      setForwardingMessage(null);
    } catch (err) {
      console.error("Forward error:", err);
      toast.error(t("common.error"));
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
    toast.success(t("toast.delete_everyone_success"));
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (isBlocked) {
      toast.error(t("chat.disabled_blocked"));
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
          toast.error(t("toast.upload_error") + " " + file.name);
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
        toast.success(t("toast.uploaded_success", { count: successCount }));
      }
    } catch (err) {
      console.error("Failed to upload files:", err);
      toast.error(t("toast.upload_error"));
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
      toast.error(t("toast.error_mic"));
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

      // Stop all tracks in the stream if we have the reference
      if (mediaRecorder && mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }

      toast.error(t("toast.cancel_recording"));
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
        content: t("chat.voice_msg_text"),
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
      toast.error(t("toast.error_send_voice"));
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

      toast.success(t("toast.delete_for_me_success"));
    } catch (err) {
      console.error("Failed to delete message for me:", err);
      toast.error(t("common.error"));
    }
  };

  const handleDeleteForEveryone = async (messageId: number) => {
    try {
      await invoke("DeleteMessage", messageId, conversation.id, user?.id);
      // The local state will be updated via SignalR "MessageDeleted" event
      toast.success(t("toast.delete_everyone_success"));
    } catch (err) {
      console.error("Failed to recall message:", err);
      toast.error(t("common.error"));
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
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if we are actually leaving the window, not entering a child
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Handle file input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const handleAiClick = useCallback(async () => {
    try {
      const botConv = conversations.find(
        (c) =>
          c.conversationType === ConversationType.Direct &&
          c.members.some((m) => m.userName === "ai_bot"),
      );

      if (botConv) {
        setCurrentConversation(botConv);
        return;
      }

      const botUser = await userApi.getUserByUsername("ai_bot");
      if (botUser && user?.id) {
        const newConv = await conversationApi.createDirectConversation({
          userId1: user.id,
          userId2: botUser.id,
        });
        setConversations((prev) => {
          if (prev.some((c) => c.id === newConv.id)) return prev;
          return [newConv, ...prev];
        });
        setCurrentConversation(newConv);
      } else {
        toast.error("AI Bot not found");
      }
    } catch (error) {
      console.error("AI Bot Error", error);
      toast.error("Could not open AI Chat");
    }
  }, [conversations, user?.id, setConversations, setCurrentConversation]);

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
        return t("chat.online");
      }
      return formatLastActive(otherMember?.lastActiveAt, t);
    }
    return t("chat.members", { count: conversation.members.length });
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
        className="relative flex flex-1 flex-col h-full min-w-0"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drop Zone Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-primary/20 backdrop-blur-sm border-4 border-primary border-dashed rounded-3xl m-4 flex flex-col items-center justify-center animate-fade-in pointer-events-none">
            <div className="w-32 h-32 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-2xl mb-6">
              <span className="material-symbols-outlined text-6xl text-primary animate-bounce">
                cloud_upload
              </span>
            </div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-widest">
              {t("chat.drop_files")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
              {t("chat.drop_hint")}
            </p>
          </div>
        )}

        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUser={reportTargetUser || undefined}
          conversationId={conversation?.id}
        />

        <ChatHeader
          conversation={conversation}
          messages={messages}
          isBlocked={isBlocked}
          isSearching={isSearching}
          setIsSearching={setIsSearching}
          setShowGroupMembers={setShowGroupMembers}
          setShowContactSidebar={setShowContactSidebar}
          showContactSidebar={showContactSidebar}
          onStartVideoCall={handleStartVideoCall}
          onStartAudioCall={handleStartAudioCall}
          onBack={onBack}
          onToggleSidebar={onToggleSidebar}
        />

        <PinnedHeader
          pinnedMessages={pinnedMessages}
          onJumpToMessage={scrollToMessage}
          onUnpin={handlePinMessage}
          onViewAll={() => setShowPinnedModal(true)}
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
          onSetReminder={(msg) => {
            setSelectedReminderMessage(msg);
            setShowReminderModal(true);
          }}
          scrollToBottom={scrollToBottom}
          loadMoreMessages={loadMoreMessages}
          hasMore={hasMore}
          loadingMore={loadingMore}
        />

        {showJumpToBottom && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-32 right-12 z-50 size-10 flex items-center justify-center rounded-full bg-primary text-white shadow-premium animate-bounce-slow hover:scale-110 active:scale-95 transition-all"
            title={t("chat.scroll_bottom")}
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
                  {t("chat.replying")} {replyingTo.sender.displayName}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {replyingTo.content || t("chat.message_default")}
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
                  {t("chat.editing")}
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
          slowMode={conversation.slowMode}
          isAdmin={!!isGroupAdmin}
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
            userName: m.userName,
          }))}
          onMentionSelect={(userId) =>
            setMentionedUserIds((prev) => [...prev, userId])
          }
          isGroup={conversation.conversationType === ConversationType.Group}
          selfDestructAfterSeconds={selfDestructAfterSeconds}
          setSelfDestructAfterSeconds={setSelfDestructAfterSeconds}
          smartReplies={smartReplies}
          onSmartReplyClick={handleSmartReplyClick}
          onAiClick={handleAiClick}
        />
      </div>

      <PollCreationModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        conversationId={conversation.id}
      />

      {showPinnedModal && (
        <PinnedMessagesModal
          pinnedMessages={pinnedMessages}
          onClose={() => setShowPinnedModal(false)}
          onJumpToMessage={(id) => {
            scrollToMessage(id);
            setShowPinnedModal(false);
          }}
          onUnpin={(id) => {
            handlePinMessage(id);
            // Optimistically update pinnedModal messages if needed,
            // but handlePinMessage uses conversation.id which triggers a global refresh usually.
          }}
        />
      )}
      {/* Right side: Contact Info Sidebar */}
      <ContactInfoSidebar
        isOpen={showContactSidebar}
        onClose={() => setShowContactSidebar(false)}
        otherMember={getOtherMember()}
        conversation={conversation}
        messages={messages}
        onBlockChange={setIsBlocked}
        onStartAudioCall={handleStartAudioCall}
        onStartVideoCall={handleStartVideoCall}
        onThemeChange={(theme) => {
          setChatWallpaper(theme);
          if (conversation?.id) {
            localStorage.setItem(`theme_${conversation.id}`, theme);
          }
        }}
        onNotificationChange={(settings) => {
          // Handle notification settings change if needed
          console.log("Notification settings updated:", settings);
        }}
        onConversationUpdate={(updated) => {
          setCurrentConversation(updated);
          // Also update in the list
          setConversations((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c)),
          );
        }}
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

      <ReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        onConfirm={handleSetReminder}
        messageContent={
          selectedReminderMessage?.content || t("chat.attached_file")
        }
      />
    </div>
  );
};

export default ChatWindow;
