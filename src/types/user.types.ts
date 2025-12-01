import { StatusUser } from "./enums";

export interface User {
  id: number;
  userName: string;
  email: string;
  displayName: string;
  avatar: string;
  status: StatusUser;
}

export interface UserSearchResponse {
  users: User[];
}