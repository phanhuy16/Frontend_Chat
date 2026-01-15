import { ReportStatus } from "./enums";

export interface Report {
  id: number;
  reportedUserId: number;
  reporterId: number;
  conversationId?: number;
  reason: string;
  description: string;
  reportedAt: Date;
  status: ReportStatus;
  adminNotes?: string;
}

export interface CreateReportRequest {
  reportedUserId: number;
  reporterId: number;
  conversationId?: number;
  reason: string;
  description: string;
}

export interface ReportDto {
  id: number;
  reportedUserId: number;
  reporterId: number;
  conversationId?: number;
  reason: string;
  description: string;
  reportedAt: string;
  status: ReportStatus;
  adminNotes?: string;
  reportedUser?: {
    id: number;
    userName: string;
    displayName: string;
    avatar?: string;
  };
  reporter?: {
    id: number;
    userName: string;
    displayName: string;
    avatar?: string;
  };
}

export interface ReportListItemDto {
  id: number;
  reportedUserName: string;
  reporterName: string;
  reason: string;
  description?: string;
  reportedAt: string;
  status: ReportStatus;
}