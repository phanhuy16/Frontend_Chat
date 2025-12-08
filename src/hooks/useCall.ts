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

  const webrtcRef = useRef<WebRTCService | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebRTC service
  useEffect(() => {
    webrtcRef.current = new WebRTCService();

    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.closeConnection();
      }
    };
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
        if (!webrtcRef.current) {
          throw new Error("WebRTC service not initialized");
        }

        const callId = `call_${Date.now()}`;

        // Get local stream
        const localStream = await webrtcRef.current.initLocalStream(callType);

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
    []
  );

  // Answer call - Recipient side
  const answerCall = useCallback(async (callType: CallType) => {
    try {
      if (!webrtcRef.current) {
        throw new Error("WebRTC service not initialized");
      }

      const localStream = await webrtcRef.current.initLocalStream(callType);

      setCallState((prev) => ({
        ...prev,
        callStatus: "connecting",
        localStream,
        isAudioEnabled: true,
        isVideoEnabled: callType === CallType.Video,
      }));
    } catch (err) {
      console.error("Error answering call:", err);
      setCallState((prev) => ({
        ...prev,
        callStatus: "ended",
      }));
      throw err;
    }
  }, []);

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
    if (!webrtcRef.current) return;

    // Remote stream received
    webrtcRef.current.onRemoteStreamReceived = (stream: MediaStream) => {
      console.log("Remote stream received");
      setCallState((prev) => ({
        ...prev,
        remoteStream: stream,
      }));
    };

    // ICE candidate found
    webrtcRef.current.onIceCandidateFound = (candidate: RTCIceCandidate) => {
      // This will be handled by the component that uses useCall
      // through the webrtcService getter
      console.log("ICE candidate found, emit via signalR");
    };

    // Connection state changed
    webrtcRef.current.onConnectionStateChange = (
      state: RTCPeerConnectionState
    ) => {
      console.log("WebRTC connection state:", state);

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
    webrtcRef.current.onIceConnectionStateChange = (
      state: RTCIceConnectionState
    ) => {
      console.log("ICE connection state:", state);

      if (state === "failed" || state === "closed" || state === "disconnected") {
        endCall();
      }
    };

    return () => {
      if (webrtcRef.current) {
        webrtcRef.current.onRemoteStreamReceived = undefined;
        webrtcRef.current.onIceCandidateFound = undefined;
        webrtcRef.current.onConnectionStateChange = undefined;
        webrtcRef.current.onIceConnectionStateChange = undefined;
      }
    };
  }, [endCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      if (webrtcRef.current) {
        webrtcRef.current.closeConnection();
      }
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
    webrtcService: webrtcRef.current,
  };
};