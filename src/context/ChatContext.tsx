import React, { createContext, useCallback, useState } from "react";
import { Conversation } from "../types/conversation.types";
import { Message } from "../types/message.types";

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  typingUsers: Set<number>;
  onlineUsers: any[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  setCurrentConversation: React.Dispatch<
    React.SetStateAction<Conversation | null>
  >;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: number, updates: Partial<Message>) => void;
  deleteMessage: (messageId: number) => void;
  setTypingUsers: (users: Set<number>) => void;
  setOnlineUsers: (users: any[]) => void;
  addTypingUser: (userId: number) => void;
  removeTypingUser: (userId: number) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined
);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      const messageExists = prev.some((m) => m.id === message.id);

      if (messageExists) {
        return prev;
      }

      const updated = [...prev, message];
      return updated;
    });
  }, []);

  const updateMessage = useCallback(
    (messageId: number, updates: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))
      );
    },
    []
  );

  const deleteMessage = useCallback((messageId: number) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  const addTypingUser = useCallback((userId: number) => {
    setTypingUsers((prev) => new Set(prev).add(userId));
  }, []);

  const removeTypingUser = useCallback((userId: number) => {
    setTypingUsers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        typingUsers,
        onlineUsers,
        setConversations,
        setCurrentConversation,
        setMessages,
        addMessage,
        updateMessage,
        deleteMessage,
        setTypingUsers,
        setOnlineUsers,
        addTypingUser,
        removeTypingUser,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
