export interface SearchResultDto {
  messages: MessageSearchResultDto[];
  files: AttachmentSearchResultDto[];
  users: UserSearchResultDto[];
}

export interface MessageSearchResultDto {
  id: number;
  conversationId: number;
  conversationName: string | null;
  conversationAvatar: string | null;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  content: string | null;
  createdAt: string;
}

export interface AttachmentSearchResultDto {
  id: number;
  messageId: number;
  conversationId: number;
  conversationName: string | null;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface UserSearchResultDto {
  id: number;
  username: string;
  displayName: string;
  avatar: string;
  bio: string | null;
  isContact: boolean;
}
