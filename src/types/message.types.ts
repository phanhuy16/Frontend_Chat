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
  reactions: Reaction[];
  attachments: Attachment[];
  isDeleted: boolean;
  isDeletedForMe: boolean;
  isPinned: boolean;
  parentMessageId?: number;
  parentMessage?: Message;
  forwardedFromId?: number;
  isReadByMe?: boolean;
  readCount?: number;
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

export interface AttachmentDto {
  id: number;
  messageId: number;
  fileName: string;
  reactions: Reaction[];
  attachments: Attachment[];
  isDeleted: boolean;
  isDeletedForMe: boolean;
  isPinned: boolean;
  parentMessageId?: number;
  parentMessage?: Message;
}

export interface SendMessageRequest {
  conversationId: number;
  senderId: number;
  content: string;
  messageType: number;
  parentMessageId?: number;
}

export interface EditMessageRequest {
  content?: string | null;
}

export interface AddReactionRequest {
  userId: number;
  emoji: string;
}