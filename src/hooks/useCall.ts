import { useState, useRef, useCallback, useEffect } from "react";
import { WebRTCService } from "../services/webrtc.service";
import { CallType } from "../types";
import { CallState } from "../types/call.type";

export const useCall = () => {
  const [callState, setCallState] = useState<CallState>({
    callId: null,
    callType: null,
    callStatus: "idle",
    remoteUserId: null,
    remoteUserName: null,
    remoteUserAvatar: undefined,
    participants: {},
    localStream: null,
    remoteStream: null,
    startTime: null,
    duration: 0,
    isAudioEnabled: true,
    isVideoEnabled: true,
    isGroup: false,
  });

  const [webrtcService, setWebRTCService] = useState<WebRTCService | null>(null);
  const webrtcRef = useRef<WebRTCService | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const service = new WebRTCService();
    webrtcRef.current = service;
    setWebRTCService(service);

    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.closeAllConnections();
      }
    };
  }, []);

  const getWebRTCService = useCallback((): WebRTCService => {
    if (!webrtcRef.current) throw new Error("WebRTC service not initialized");
    return webrtcRef.current;
  }, []);

  const startCall = useCallback(
    async (
      callType: CallType,
      recipientId: number,
      recipientName: string,
      recipientAvatar?: string,
      isGroup: boolean = false
    ) => {
      try {
        const service = getWebRTCService();
        const callId = `${isGroup ? "group_" : ""}call_${Date.now()}`;
        const localStream = await service.initLocalStream(callType);

        setCallState((prev) => ({
          ...prev,
          callId,
          callType,
          callStatus: "ringing",
          remoteUserId: isGroup ? null : recipientId,
          remoteUserName: isGroup ? null : recipientName,
          remoteUserAvatar: isGroup ? undefined : recipientAvatar,
          participants: isGroup ? {} : {
            [recipientId]: {
              userId: recipientId,
              userName: recipientName,
              avatar: recipientAvatar,
              stream: null,
              isAudioEnabled: true,
              isVideoEnabled: callType === CallType.Video,
            }
          },
          localStream,
          isAudioEnabled: true,
          isVideoEnabled: callType === CallType.Video,
          isGroup,
        }));

        return callId;
      } catch (err) {
        console.error("Error starting call:", err);
        setCallState((prev) => ({ ...prev, callStatus: "ended" }));
        throw err;
      }
    },
    [getWebRTCService]
  );

  const answerCall = useCallback(
    async (
      callType: CallType,
      callerId?: number,
      callerName?: string,
      callerAvatar?: string,
      isGroup: boolean = false
    ) => {
      try {
        const service = getWebRTCService();
        const localStream = await service.initLocalStream(callType);

        setCallState((prev) => ({
          ...prev,
          callStatus: "connecting",
          localStream,
          callType,
          isAudioEnabled: true,
          isVideoEnabled: callType === CallType.Video,
          remoteUserId: isGroup ? null : (callerId ?? prev.remoteUserId),
          remoteUserName: isGroup ? 'Cuộc gọi nhóm' : (callerName ?? prev.remoteUserName),
          remoteUserAvatar: isGroup ? undefined : (callerAvatar ?? prev.remoteUserAvatar),
          participants: isGroup ? {} : (callerId ? {
            [callerId]: {
              userId: callerId,
              userName: callerName || "",
              avatar: callerAvatar,
              stream: null,
              isAudioEnabled: true,
              isVideoEnabled: callType === CallType.Video,
            }
          } : prev.participants),
          isGroup,
        }));
      } catch (err) {
        console.error("Error answering call:", err);
        setCallState((prev) => ({ ...prev, callStatus: "ended" }));
        throw err;
      }
    },
    [getWebRTCService]
  );

  const endCall = useCallback(() => {
    try {
      if (webrtcRef.current) {
        webrtcRef.current.closeAllConnections();
      }

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      setCallState({
        callId: null,
        callType: null,
        callStatus: "idle",
        remoteUserId: null,
        remoteUserName: null,
        remoteUserAvatar: undefined,
        participants: {},
        localStream: null,
        remoteStream: null,
        startTime: null,
        duration: 0,
        isAudioEnabled: true,
        isVideoEnabled: true,
        isGroup: false,
      });
    } catch (err) {
      console.error("Error ending call:", err);
    }
  }, []);

  const setConnectionEstablished = useCallback(() => {
    setCallState((prev) => ({
      ...prev,
      callStatus: "connected",
      startTime: prev.startTime || Date.now(),
    }));

    if (!durationIntervalRef.current) {
      durationIntervalRef.current = setInterval(() => {
        setCallState((prev) => {
          if (prev.startTime) {
            return {
              ...prev,
              duration: Math.floor((Date.now() - prev.startTime) / 1000),
            };
          }
          return prev;
        });
      }, 1000);
    }
  }, []);

  const addParticipant = useCallback((userId: number, userName: string, avatar?: string) => {
    setCallState(prev => ({
      ...prev,
      participants: {
        ...prev.participants,
        [userId]: {
          userId,
          userName,
          avatar,
          stream: null,
          isAudioEnabled: true,
          isVideoEnabled: prev.callType === CallType.Video,
        }
      }
    }));
  }, []);

  const removeParticipant = useCallback((userId: number) => {
    setCallState(prev => {
      const newParticipants = { ...prev.participants };
      delete newParticipants[userId];
      return {
        ...prev,
        participants: newParticipants
      };
    });
  }, []);

  const toggleAudio = useCallback(() => {
    setCallState((prev) => {
      if (prev.localStream) {
        prev.localStream.getAudioTracks().forEach((track) => {
          track.enabled = !prev.isAudioEnabled;
        });
      }
      return { ...prev, isAudioEnabled: !prev.isAudioEnabled };
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setCallState((prev) => {
      if (prev.localStream && prev.callType === CallType.Video) {
        prev.localStream.getVideoTracks().forEach((track) => {
          track.enabled = !prev.isVideoEnabled;
        });
      }
      return { ...prev, isVideoEnabled: !prev.isVideoEnabled };
    });
  }, []);

  const rejectCall = useCallback(() => {
    endCall();
    setCallState(prev => ({ ...prev, callStatus: "rejected" }));
    setTimeout(() => {
      endCall();
    }, 1000);
  }, [endCall]);

  useEffect(() => {
    if (!webrtcService) return;

    webrtcService.onRemoteStreamReceived = (userId: number, stream: MediaStream) => {
      setCallState((prev) => ({
        ...prev,
        remoteStream: (!prev.isGroup && userId === prev.remoteUserId) ? stream : prev.remoteStream,
        participants: {
          ...prev.participants,
          [userId]: {
            ...(prev.participants[userId] || {
              userId,
              userName: `User ${userId}`,
              isAudioEnabled: true,
              isVideoEnabled: true,
            }),
            stream,
          }
        },
      }));
    };

    webrtcService.onRemoteStreamRemoved = (userId: number) => {
      removeParticipant(userId);
    };

    webrtcService.onConnectionStateChange = (userId: number, state: RTCPeerConnectionState) => {
      if (state === "connected") {
        setConnectionEstablished();
      } else if (state === "disconnected" || state === "failed" || state === "closed") {
        if (!callState.isGroup) {
          endCall();
        } else {
          webrtcService.closePeerConnection(userId);
          removeParticipant(userId);
        }
      }
    };

    return () => {
      if (webrtcService) {
        webrtcService.onRemoteStreamReceived = undefined;
        webrtcService.onRemoteStreamRemoved = undefined;
        webrtcService.onConnectionStateChange = undefined;
      }
    };
  }, [webrtcService, endCall, setConnectionEstablished, removeParticipant, callState.isGroup]);

  return {
    callState,
    startCall,
    answerCall,
    endCall,
    rejectCall,
    setConnectionEstablished,
    addParticipant,
    removeParticipant,
    toggleAudio,
    toggleVideo,
    webrtcService,
    getWebRTCService,
    setCallState,
  };
};