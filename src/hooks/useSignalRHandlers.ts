import { useEffect, useRef } from "react";
import { useChat } from "./useChat";
import { useSignalR } from "./useSignalR";
import { useAuth } from "./useAuth";
import { Message, MessageType, Reaction } from "../types/message.types";
import { Conversation } from "../types/conversation.types";
import { SIGNALR_HUB_URL_CHAT } from "../utils/constants";
import toast from "react-hot-toast";

export const useSignalRHandlers = () => {
  const { user } = useAuth();
  const {
    addMessage,
    updateMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    setMessages,
    addTypingUser,
    removeTypingUser,
    updateConversation,
    setConversations,
    currentConversation,
    setCurrentConversation,
    fetchPinnedMessages,
  } = useChat();

  const { on, off, invoke, isConnected } = useSignalR(SIGNALR_HUB_URL_CHAT as string);
  const listenerSetupRef = useRef<boolean>(false);

  // Helper to normalize message data from SignalR
  const normalizeMessage = (data: any): Message => {
    return {
      id: data.messageId ?? data.MessageId,
      conversationId: data.conversationId ?? data.ConversationId,
      senderId: data.senderId ?? data.SenderId,
      sender: {
        id: data.senderId ?? data.SenderId,
        displayName: data.senderName ?? data.SenderName,
        avatar: data.senderAvatar ?? data.SenderAvatar,
      } as any,
      content: data.content ?? data.Content,
      messageType: data.messageType ?? data.MessageType,
      createdAt: data.createdAt ?? data.CreatedAt,
      updatedAt: data.createdAt ?? data.CreatedAt,
      isDeleted: data.isDeleted ?? data.IsDeleted ?? false,
      isDeletedForMe: data.isDeletedForMe ?? data.IsDeletedForMe ?? false,
      isPinned: data.isPinned ?? data.IsPinned ?? false,
      parentMessageId: data.parentMessageId ?? data.ParentMessageId,
      parentMessage: data.parentMessage ?? data.ParentMessage,
      reactions: [],
      attachments: data.attachments ?? data.Attachments ?? [],
      readCount: data.readCount ?? data.ReadCount ?? 0,
    };
  };

  useEffect(() => {
    if (!isConnected || listenerSetupRef.current) return;
    listenerSetupRef.current = true;

    // --- Message Events ---

    on("ReceiveMessage", (data: any) => {
      const message = normalizeMessage(data);

      // Update message list if it's the current conversation
      if (currentConversation?.id === message.conversationId) {
        addMessage(message);
        // Mark as read if not from current user
        if (message.senderId !== user?.id) {
          invoke("MarkAsRead", message.conversationId, message.id, user?.id);
        }
      }

      // Update conversation preview in the list
      updateConversation(message.conversationId, {
        lastMessage: message,
        // Unread count is usually handled by the backend or separate logic, 
        // but we can increment it locally if not current conversation
        unreadCount: currentConversation?.id === message.conversationId ? 0 : undefined
      });
    });

    on("MessageRead", (data: any) => {
      const messageId = data.messageId ?? data.MessageId;
      const conversationId = data.conversationId ?? data.ConversationId;
      if (currentConversation?.id === conversationId) {
        updateMessage(messageId, { readCount: (data.readCount ?? data.ReadCount ?? 1) });
      }
    });

    on("MessageDeleted", (data: any) => {
      const messageId = data.messageId ?? data.MessageId;
      const conversationId = data.conversationId ?? data.ConversationId;
      if (currentConversation?.id === conversationId) {
        updateMessage(messageId, { isDeleted: true, content: null, attachments: [] });
      }
    });

    on("MessageEdited", (data: any) => {
      const messageId = data.messageId ?? data.MessageId;
      const newContent = data.newContent ?? data.NewContent;
      const conversationId = data.conversationId ?? data.ConversationId;
      if (currentConversation?.id === conversationId) {
        updateMessage(messageId, { content: newContent, isModified: true });
      }
    });

    on("MessagePinnedStatusChanged", (data: any) => {
      const messageId = typeof data === 'number' ? data : (data.messageId ?? data.MessageId);
      updateMessage(messageId, { isPinned: data.isPinned ?? data.IsPinned ?? true });
      if (currentConversation?.id) {
        fetchPinnedMessages(currentConversation.id);
      }
    });

    // --- Reaction Events ---

    on("ReactionAdded", (data: any) => {
      const messageId = data.messageId ?? data.MessageId;
      const conversationId = data.conversationId ?? data.ConversationId;
      if (currentConversation?.id === conversationId) {
        const newReaction: Reaction = {
          id: data.id ?? Math.random(),
          userId: data.userId ?? data.UserId,
          username: data.username ?? data.Username,
          emojiType: data.emoji ?? data.Emoji,
          messageId: messageId,
        };
        addReaction(messageId, newReaction);
      }
    });

    on("ReactionRemoved", (data: any) => {
      const messageId = data.messageId ?? data.MessageId;
      const userId = data.userId ?? data.UserId;
      const conversationId = data.conversationId ?? data.ConversationId;
      if (currentConversation?.id === conversationId) {
        removeReaction(messageId, userId);
      }
    });

    // --- Typing Events ---

    on("UserTyping", (data: any) => {
      const conversationId = data.conversationId ?? data.ConversationId;
      const userId = data.userId ?? data.UserId;
      addTypingUser(userId, conversationId);
    });

    on("UserStoppedTyping", (data: any) => {
      const conversationId = data.conversationId ?? data.ConversationId;
      const userId = typeof data === 'number' ? data : (data.userId ?? data.UserId);
      if (conversationId) {
        removeTypingUser(userId, conversationId);
      } else if (currentConversation?.id) {
        // Fallback if backend doesn't send conversationId on stop typing
        removeTypingUser(userId, currentConversation.id);
      }
    });

    // --- Conversation Lifecycle Events ---

    on("NewConversationCreated", (data: any) => {
      // Refresh conversations list
      // In a real app, we might want to fetch just the new one
      // For now, we rely on the component to trigger a reload or provide a refresh method
    });

    on("AddedToConversation", (data: any) => {
      toast.success("You were added to a new conversation!");
    });

    on("RemovedFromConversation", (data: any) => {
      const conversationId = data.conversationId ?? data.ConversationId;
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        toast.error("You have been removed from this conversation");
      }
    });

    on("ConversationPinStatusChanged", (data: any) => {
      const conversationId = data.conversationId ?? data.ConversationId;
      const isPinned = data.isPinned ?? data.IsPinned;
      updateConversation(conversationId, { isPinned });
    });

    // --- System Events ---

    on("Error", (errorMessage: string) => {
      console.error("SignalR Hub Error:", errorMessage);
      toast.error(errorMessage);
    });

    return () => {
      off("ReceiveMessage");
      off("MessageRead");
      off("MessageDeleted");
      off("MessageEdited");
      off("MessagePinnedStatusChanged");
      off("ReactionAdded");
      off("ReactionRemoved");
      off("UserTyping");
      off("UserStoppedTyping");
      off("NewConversationCreated");
      off("AddedToConversation");
      off("RemovedFromConversation");
      off("ConversationPinStatusChanged");
      off("Error");
      listenerSetupRef.current = false;
    };
  }, [isConnected, currentConversation?.id, user?.id]);

  return { isConnected };
};
