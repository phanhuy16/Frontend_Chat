

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
  callType: string;
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

  // Register user khi component mount
  useEffect(() => {
    if (user?.id) {
      console.log(`✅ Registering user ${user.id}`);
      invoke('RegisterUser', user.id).catch((err) => {
        console.error('Failed to register user:', err);
      });
    }

    return () => {
      // Cleanup
    };
  }, [user?.id, invoke]);

  // Lắng nghe cuộc gọi đến
  useEffect(() => {
    const handleIncomingCall = async (data: IncomingCallData) => {
      console.log('📞 Incoming call:', data);

      setIncomingCall(data);

      // Phát ringtone
      playRingtone();

      // Auto reject sau 30 giây nếu không pick up
      callTimeoutRef.current = setTimeout(() => {
        console.log('⏱️ Call timeout - auto rejecting');
        handleRejectCall();
      }, 30000);
    };

    const handleCallRejected = (data: any) => {
      console.log('❌ Call rejected:', data);
      stopRingtone();
      toast.error('Cuộc gọi bị từ chối');
      endCall();
      setIncomingCall(null);
    };

    const handleCallEnded = (data: any) => {
      console.log('📞 Call ended:', data);
      stopRingtone();
      toast.custom(`Cuộc gọi kết thúc (${data.duration}s)`);
      endCall();
      setIncomingCall(null);
    };

    const handleReceiveCallOffer = async (data: any) => {
      console.log('📤 Received call offer:', data);

      try {
        if (!webrtcService) return;

        // Initialize peer connection
        await webrtcService.initPeerConnection();

        // Create answer
        const answer = await webrtcService.createAnswer(data.offer);

        // Send answer back
        await invoke('SendCallAnswer', data.callerId, answer);

        console.log('✅ Answer sent');
      } catch (err) {
        console.error('Error handling offer:', err);
        rejectCall();
      }
    };

    const handleReceiveCallAnswer = async (data: any) => {
      console.log('✅ Received call answer:', data);

      try {
        if (!webrtcService) return;

        await webrtcService.handleAnswer(data.answer);
        setConnectionEstablished();

        console.log('✅ Connection established');
      } catch (err) {
        console.error('Error handling answer:', err);
        endCall();
      }
    };

    const handleReceiveIceCandidate = async (data: any) => {
      try {
        if (!webrtcService) return;

        await webrtcService.addIceCandidate(data.candidate);
      } catch (err) {
        console.warn('Error handling ICE candidate:', err);
      }
    };

    const handleRemoteMediaStateChanged = (data: any) => {
      console.log('🔇 Remote media state changed:', data);

      // Update UI to show remote user's media state
      // You can dispatch actions or update state here
    };

    const handleUserOnlineStatusChanged = (data: any) => {
      console.log(`👤 User ${data.userId} is ${data.status}`);

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

    // return () => {
    //   off('IncomingCall', handleIncomingCall);
    //   off('CallRejected', handleCallRejected);
    //   off('CallEnded', handleCallEnded);
    //   off('ReceiveCallOffer', handleReceiveCallOffer);
    //   off('ReceiveCallAnswer', handleReceiveCallAnswer);
    //   off('ReceiveIceCandidate', handleReceiveIceCandidate);
    //   off('RemoteMediaStateChanged', handleRemoteMediaStateChanged);
    //   off('UserOnlineStatusChanged', handleUserOnlineStatusChanged);

    //   // Cleanup
    //   if (callTimeoutRef.current) {
    //     clearTimeout(callTimeoutRef.current);
    //   }
    // };
  }, [on, off, webrtcService, answerCall, rejectCall, endCall, invoke, setConnectionEstablished]);

  // ✅ Setup WebRTC ICE candidates
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

  // ✅ Play ringtone
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

  // ✅ Stop ringtone
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

  // ✅ Start call (initiate)
  const handleStartCall = useCallback(
    async (recipientId: number, recipientName: string, conversationId: number, callType: CallType) => {
      try {
        // Start local call first
        await startCall(callType, recipientId, recipientName);

        // Invoke InitiateCall on backend
        await invoke('InitiateCall', conversationId, recipientId, callType === CallType.Video ? 'Video' : 'Audio');

        toast.success('Đang gọi...');
      } catch (err) {
        console.error('Error starting call:', err);
        toast.error('Lỗi khi bắt đầu gọi');
        endCall();
      }
    },
    [startCall, invoke, endCall]
  );

  // ✅ Accept call
  const handleAcceptCall = useCallback(async () => {
    try {
      if (!incomingCall) return;

      stopRingtone();

      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }

      const callType = incomingCall.callType === 'Video' ? CallType.Video : CallType.Audio;

      // Answer call locally
      await answerCall(callType);

      // Initialize WebRTC
      if (!webrtcService?.getPeerConnection()) {
        await webrtcService?.initLocalStream(callType);
        await webrtcService?.initPeerConnection();
      }

      // Create and send offer
      const offer = await webrtcService?.createOffer();
      if (offer) {
        await invoke('SendCallOffer', incomingCall.callerId, offer);
      }

      setIncomingCall(null);
      toast.success('Đã chấp nhận cuộc gọi');
    } catch (err) {
      console.error('Error accepting call:', err);
      toast.error('Lỗi khi chấp nhận cuộc gọi');
      rejectCall();
    }
  }, [incomingCall, webrtcService, answerCall, invoke, rejectCall, stopRingtone]);

  // ✅ Reject call
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
      toast.custom('Đã từ chối cuộc gọi');
    } catch (err) {
      console.error('Error rejecting call:', err);
    }
  }, [incomingCall, invoke, rejectCall, stopRingtone]);

  // ✅ End call
  const handleEndCall = useCallback(async () => {
    try {
      const duration = callState.duration;

      if (callState.remoteUserId) {
        await invoke('EndCall', callState.remoteUserId, duration);
      }

      endCall();
      toast.custom(`Cuộc gọi kết thúc (${duration}s)`);
    } catch (err) {
      console.error('Error ending call:', err);
    }
  }, [callState.remoteUserId, callState.duration, invoke, endCall]);

  // ✅ Update media state
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

  // ✅ Get online users
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