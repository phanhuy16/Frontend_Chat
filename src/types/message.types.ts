import { MessageType } from "./enums";
import { User } from "./user.types";

export interface Message {
  id: number;
  conversationId: number;
  sender: User;
  senderId: number;
  content?: string | null;
  messageType: MessageType;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  reactions: Reaction[];
  attachments: Attachment[];
}

export interface Reaction {
  id: number;
  messageId?: number;
  userId: number;
  username: string;
  emojiType: string;
  createdAt?: string;
}

export interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
}

export interface SendMessageRequest {
  conversationId: number;
  senderId: number;
  content?: string | null;
  messageType: MessageType;
}

export interface EditMessageRequest {
  content?: string | null;
}

export interface AddReactionRequest {
  userId: number;
  emoji: string;
}