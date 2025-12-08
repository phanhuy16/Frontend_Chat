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

export interface CallState {
  callId: string | null;
  callType: CallType | null;
  callStatus: CallStatusType;
  remoteUserId: number | null;
  remoteUserName: string | null;
  remoteUserAvatar?: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startTime: number | null;
  duration: number;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

export interface IncomingCallData {
  callerId: number;
  callerName: string;
  callerAvatar?: string;
  conversationId: number;
  callType: string;
  timestamp: number;
}