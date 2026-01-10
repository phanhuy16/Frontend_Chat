import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useSignalR } from './useSignalR';
import { useCall } from './useCall';
import { CallType } from '../types';
import { IncomingCallData } from '../types/call.type';
import toast from 'react-hot-toast';
import callApi from '../api/call.api';

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
    addParticipant,
    removeParticipant,
    setCallState,
  } = useCall();

  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callIdRef = useRef<string>('');

  // Register user on mount
  useEffect(() => {
    if (user?.id) {
      invoke('RegisterUser', user.id).catch(err => console.error('SignalR RegisterUser error:', err));
    }
  }, [user?.id, invoke]);

  // Handle incoming signaling messages
  useEffect(() => {
    const handleIncomingCall = (data: any) => {
      setIncomingCall({ ...data, isGroup: false });
      playRingtone();
      callTimeoutRef.current = setTimeout(() => handleRejectCall(), 30000);
    };

    const handleIncomingGroupCall = (data: any) => {
      setIncomingCall({ ...data, isGroup: true });
      playRingtone();
      callTimeoutRef.current = setTimeout(() => handleRejectCall(), 30000);
    };

    const handleUserJoinedGroupCall = async (data: any) => {
      const { userId, displayName } = data;
      console.log(`User ${displayName} (${userId}) joined group call. Initiating offer...`);

      if (!webrtcService) return;

      addParticipant(userId, displayName || `User ${userId}`);

      // We are an existing participant, so we send the offer to the newcomer
      try {
        const offer = await webrtcService.createOffer(userId);
        await invoke('SendCallOffer', userId, offer);
      } catch (err) {
        console.error(`Failed to send offer to user ${userId}:`, err);
      }
    };

    const handleReceiveCallOffer = async (data: any) => {
      const { callerId, offer } = data;
      if (!webrtcService) return;

      addParticipant(callerId, `User ${callerId}`);

      try {
        const answer = await webrtcService.createAnswer(callerId, offer);
        await invoke('SendCallAnswer', callerId, answer);
        setConnectionEstablished();
      } catch (err) {
        console.error(`Failed to handle offer from user ${callerId}:`, err);
      }
    };

    const handleReceiveCallAnswer = async (data: any) => {
      const { receiverId, answer } = data;
      if (!webrtcService) return;

      try {
        await webrtcService.handleAnswer(receiverId, answer);
        setConnectionEstablished();
      } catch (err) {
        console.error(`Failed to handle answer from user ${receiverId}:`, err);
      }
    };

    const handleReceiveIceCandidate = async (data: any) => {
      const { senderId, candidate } = data;
      if (webrtcService) {
        await webrtcService.addIceCandidate(senderId, candidate);
      }
    };

    const handleCallRejected = () => {
      stopRingtone();
      toast.error('Cuộc gọi bị từ chối');
      endCall();
      setIncomingCall(null);
    };

    const handleCallEnded = (data: any) => {
      stopRingtone();
      toast(`Cuộc gọi kết thúc (${data.duration}s)`);
      endCall();
      setIncomingCall(null);
    };

    const handleCallInitiated = (data: any) => {
      const { callId, status, isGroup } = data;
      console.log('Call initiated:', data);

      if (isGroup) {
        setConnectionEstablished(); // Transition to connected immediately for initiator
      }

      setCallState(prev => ({
        ...prev,
        callId: callId,
        callStatus: isGroup ? 'connected' : (status === 'Ringing' ? 'ringing' : 'idle'),
        isGroup: !!isGroup
      }));
    };

    on('IncomingCall', handleIncomingCall);
    on('IncomingGroupCall', handleIncomingGroupCall);
    on('UserJoinedGroupCall', handleUserJoinedGroupCall);
    on('ReceiveCallOffer', handleReceiveCallOffer);
    on('ReceiveCallAnswer', handleReceiveCallAnswer);
    on('ReceiveIceCandidate', handleReceiveIceCandidate);
    on('CallRejected', handleCallRejected);
    on('CallEnded', handleCallEnded);
    on('CallInitiated', handleCallInitiated);

    return () => {
      off('IncomingCall');
      off('IncomingGroupCall');
      off('UserJoinedGroupCall');
      off('ReceiveCallOffer');
      off('ReceiveCallAnswer');
      off('ReceiveIceCandidate');
      off('CallRejected');
      off('CallEnded');
      off('CallInitiated');
    };
  }, [on, off, webrtcService, invoke, addParticipant, setConnectionEstablished, endCall]);

  // Forward local ICE candidates to relevant peers
  useEffect(() => {
    if (!webrtcService) return;

    webrtcService.onIceCandidateFound = (targetUserId: number, candidate: RTCIceCandidate) => {
      invoke('SendIceCandidate', targetUserId, candidate).catch(err => {
        console.warn(`Failed to send ICE candidate to user ${targetUserId}:`, err);
      });
    };

    return () => {
      if (webrtcService) webrtcService.onIceCandidateFound = undefined;
    };
  }, [webrtcService, invoke]);

  // Action methods
  const handleStartCall = useCallback(async (
    recipientId: number,
    recipientName: string,
    conversationId: number,
    callType: CallType
  ) => {
    try {
      if (!webrtcService) throw new Error('WebRTC service not available');

      await webrtcService.initLocalStream(callType);
      await startCall(callType, recipientId, recipientName, undefined, false);

      const callTypeStr = callType === CallType.Video ? 'Video' : 'Audio';
      await invoke('InitiateCall', conversationId, recipientId, callTypeStr);

      // For 1-on-1, initiator sends initial offer
      const offer = await webrtcService.createOffer(recipientId);
      await invoke('SendCallOffer', recipientId, offer);

      toast.success('Đang gọi...');
    } catch (err) {
      console.error('Error starting call:', err);
      toast.error('Lỗi khi bắt đầu gọi');
      endCall();
    }
  }, [webrtcService, startCall, invoke, endCall]);

  const handleStartGroupCall = useCallback(async (
    memberIds: number[],
    conversationId: number,
    callType: CallType
  ) => {
    try {
      if (!webrtcService) throw new Error('WebRTC service not available');

      await webrtcService.initLocalStream(callType);
      await startCall(callType, 0, 'Nhóm', undefined, true);

      const callTypeStr = callType === CallType.Video ? 'Video' : 'Audio';
      await invoke('InitiateGroupCall', conversationId, callTypeStr, memberIds);

      toast.success('Đang khởi tạo cuộc gọi nhóm...');
    } catch (err) {
      console.error('Error starting group call:', err);
      toast.error('Lỗi khi bắt đầu gọi nhóm');
      endCall();
    }
  }, [webrtcService, startCall, invoke, endCall]);

  const handleAcceptCall = useCallback(async () => {
    try {
      if (!incomingCall) return;
      stopRingtone();
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);

      const callType = incomingCall.callType === 'Video' ? CallType.Video : CallType.Audio;
      if (!webrtcService) throw new Error('WebRTC service not available');

      await webrtcService.initLocalStream(callType);

      if (incomingCall.isGroup) {
        await answerCall(callType, 0, 'Nhóm', undefined, true);
        // Inform others that we joined so they can send us offers
        // The backend now tracks participants, so we don't need to pass them
        await invoke('JoinGroupCall', incomingCall.conversationId, incomingCall.callId);
      } else {
        await answerCall(callType, incomingCall.callerId, incomingCall.callerName, incomingCall.callerAvatar, false);
      }

      setIncomingCall(null);
      toast.success('Đã chấp nhận cuộc gọi');
    } catch (err) {
      console.error('Error accepting call:', err);
      toast.error('Lỗi khi chấp nhận cuộc gọi');
      handleRejectCall();
    }
  }, [incomingCall, webrtcService, answerCall, invoke, user?.id]);

  const handleRejectCall = useCallback(async () => {
    stopRingtone();
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    if (incomingCall && !incomingCall.isGroup) {
      await invoke('RejectCall', incomingCall.callerId);
    }
    rejectCall();
    setIncomingCall(null);
  }, [incomingCall, invoke, rejectCall]);

  const handleEndCall = useCallback(async () => {
    const duration = callState.duration;
    if (!callState.isGroup && callState.remoteUserId) {
      await invoke('EndCall', callState.remoteUserId, duration);
    }
    endCall();
    toast(`Cuộc gọi kết thúc (${duration}s)`);
  }, [callState, invoke, endCall]);

  const playRingtone = () => {
    if (!ringtoneRef.current) {
      ringtoneRef.current = new Audio('/sounds/ringtone.mp3');
      ringtoneRef.current.loop = true;
    }
    ringtoneRef.current.play().catch(() => { });
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  return {
    callState,
    incomingCall,
    startCall: handleStartCall,
    startGroupCall: handleStartGroupCall,
    acceptCall: handleAcceptCall,
    rejectCall: handleRejectCall,
    endCall: handleEndCall,
    toggleAudio,
    toggleVideo,
  };
};
