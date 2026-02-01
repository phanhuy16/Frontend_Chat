import { useEffect, useRef } from "react";
import { useChat } from "./useChat";
import { useSignalR } from "./useSignalR";
import { useAuth } from "./useAuth";
import { Message, MessageType, Reaction } from "../types/message.types";
import { Conversation } from "../types/conversation.types";
import { StatusUser } from "../types";
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
      mentionedUsers: data.mentionedUsers ?? data.MentionedUsers ?? [],
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
        // Ensure messages array is also updated if we're using it as fallback
        messages: [message],
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

      // Update current message list if relevant
      if (currentConversation?.id === conversationId) {
        updateMessage(messageId, { isDeleted: true, content: null, attachments: [] });
      }

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== conversationId) return conv;

          const isLastMessage = conv.lastMessage?.id === messageId;
          const updatedLastMessage = isLastMessage && conv.lastMessage
            ? { ...conv.lastMessage, isDeleted: true, content: null, attachments: [] }
            : conv.lastMessage;

          // Ensure we update lastMessage even if messages array update is redundant

          // Also update the messages array for consistency
          const updatedMessages = conv.messages.map((msg: Message) =>
            msg.id === messageId
              ? { ...msg, isDeleted: true, content: null, attachments: [] }
              : msg,
          );

          return {
            ...conv,
            messages: updatedMessages,
            lastMessage: updatedLastMessage
          };
        }),
      );

    });

    on("MessageEdited", (data: any) => {
      const messageId = data.messageId ?? data.MessageId;
      const newContent = data.newContent ?? data.NewContent;
      const conversationId = data.conversationId ?? data.ConversationId;

      // Update current message list if relevant
      if (currentConversation?.id === conversationId) {
        updateMessage(messageId, { content: newContent, isModified: true });
      }

      // Update conversation list preview
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== conversationId) return conv;

          const updatedMessages = conv.messages.map((msg: Message) =>
            msg.id === messageId
              ? { ...msg, content: newContent, isModified: true }
              : msg,
          );

          const isLastMessage = conv.lastMessage?.id === messageId;
          const updatedLastMessage = isLastMessage && conv.lastMessage
            ? { ...conv.lastMessage, content: newContent, isModified: true }
            : conv.lastMessage;

          return {
            ...conv,
            messages: updatedMessages,
            lastMessage: updatedLastMessage
          };
        }),
      );
    });

    on("MessagePinnedStatusChanged", (data: any) => {
      const messageId = typeof data === 'number' ? data : (data.messageId ?? data.MessageId);
      updateMessage(messageId, { isPinned: data.isPinned ?? data.IsPinned ?? true });
      if (currentConversation?.id) {
        fetchPinnedMessages(currentConversation.id);
      }
    });

    on("MessageScheduled", (data: any) => {
      const scheduledAt = data.scheduledAt ?? data.ScheduledAt;
      if (scheduledAt) {
        toast.success(`Message scheduled for ${new Date(scheduledAt).toLocaleString()}`, {
          icon: '⏰',
          duration: 4000
        });
      }
    });

    on("UserMentioned", (data: any) => {
      const senderName = data.senderName ?? data.SenderName;
      const content = data.content ?? data.Content;

      toast(`You were mentioned by ${senderName}: "${content}"`, {
        icon: '🔔',
        duration: 5000,
        position: 'top-right'
      });
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

    // --- Presence Events ---

    on("UserJoined", (data: any) => {
      const userId = data.userId ?? data.UserId;
      const status = data.status ?? data.Status;
      console.log(`User ${userId} joined, status: ${status}`);

      // Update this user in all conversations they belong to
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.members.some((m) => m.id === userId)) {
            return {
              ...conv,
              members: conv.members.map((m) =>
                m.id === userId ? { ...m, status: status, lastActiveAt: new Date().toISOString() } : m
              ),
            };
          }
          return conv;
        })
      );

      if (currentConversation?.members.some((m) => m.id === userId)) {
        setCurrentConversation((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            members: prev.members.map((m) =>
              m.id === userId ? { ...m, status: status, lastActiveAt: new Date().toISOString() } : m
            ),
          };
        });
      }
    });

    on("UserLeft", (data: any) => {
      const userId = data.userId ?? data.UserId;
      console.log(`User ${userId} left`);

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.members.some((m) => m.id === userId)) {
            return {
              ...conv,
              members: conv.members.map((m) =>
                m.id === userId ? { ...m, status: StatusUser.Offline, lastActiveAt: new Date().toISOString() } : m
              ),
            };
          }
          return conv;
        })
      );

      if (currentConversation?.members.some((m) => m.id === userId)) {
        setCurrentConversation((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            members: prev.members.map((m) =>
              m.id === userId ? { ...m, status: StatusUser.Offline, lastActiveAt: new Date().toISOString() } : m
            ),
          };
        });
      }
    });

    on("UserOnlineStatusChanged", (data: any) => {
      const userId = data.userId ?? data.UserId;
      const status = data.status ?? data.Status;
      console.log(`User ${userId} status changed to: ${status}`);

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.members.some((m) => m.id === userId)) {
            return {
              ...conv,
              members: conv.members.map((m) =>
                m.id === userId ? { ...m, status: status, lastActiveAt: new Date().toISOString() } : m
              ),
            };
          }
          return conv;
        })
      );

      if (currentConversation?.members.some((m) => m.id === userId)) {
        setCurrentConversation((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            members: prev.members.map((m) =>
              m.id === userId ? { ...m, status: status, lastActiveAt: new Date().toISOString() } : m
            ),
          };
        });
      }
    });

    // --- Conversation Lifecycle Events ---

    on("NewConversationCreated", (data: any) => {
      const conversation = data.conversation ?? data.Conversation;
      if (conversation) {
        setConversations((prev) => {
          if (prev.some((c) => c.id === conversation.id)) return prev;
          return [conversation, ...prev];
        });
      }
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

    on("ConversationArchiveStatusChanged", (data: any) => {
      const conversationId = data.conversationId ?? data.ConversationId;
      const isArchived = data.isArchived ?? data.IsArchived;
      updateConversation(conversationId, { isArchived });
    });

    on("PollUpdated", (data: any) => {
      // Find the message that contains this poll and update it
      // The backend returns the full PollDto in 'data'
      const poll = data;
      const pollId = poll.id ?? poll.Id;

      // Update the message in the current conversation
      setMessages((prev) =>
        prev.map(msg =>
          msg.poll?.id === pollId ? { ...msg, poll: poll } : msg
        )
      );
    });

    on("PermissionsUpdated", (data: any) => {
      const conversationId = data.conversationId ?? data.ConversationId;
      const permissions = data.permissions ?? data.Permissions;

      if (currentConversation && currentConversation.id === conversationId) {
        const updatedMembers = currentConversation.members.map(m =>
          m.id === user?.id ? { ...m, ...permissions } : m
        );
        updateConversation(conversationId, { members: updatedMembers });
      }

      toast.success("Quyền hạn của bạn đã được cập nhật bởi quản trị viên", {
        icon: '🛡️',
        duration: 4000
      });
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
      off("UserJoined");
      off("UserLeft");
      off("UserOnlineStatusChanged");
      off("NewConversationCreated");
      off("AddedToConversation");
      off("RemovedFromConversation");
      off("ConversationPinStatusChanged");
      off("ConversationArchiveStatusChanged");
      off("PollUpdated");
      off("MessageScheduled");
      off("UserMentioned");
      off("PermissionsUpdated");
      off("Error");
      listenerSetupRef.current = false;
    };
  }, [isConnected, currentConversation?.id, user?.id]);

  return { isConnected };
};
