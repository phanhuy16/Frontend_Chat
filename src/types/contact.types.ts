import { StatusContact } from "./enums";
import { User } from "./user.types";

export interface UserContact {
  id: number;
  userId: number;
  contactUserId: number;
  status: StatusContact;
  createdAt: string;
  user?: User;
  contactUser?: User;
}