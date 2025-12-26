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
    localStream: null,
    remoteStream: null,
    startTime: null,
    duration: 0,
    isAudioEnabled: true,
    isVideoEnabled: true,
  });

  // Use STATE for service to trigger re-renders for consumers when initialized
  const [webrtcService, setWebRTCService] = useState<WebRTCService | null>(null);

  // Keep ref for internal access if needed without dependency issues,
  // but mostly relying on state is better for consumers.
  const webrtcRef = useRef<WebRTCService | null>(null);

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebRTC service
  useEffect(() => {
    const service = new WebRTCService();

    // Set both ref and state
    webrtcRef.current = service;
    setWebRTCService(service);

    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.closeConnection();
      }
    };
  }, []);

  // Getter function (still useful for internal logic that needs sync access)
  const getWebRTCService = useCallback((): WebRTCService => {
    if (!webrtcRef.current) {
      throw new Error("WebRTC service not initialized");
    }
    return webrtcRef.current;
  }, []);

  // Start call - Initiator side
  const startCall = useCallback(
    async (
      callType: CallType,
      recipientId: number,
      recipientName: string,
      recipientAvatar?: string
    ) => {
      try {
        const service = getWebRTCService();

        const callId = `call_${Date.now()}`;

        // Get local stream
        const localStream = await service.initLocalStream(callType);

        setCallState((prev) => ({
          ...prev,
          callId,
          callType,
          callStatus: "ringing",
          remoteUserId: recipientId,
          remoteUserName: recipientName,
          remoteUserAvatar: recipientAvatar,
          localStream,
          isAudioEnabled: true,
          isVideoEnabled: callType === CallType.Video,
        }));

        return callId;
      } catch (err) {
        console.error("Error starting call:", err);
        setCallState((prev) => ({
          ...prev,
          callStatus: "ended",
        }));
        throw err;
      }
    },
    [getWebRTCService]
  );

  // Answer call - Recipient side
  const answerCall = useCallback(
    async (
      callType: CallType,
      callerId?: number,
      callerName?: string,
      callerAvatar?: string
    ) => {
      try {
        const service = getWebRTCService();

        const localStream = await service.initLocalStream(callType);

        setCallState((prev) => ({
          ...prev,
          callStatus: "connecting",
          localStream,
          isAudioEnabled: true,
          isVideoEnabled: callType === CallType.Video,
          // Set remote user info so we can send EndCall signal later
          remoteUserId: callerId ?? prev.remoteUserId,
          remoteUserName: callerName ?? prev.remoteUserName,
          remoteUserAvatar: callerAvatar ?? prev.remoteUserAvatar,
        }));
      } catch (err) {
        console.error("Error answering call:", err);
        setCallState((prev) => ({
          ...prev,
          callStatus: "ended",
        }));
        throw err;
      }
    },
    [getWebRTCService]
  );

  // End call
  const endCall = useCallback(() => {
    try {
      if (webrtcRef.current) {
        webrtcRef.current.closeConnection();
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
        localStream: null,
        remoteStream: null,
        startTime: null,
        duration: 0,
        isAudioEnabled: true,
        isVideoEnabled: true,
      });
    } catch (err) {
      console.error("Error ending call:", err);
    }
  }, []);

  // Set connection established - when WebRTC connection is ready
  const setConnectionEstablished = useCallback(() => {
    setCallState((prev) => ({
      ...prev,
      callStatus: "connected",
      startTime: Date.now(),
    }));

    // Start duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

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
  }, []);

  // Reject call
  const rejectCall = useCallback(() => {
    try {
      if (webrtcRef.current) {
        webrtcRef.current.closeConnection();
      }

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      setCallState((prev) => ({
        ...prev,
        callStatus: "rejected",
      }));

      // Reset after delay
      const timeout = setTimeout(() => {
        setCallState({
          callId: null,
          callType: null,
          callStatus: "idle",
          remoteUserId: null,
          remoteUserName: null,
          remoteUserAvatar: undefined,
          localStream: null,
          remoteStream: null,
          startTime: null,
          duration: 0,
          isAudioEnabled: true,
          isVideoEnabled: true,
        });
      }, 1000);

      return () => clearTimeout(timeout);
    } catch (err) {
      console.error("Error rejecting call:", err);
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    setCallState((prev) => {
      if (prev.localStream) {
        prev.localStream.getAudioTracks().forEach((track) => {
          track.enabled = !prev.isAudioEnabled;
        });
      }

      return {
        ...prev,
        isAudioEnabled: !prev.isAudioEnabled,
      };
    });
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    setCallState((prev) => {
      // Only toggle if this is a video call
      if (prev.localStream && prev.callType === CallType.Video) {
        prev.localStream.getVideoTracks().forEach((track) => {
          track.enabled = !prev.isVideoEnabled;
        });
      }

      return {
        ...prev,
        isVideoEnabled: !prev.isVideoEnabled,
      };
    });
  }, []);

  // Setup WebRTC callbacks
  useEffect(() => {
    if (!webrtcService) return;

    // Remote stream received
    webrtcService.onRemoteStreamReceived = (stream: MediaStream) => {
      setCallState((prev) => ({
        ...prev,
        remoteStream: stream,
      }));
    };

    // ICE candidate found
    webrtcService.onIceCandidateFound = (candidate: RTCIceCandidate) => {
      console.log("ICE candidate found, notify listener...");
    };

    // Connection state changed
    webrtcService.onConnectionStateChange = (
      state: RTCPeerConnectionState
    ) => {
      if (state === "connected") {
        setCallState((prev) => {
          if (prev.callStatus !== "connected") {
            return {
              ...prev,
              callStatus: "connected",
              startTime: Date.now(),
            };
          }
          return prev;
        });
      } else if (
        state === "disconnected" ||
        state === "failed" ||
        state === "closed"
      ) {
        endCall();
      }
    };

    // ICE connection state changed
    webrtcService.onIceConnectionStateChange = (
      state: RTCIceConnectionState
    ) => {
      console.log("❄️ ICE connection state:", state);

      if (state === "failed" || state === "closed" || state === "disconnected") {
        endCall();
      }
    };

    return () => {
      // Cleanup callbacks if needed, but managing via instance lifecycle
      if (webrtcService) {
        webrtcService.onRemoteStreamReceived = undefined;
      // ...
      }
    };
  }, [webrtcService, endCall]); // Now depends on webrtcService

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // We handle connection closing in the init effect cleanup
    };
  }, []);

  return {
    callState,
    startCall,
    answerCall,
    endCall,
    rejectCall,
    setConnectionEstablished,
    toggleAudio,
    toggleVideo,
    webrtcService, // This will now return the actual service instance
    getWebRTCService,
  };
};