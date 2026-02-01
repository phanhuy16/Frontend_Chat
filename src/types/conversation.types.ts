import { ConversationRole, ConversationType, StatusUser } from "./enums";
import { Message } from "./message.types";
import { User } from "./user.types";

export interface Conversation {
  id: number;
  conversationType: ConversationType;
  groupName?: string;
  description?: string;
  members: ConversationMember[]; // Changed from User[]
  messages: Message[];
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isArchived?: boolean;
  createdBy: number;
  slowMode?: number; // in seconds
}

export interface MemberPermissions {
  canChangeGroupInfo: boolean;
  canAddMembers: boolean;
  canRemoveMembers: boolean;
  canDeleteMessages: boolean;
  canPinMessages: boolean;
  canChangePermissions: boolean;
}

export interface ConversationMember extends MemberPermissions {
  id: number;
  userName: string;
  displayName: string;
  avatar: string;
  role: string;
  status: StatusUser;
  lastActiveAt?: string;
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
