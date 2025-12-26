import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useSignalR } from './useSignalR';
import { useCall } from './useCall';
import { CallType } from '../types';
import toast from 'react-hot-toast';

interface IncomingCallData {
  callId: string;
  callerId: number;
  callerName: string;
  callerAvatar?: string;
  conversationId: number;
  callType: CallType;
  timestamp: number;
}

export const useCallIntegration = (hubUrl: string) => {
  const { user } = useAuth();
  const { invoke, on, off } = useSignalR(hubUrl);
  const {
    callState,
    startCall,
    answerCall,
    endCall,
    rejectCall,
    toggleAudio,
    toggleVideo,
    webrtcService,
    setConnectionEstablished,
  } = useCall();

  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Store caller ID to use in SendCallAnswer
  const callerIdRef = useRef<number>(0);

  // Store pending offer and acceptance state
  const callOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const isCallAcceptedRef = useRef<boolean>(false);

  // Register user khi component mount
  useEffect(() => {
    if (user?.id) {
      invoke('RegisterUser', user.id).catch((err) => {
        console.error('Failed to register user:', err);
      });
    }

    return () => {
      // Cleanup
    };
  }, [user?.id, invoke]);

  // Process Call Answer Logic (Extracted)
  const processCallAnswer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    try {
      if (!webrtcService) {
        return;
      }

      // Create answer
      const answer = await webrtcService.createAnswer(offer);

      // Send answer back
      await invoke('SendCallAnswer', callerIdRef.current, answer);

      console.log('Answer sent successfully');
      setConnectionEstablished();
    } catch (err) {
      console.error('Error processing call answer:', err);
      toast.error('Lỗi khi xử lý cuộc gọi');
    }
  }, [webrtcService, invoke, setConnectionEstablished]);

  // Lắng nghe cuộc gọi đến
  useEffect(() => {
    const handleIncomingCall = async (data: IncomingCallData) => {

      // Store caller ID for later use
      callerIdRef.current = data.callerId;
      // Reset call state refs
      callOfferRef.current = null;
      isCallAcceptedRef.current = false;

      setIncomingCall(data);

      // Phát ringtone
      playRingtone();

      // Auto reject sau 30 giây nếu không pick up
      callTimeoutRef.current = setTimeout(() => {
        handleRejectCall();
      }, 30000);
    };

    const handleCallRejected = (data: any) => {
      stopRingtone();
      toast.error('Cuộc gọi bị từ chối');
      endCall();
      setIncomingCall(null);
      callerIdRef.current = 0;
      callOfferRef.current = null;
      isCallAcceptedRef.current = false;
    };

    const handleCallEnded = (data: any) => {
      stopRingtone();
      toast.custom(`Cuộc gọi kết thúc (${data.duration}s)`);
      endCall();
      setIncomingCall(null);
      callerIdRef.current = 0;
      callOfferRef.current = null;
      isCallAcceptedRef.current = false;
    };

    const handleReceiveCallOffer = async (data: any) => {

      // Store the offer
      callOfferRef.current = data.offer;

      // Only process if user has ALREADY accepted
      if (isCallAcceptedRef.current) {
        await processCallAnswer(data.offer);
      }
    };

    const handleReceiveCallAnswer = async (data: any) => {
      try {
        if (!webrtcService) {
          return;
        }
        await webrtcService.handleAnswer(data.answer);
        setConnectionEstablished();

      } catch (err) {
        console.error('Error handling answer:', err);
        toast.error('Lỗi kết nối');
        endCall();
      }
    };

    const handleReceiveIceCandidate = async (data: any) => {
      try {
        if (!webrtcService) {
          return;
        }

        await webrtcService.addIceCandidate(data.candidate);
      } catch (err) {
        console.warn('Error handling ICE candidate:', err);
      }
    };

    const handleRemoteMediaStateChanged = (data: any) => {
      console.log('Remote media state changed:', data);
    };

    const handleUserOnlineStatusChanged = (data: any) => {

      if (data.status === 'Online') {
        setOnlineUsers((prev) => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      } else {
        setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
      }
    };

    // Register listeners
    on('IncomingCall', handleIncomingCall);
    on('CallRejected', handleCallRejected);
    on('CallEnded', handleCallEnded);
    on('ReceiveCallOffer', handleReceiveCallOffer);
    on('ReceiveCallAnswer', handleReceiveCallAnswer);
    on('ReceiveIceCandidate', handleReceiveIceCandidate);
    on('RemoteMediaStateChanged', handleRemoteMediaStateChanged);
    on('UserOnlineStatusChanged', handleUserOnlineStatusChanged);

    return () => {
      // Cleanup listeners
      off('IncomingCall');
      off('CallRejected');
      off('CallEnded');
      off('ReceiveCallOffer');
      off('ReceiveCallAnswer');
      off('ReceiveIceCandidate');
      off('RemoteMediaStateChanged');
      off('UserOnlineStatusChanged');
    };
  }, [on, off, webrtcService, invoke, processCallAnswer, endCall, setConnectionEstablished]);

  // Setup WebRTC ICE candidates
  useEffect(() => {
    if (!webrtcService) return;

    const handleIceCandidate = (candidate: RTCIceCandidate) => {
      if (callState.remoteUserId) {
        invoke('SendIceCandidate', callState.remoteUserId, candidate).catch((err) => {
          console.warn('Failed to send ICE candidate:', err);
        });
      }
    };

    webrtcService.onIceCandidateFound = handleIceCandidate;

    return () => {
      if (webrtcService) {
        webrtcService.onIceCandidateFound = undefined;
      }
    };
  }, [webrtcService, callState.remoteUserId, invoke]);

  // Setup remote stream handler
  useEffect(() => {
    if (!webrtcService) return;

    const handleRemoteStream = (stream: MediaStream) => {
      console.log('Remote stream received:', stream.id);
      console.log('Video tracks:', stream.getVideoTracks().length);
      console.log('Audio tracks:', stream.getAudioTracks().length);
    };

    webrtcService.onRemoteStreamReceived = handleRemoteStream;

    return () => {
      if (webrtcService) {
        webrtcService.onRemoteStreamReceived = undefined;
      }
    };
  }, [webrtcService]);

  // Play ringtone
  const playRingtone = useCallback(() => {
    try {
      if (!ringtoneRef.current) {
        ringtoneRef.current = new Audio('/sounds/ringtone.mp3');
        ringtoneRef.current.loop = true;
        ringtoneRef.current.volume = 0.8;
      }

      ringtoneRef.current.play().catch((err) => {
        console.warn('Could not play ringtone:', err);
      });
    } catch (err) {
      console.error('Error playing ringtone:', err);
    }
  }, []);

  // Stop ringtone
  const stopRingtone = useCallback(() => {
    try {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    } catch (err) {
      console.error('Error stopping ringtone:', err);
    }
  }, []);

  // Start call (initiate) - CALLER side
  const handleStartCall = useCallback(
    async (recipientId: number, recipientName: string, conversationId: number, callType: CallType) => {
      try {
        console.log(`Starting ${callType} call to ${recipientName} (ID: ${recipientId})`);

        if (!webrtcService) {
          throw new Error('WebRTC service not available');
        }

        // Initialize local stream FIRST
        await webrtcService.initLocalStream(callType);

        // Initialize PeerConnection
        await webrtcService.initPeerConnection();

        // Start local call state
        await startCall(callType, recipientId, recipientName);

        // Invoke InitiateCall on backend to notify receiver
        const callTypeStr = callType === CallType.Video ? 'Video' : 'Audio';
        await invoke('InitiateCall', conversationId, recipientId, callTypeStr);

        // Create offer and send to receiver
        const offer = await webrtcService.createOffer();

        await invoke('SendCallOffer', recipientId, offer);

        toast.success('Đang gọi...');
      } catch (err) {
        console.error('Error starting call:', err);
        toast.error('Lỗi khi bắt đầu gọi');
        endCall();
      }
    },
    [webrtcService, startCall, invoke, endCall]
  );

  // Accept call - RECEIVER side
  const handleAcceptCall = useCallback(async () => {
    try {
      if (!incomingCall) {
        console.error('No incoming call to accept');
        return;
      }

      // Set Accepted Flag
      isCallAcceptedRef.current = true;

      stopRingtone();

      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }

      const callType = incomingCall.callType === CallType.Video ? CallType.Video : CallType.Audio;

      if (!webrtcService) {
        throw new Error('WebRTC service not available');
      }

      // Initialize local stream FIRST
      await webrtcService.initLocalStream(callType);

      // Initialize peer connection
      await webrtcService.initPeerConnection();

      // Answer call locally
      await answerCall(
        callType,
        incomingCall.callerId,
        incomingCall.callerName,
        incomingCall.callerAvatar
      );

      // Check if we already have the offer
      if (callOfferRef.current) {
        await processCallAnswer(callOfferRef.current);
      } else {
        console.log('Waiting for offer from caller...');
      }

      setIncomingCall(null);
      toast.success('Đã chấp nhận cuộc gọi');
    } catch (err) {
      console.error('Error accepting call:', err);
      toast.error('Lỗi khi chấp nhận cuộc gọi');
      rejectCall();
    }
  }, [incomingCall, webrtcService, answerCall, rejectCall, stopRingtone, processCallAnswer]);

  // Reject call
  const handleRejectCall = useCallback(async () => {
    try {
      stopRingtone();

      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }

      if (incomingCall) {
        await invoke('RejectCall', incomingCall.callerId);
      }

      rejectCall();
      setIncomingCall(null);
      callerIdRef.current = 0;
      callOfferRef.current = null;
      isCallAcceptedRef.current = false;
      toast.custom('Đã từ chối cuộc gọi');
    } catch (err) {
      console.error('Error rejecting call:', err);
    }
  }, [incomingCall, invoke, rejectCall, stopRingtone]);

  // End call
  const handleEndCall = useCallback(async () => {
    try {
      const duration = callState.duration;

      if (callState.remoteUserId) {
        await invoke('EndCall', callState.remoteUserId, duration);
      }

      endCall();
      callerIdRef.current = 0;
      callOfferRef.current = null;
      isCallAcceptedRef.current = false;
      toast.custom(`Cuộc gọi kết thúc (${duration}s)`);
    } catch (err) {
      console.error('Error ending call:', err);
    }
  }, [callState.remoteUserId, callState.duration, invoke, endCall]);

  // Update media state
  const handleUpdateMediaState = useCallback(
    async (isAudioEnabled: boolean, isVideoEnabled: boolean) => {
      try {

        if (callState.remoteUserId) {
          await invoke('UpdateMediaState', callState.remoteUserId, isAudioEnabled, isVideoEnabled);
        }

        toggleAudio();
        if (callState.callType === CallType.Video) {
          toggleVideo();
        }
      } catch (err) {
        console.error('Error updating media state:', err);
      }
    },
    [callState.remoteUserId, callState.callType, invoke, toggleAudio, toggleVideo]
  );

  // Get online users
  const getOnlineUsers = useCallback(async () => {
    try {
      await invoke('GetOnlineUsers');
    } catch (err) {
      console.error('Error getting online users:', err);
    }
  }, [invoke]);

  return {
    // State
    callState,
    incomingCall,
    onlineUsers,

    // Call handlers
    startCall: handleStartCall,
    acceptCall: handleAcceptCall,
    rejectCall: handleRejectCall,
    endCall: handleEndCall,
    updateMediaState: handleUpdateMediaState,
    toggleAudio,
    toggleVideo,

    // Utility
    getOnlineUsers,
  };
};