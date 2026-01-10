import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useSignalR } from './useSignalR';
import { useCall } from './useCall';
import { CallType } from '../types';
import { IncomingCallData } from '../types/call.type';
import toast from 'react-hot-toast';

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
    setCallState,
  } = useCall();

  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Reject call handler (used internally and exported)
  const handleRejectCall = useCallback(async () => {
    stopRingtone();
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);

    // Use callState if incomingCall is not available (e.g. from timeout)
    if (incomingCall && !incomingCall.isGroup) {
      await invoke('RejectCall', incomingCall.callerId);
    }

    rejectCall();
    setIncomingCall(null);
  }, [incomingCall, invoke, rejectCall]);

  // Register user on mount
  useEffect(() => {
    if (user?.id) {
      invoke('RegisterUser', user.id).catch(err => console.error('SignalR RegisterUser error:', err));
    }
  }, [user?.id, invoke]);

  // Handle incoming signaling messages
  useEffect(() => {
    const handleIncomingCall = (data: any) => {
      console.log('Incoming call received:', data);
      setIncomingCall({ ...data, isGroup: false });
      playRingtone();
      callTimeoutRef.current = setTimeout(() => handleRejectCall(), 30000);
    };

    const handleIncomingGroupCall = (data: any) => {
      console.log('Incoming group call received:', data);
      setIncomingCall({ ...data, isGroup: true });
      playRingtone();
      callTimeoutRef.current = setTimeout(() => handleRejectCall(), 30000);
    };

    const handleUserJoinedGroupCall = async (data: any) => {
      const { userId, displayName } = data;
      console.log(`User ${displayName} (${userId}) joined group call. Initiating offer...`);

      if (!webrtcService) return;

      addParticipant(userId, displayName || `User ${userId}`);

      try {
        const offer = await webrtcService.createOffer(userId);
        await invoke('SendCallOffer', userId, offer);
      } catch (err) {
        console.error(`Failed to send offer to user ${userId}:`, err);
      }
    };

    const handleReceiveCallOffer = async (data: any) => {
      const { callerId, offer } = data;
      console.log(`Received call offer from ${callerId}`);
      if (!webrtcService) {
        console.error('WebRTC service not available on handleReceiveCallOffer');
        return;
      }

      // For 1-on-1, ensure participant is added if not already there
      addParticipant(callerId, `User ${callerId}`);

      try {
        const answer = await webrtcService.createAnswer(callerId, offer);
        console.log(`Created answer for ${callerId}, sending...`);
        await invoke('SendCallAnswer', callerId, answer);
        console.log(`Sent answer to ${callerId}. Setting connection established.`);
        setConnectionEstablished();
      } catch (err) {
        console.error(`Failed to handle offer from user ${callerId}:`, err);
        toast.error('Lỗi khi thiết lập kết nối cuộc gọi');
      }
    };

    const handleReceiveCallAnswer = async (data: any) => {
      const { receiverId, answer } = data;
      console.log(`Received call answer from ${receiverId}`);
      if (!webrtcService) return;

      try {
        await webrtcService.handleAnswer(receiverId, answer);
        console.log(`Handled answer from ${receiverId}. Setting connection established.`);
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
      console.log('Call was rejected');
      stopRingtone();
      toast.error('Cuộc gọi bị từ chối');
      endCall();
      setIncomingCall(null);
    };

    const handleCallEnded = (data: any) => {
      console.log('Call ended:', data);
      stopRingtone();
      toast(`Cuộc gọi kết thúc (${data.duration}s)`);
      endCall();
      setIncomingCall(null);
    };

    const handleCallAccepted = async (data: any) => {
      const { acceptedBy } = data;
      console.log(`Call accepted by ${acceptedBy}. Initiating offer...`);

      if (!webrtcService) {
        console.error('WebRTC service not available on handleCallAccepted');
        return;
      }

      // Transition to connected status so the Calling modal closes for initiator
      setConnectionEstablished();

      try {
        const offer = await webrtcService.createOffer(acceptedBy);
        console.log(`Created offer for ${acceptedBy}, sending...`);
        await invoke('SendCallOffer', acceptedBy, offer);
        console.log(`Sent offer to ${acceptedBy}`);
      } catch (err) {
        console.error(`Failed to send offer to user ${acceptedBy}:`, err);
        toast.error('Không thể bắt đầu kết nối WebRTC');
      }
    };

    const handleCallInitiated = (data: any) => {
      const { callId, status, isGroup } = data;
      console.log('Call initiated event received:', data);

      if (isGroup) {
        setConnectionEstablished();
      }

      setCallState(prev => {
        // If we already transitioned to connected via CallAccepted, don't go back to ringing
        if (prev.callStatus === 'connected' && !isGroup) {
          return { ...prev, callId };
        }
        return {
          ...prev,
          callId: callId,
          callStatus: isGroup ? 'connected' : (status === 'Ringing' ? 'ringing' : 'idle'),
          isGroup: !!isGroup
        };
      });
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
    on('CallAccepted', handleCallAccepted);

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
      off('CallAccepted');
    };
  }, [on, off, webrtcService, invoke, addParticipant, setConnectionEstablished, endCall, handleRejectCall, setCallState]);

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
        await invoke('JoinGroupCall', incomingCall.conversationId, incomingCall.callId);
      } else {
        await answerCall(callType, incomingCall.callerId, incomingCall.callerName, incomingCall.callerAvatar, false);
        await invoke('AcceptCall', incomingCall.callerId);
      }

      setIncomingCall(null);
      toast.success('Đã chấp nhận cuộc gọi');
    } catch (err) {
      console.error('Error accepting call:', err);
      toast.error('Lỗi khi chấp nhận cuộc gọi');
      handleRejectCall();
    }
  }, [incomingCall, webrtcService, answerCall, invoke, handleRejectCall]);

  const handleEndCall = useCallback(async () => {
    const duration = callState.duration;
    if (!callState.isGroup && callState.remoteUserId) {
      await invoke('EndCall', callState.remoteUserId, duration);
    }
    endCall();
    toast(`Cuộc gọi kết thúc (${duration}s)`);
  }, [callState, invoke, endCall]);

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
