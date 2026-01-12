import { ConversationRole, ConversationType } from "./enums";
import { Message } from "./message.types";
import { User } from "./user.types";

export interface Conversation {
  id: number;
  conversationType: ConversationType;
  groupName?: string;
  members: User[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
}

export interface ConversationMember {
  id: number;
  conversationId: number;
  userId: number;
  role: ConversationRole;
  joinedAt: string;
  user?: User;
}

export interface CreateDirectConversationRequest {
  userId1: number;
  userId2: number;
}

export interface CreateGroupConversationRequest {
  groupName: string;
  createdBy: number;
  memberIds: number[];
}
