import { EnumValue } from "../types";
import { CallHistoryDto } from "../types/call.type";
import axiosInstance from "./axios";

const callApi = {
  // Get call history
  getCallHistory: (userId: number): Promise<CallHistoryDto[]> =>
    axiosInstance
      .get(`/calls/history/${userId}`)
      .then((res) => res.data),

  // Get conversation calls
  getConversationCalls: (conversationId: number): Promise<CallHistoryDto[]> =>
    axiosInstance
      .get(`/calls/conversation/${conversationId}`)
      .then((res) => res.data),

  // Get call types enum
  getCallTypes: (): Promise<EnumValue[]> =>
    axiosInstance
      .get("/calls/types")
      .then((res) => res.data),

  // Get call statuses enum
  getCallStatuses: (): Promise<EnumValue[]> =>
    axiosInstance
      .get("/calls/statuses")
      .then((res) => res.data),

  // Initiate call (REST API alternative)
  initiateCall: (receiverId: number, conversationId: number, callType: string) =>
    axiosInstance
      .post("/call/initiate", {
        receiverId,
        conversationId,
        callType,
      })
      .then((res) => res.data),

  // Answer call
  answerCall: (callId: string) =>
    axiosInstance
      .post(`/call/${callId}/answer`)
      .then((res) => res.data),

  // Reject call
  rejectCall: (callId: string) =>
    axiosInstance
      .post(`/call/${callId}/reject`)
      .then((res) => res.data),

  // End call
  endCall: (callId: string, duration: number) =>
    axiosInstance
      .post(`/call/${callId}/end`, { duration })
      .then((res) => res.data),

  // Update media state
  updateMediaState: (callId: string, isMuted: boolean, isVideoOff: boolean) =>
    axiosInstance
      .put(`/call/${callId}/media-state`, {
        isMuted,
        isVideoOff,
      })
      .then((res) => res.data),
};

export default callApi;