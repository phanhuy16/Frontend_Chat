import React, { createContext, useCallback, useState } from "react";
import { Conversation } from "../types/conversation.types";
import { Message, Reaction } from "../types/message.types";
import { messageApi } from "../api/message.api";

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  pinnedMessages: Message[];
  typingUsers: Set<number>;
  typingUsersByConversation: { [key: number]: Set<number> };
  onlineUsers: any[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  setCurrentConversation: React.Dispatch<
    React.SetStateAction<Conversation | null>
  >;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setPinnedMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  fetchPinnedMessages: (conversationId: number) => Promise<void>;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: number, updates: Partial<Message>) => void;
  deleteMessage: (messageId: number) => void;
  addReaction: (messageId: number, reaction: Reaction) => void;
  removeReaction: (messageId: number, userId: number) => void;
  setTypingUsers: (users: Set<number>) => void;
  setOnlineUsers: (users: any[]) => void;
  addTypingUser: (userId: number, conversationId: number) => void;
  removeTypingUser: (userId: number, conversationId: number) => void;
  updateConversation: (
    conversationId: number,
    updates: Partial<Conversation>,
  ) => void;
  drafts: { [key: number]: string };
  setDraft: (conversationId: number, draft: string) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined,
);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [typingUsersByConversation, setTypingUsersByConversation] = useState<{
    [key: number]: Set<number>;
  }>({});
  const [drafts, setDrafts] = useState<{ [key: number]: string }>({});

  const fetchPinnedMessages = useCallback(async (conversationId: number) => {
    try {
      const pinned = await messageApi.getPinnedMessages(conversationId);
      setPinnedMessages(pinned);
    } catch (err) {
      console.error("Failed to fetch pinned messages:", err);
    }
  }, []);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      // 1. Check if EXACT message already exists (by real database ID)
      const messageExists = prev.some((m) => m.id === message.id);
      if (messageExists) {
        return prev;
      }

      // 2. Optimistic Deduplication Heuristic
      // Search for an optimistic message that "looks like" this real message
      const optimisticMatchIndex = prev.findIndex(
        (m) =>
          m.isOptimistic &&
          m.senderId === message.senderId &&
          m.content === message.content &&
          // Within 30 seconds of each other
          Math.abs(
            new Date(m.createdAt).getTime() -
              new Date(message.createdAt).getTime(),
          ) < 30000,
      );

      if (optimisticMatchIndex !== -1) {
        // Replace optimistic message with real message
        const next = [...prev];
        next[optimisticMatchIndex] = message;
        return next;
      }

      // 3. Just add new message
      const updated = [...prev, message];
      return updated;
    });
  }, []);

  const updateMessage = useCallback(
    (messageId: number, updates: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg,
        ),
      );
    },
    [],
  );

  const deleteMessage = useCallback((messageId: number) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  const addReaction = useCallback((messageId: number, reaction: Reaction) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;

        // 1. Check if EXACT reaction exists (by userId and emojiType)
        const reactionExists = (msg.reactions || []).some(
          (r) =>
            r.userId === reaction.userId &&
            r.emojiType === reaction.emojiType &&
            !r.isOptimistic,
        );
        if (reactionExists) return msg;

        // 2. Optimistic Deduplication
        const optimisticMatchIndex = (msg.reactions || []).findIndex(
          (r) =>
            r.isOptimistic &&
            r.userId === reaction.userId &&
            r.emojiType === reaction.emojiType,
        );

        if (optimisticMatchIndex !== -1) {
          // Replace optimistic reaction with real reaction
          const newReactions = [...(msg.reactions || [])];
          newReactions[optimisticMatchIndex] = reaction;
          return { ...msg, reactions: newReactions };
        }

        // 3. Just add new reaction
        return { ...msg, reactions: [...(msg.reactions || []), reaction] };
      }),
    );
  }, []);

  const removeReaction = useCallback((messageId: number, userId: number) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: (msg.reactions || []).filter(
                (r) => r.userId !== userId,
              ),
            }
          : msg,
      ),
    );
  }, []);

  const addTypingUser = useCallback(
    (userId: number, conversationId: number) => {
      setTypingUsersByConversation((prev) => {
        const currentSet = prev[conversationId] || new Set();
        const newSet = new Set(currentSet).add(userId);
        return { ...prev, [conversationId]: newSet };
      });

      // Also update legacy typingUsers if it matches current conversation
      if (currentConversation?.id === conversationId) {
        setTypingUsers((prev) => new Set(prev).add(userId));
      }
    },
    [currentConversation?.id],
  );

  const removeTypingUser = useCallback(
    (userId: number, conversationId: number) => {
      setTypingUsersByConversation((prev) => {
        const currentSet = prev[conversationId];
        if (!currentSet) return prev;
        const newSet = new Set(currentSet);
        newSet.delete(userId);
        return { ...prev, [conversationId]: newSet };
      });

      if (currentConversation?.id === conversationId) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    },
    [currentConversation?.id],
  );

  const updateConversation = useCallback(
    (conversationId: number, updates: Partial<Conversation>) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, ...updates } : conv,
        ),
      );
      setCurrentConversation((prev) =>
        prev?.id === conversationId ? { ...prev, ...updates } : prev,
      );
    },
    [],
  );

  const setDraft = useCallback((conversationId: number, draft: string) => {
    setDrafts((prev) => ({
      ...prev,
      [conversationId]: draft,
    }));
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        pinnedMessages,
        typingUsers,
        typingUsersByConversation,
        onlineUsers,
        setConversations,
        setCurrentConversation,
        setMessages,
        setPinnedMessages,
        fetchPinnedMessages,
        addMessage,
        updateMessage,
        deleteMessage,
        addReaction,
        removeReaction,
        setTypingUsers,
        setOnlineUsers,
        addTypingUser,
        removeTypingUser,
        updateConversation,
        drafts,
        setDraft,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
