import React, { createContext, useContext, ReactNode } from 'react';
import { useCallIntegration } from '../hooks/useCallIntegration';
import { SIGNALR_HUB_URL_CALL } from '../utils/constants';
import { CallType } from '../types';
import { CallState, IncomingCallData } from '../types/call.type';

interface CallContextType {
  callState: CallState;
  incomingCall: IncomingCallData | null;
  startCall: (
    recipientId: number,
    recipientName: string,
    conversationId: number,
    callType: CallType
  ) => Promise<void>;
  startGroupCall: (
    memberIds: number[],
    conversationId: number,
    callType: CallType
  ) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleAudio: () => void;
  toggleVideo: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const callIntegration = useCallIntegration(SIGNALR_HUB_URL_CALL as string);

  return (
    <CallContext.Provider value={callIntegration}>
      {children}
    </CallContext.Provider>
  );
};

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCallContext must be used within a CallProvider');
  }
  return context;
};
