export interface FriendRequestDto {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  receiverId: number;
  status: number;
  createdAt: string;
}

export interface FriendDto {
  id: number;
  userName: string;
  displayName: string;
  avatar: string;
  status: number;
  becomeFriendAt: string;
}