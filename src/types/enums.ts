export enum StatusUser {
  Online = 1,
  Offline = 2,
  Away = 3,
}

export enum MessageType {
  Text = 0,
  Image = 1,
  File = 2,
  Voice = 3,
  Poll = 4,
}

export enum ConversationType {
  Direct = 1,
  Group = 2,
}

export enum ConversationRole {
  Member = 0,
  Admin = 1,
}

export enum StatusContact {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
  Blocked = 3
}

export enum ReportStatus {
  Pending = 0,
  Reviewed = 1,
  Resolved = 2,
  Dismissed = 3
}

export enum CallType {
  Audio = 0,
  Video = 1,
}

export enum CallStatus {
  Pending = 0,
  Answered = 1,
  Rejected = 2,
  Missed = 3,
  Completed = 4,
  Ended = 5,
}

export interface EnumValue {
  value: number;
  name: string;
}

export type CallStatusType = "idle" | "ringing" | "connecting" | "connected" | "ended" | "rejected" | "missed";
