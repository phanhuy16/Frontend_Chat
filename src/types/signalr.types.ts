import { MessageType } from "./enums";

export interface ChatMessage {
  messageId: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  content: string;
  messageType: MessageType;
  createdAt: string;
}

export interface UserStatusUpdate {
  userId: number;
  username: string;
  status: string;
}

export interface TypingIndicator {
  conversationId: number;
  userId: number;
  username: string;
}

export interface ReactionUpdate {
  messageId: number;
  userId: number;
  username: string;
  emoji: string;
  action: 'add' | 'remove';
}
