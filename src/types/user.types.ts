import { StatusUser } from "./enums";

export interface User {
  id: number;
  userName: string;
  email: string;
  displayName: string;
  avatar: string;
  status: StatusUser;
  bio?: string;
  customStatus?: string;
  lastActiveAt?: string;
  lastSeenPrivacy: string;
  onlineStatusPrivacy: string;
  readReceiptsEnabled: boolean;
  role: string;
  createdAt: string;
  phoneNumber?: string;
}

export interface UserSearchResponse {
  users: User[];
}