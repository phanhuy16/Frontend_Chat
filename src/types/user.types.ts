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
}

export interface UserSearchResponse {
  users: User[];
}