import { MessageType } from "./enums";
import { User } from "./user.types";
import { Poll } from "./poll.types";
export { MessageType };

export interface Message {
  id: number;
  conversationId: number;
  sender: User;
  senderId: number;
  content?: string | null;
  messageType: MessageType;
  poll?: Poll;
  createdAt: string;
  updatedAt: string;
  reactions: Reaction[];
  attachments: Attachment[];
  isDeleted: boolean;
  isDeletedForMe: boolean;
  isPinned: boolean;
  isModified?: boolean;
  parentMessageId?: number;
  parentMessage?: Message;
  forwardedFromId?: number;
  isReadByMe?: boolean;
  readCount?: number;
  clientGeneratedId?: string;
  isOptimistic?: boolean;
  scheduledAt?: string | null;
  mentionedUsers?: User[];
  // Self-destructing message fields
  selfDestructAfterSeconds?: number | null;
  viewedAt?: string | null;
  expiresAt?: string | null;
}

export interface Reaction {
  id: number;
  messageId?: number;
  userId: number;
  username: string;
  emojiType: string;
  createdAt?: string;
  clientGeneratedId?: string;
  isOptimistic?: boolean;
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
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

export interface SendMessageRequest {
  conversationId: number;
  senderId: number;
  content: string;
  messageType: number;
  parentMessageId?: number;
  scheduledAt?: string | null;
  mentionedUserIds?: number[];
  selfDestructAfterSeconds?: number | null;
}

export interface EditMessageRequest {
  content?: string | null;
  mentionedUserIds?: number[];
}

export interface AddReactionRequest {
  userId: number;
  emoji: string;
}

export interface MessageReader {
  userId: number;
  displayName: string;
  avatar: string;
  readAt: string;
}