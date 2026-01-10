import { CallStatus, CallStatusType, CallType } from "./enums";

export interface CallHistoryDto {
  id: number;
  callId: string;
  callType: CallType;
  status: CallStatus;
  durationInSeconds: number;
  startedAt: string;
  endedAt?: string;
  initiator?: {
    id: number;
    userName: string;
    displayName: string;
    avatar?: string;
  };
  receiver?: {
    id: number;
    userName: string;
    displayName: string;
    avatar?: string;
  };
}

export interface Participant {
  userId: number;
  userName: string;
  avatar?: string;
  stream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

export interface CallState {
  callId: string | null;
  callType: CallType | null;
  callStatus: CallStatusType;
  remoteUserId: number | null; // Keep for backward compatibility with 1-on-1 logic if needed
  remoteUserName: string | null;
  remoteUserAvatar?: string;
  participants: Record<number, Participant>;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null; // Keep for 1-on-1
  startTime: number | null;
  duration: number;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isGroup: boolean;
}

export interface IncomingCallData {
  callId: string;
  callerId: number;
  callerName: string;
  callerAvatar?: string;
  conversationId: number;
  callType: string;
  timestamp: number;
  isGroup?: boolean;
}