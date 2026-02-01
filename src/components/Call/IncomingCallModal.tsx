// src/components/Call/IncomingCallModal.tsx
import React from "react";
import { getAvatarUrl } from "../../utils/helpers";
import { CallType } from "../../types";

interface IncomingCallModalProps {
  caller: {
    id: number;
    name: string;
    avatar?: string;
  };
  callType: CallType;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  caller,
  callType,
  onAccept,
  onReject,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Darkened backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" />

      {/* Main Card */}
      <div className="relative w-full max-w-sm bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 flex flex-col items-center animate-zoom-in">
        {/* Glowing effect behind avatar */}
        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-primary/20 to-transparent opacity-50 pointer-events-none" />

        {/* Avatar with pulsing rings */}
        <div className="relative mb-6 mt-4">
          <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping opacity-75" />
          <div className="relative w-32 h-32 rounded-full border-4 border-white/10 shadow-2xl overflow-hidden bg-slate-800">
            <img
              src={getAvatarUrl(caller.avatar)}
              alt={caller.name}
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 text-primary p-2 rounded-full shadow-lg border border-slate-100 dark:border-white/10">
            <span className="material-symbols-outlined text-xl">
              {callType === CallType.Video ? "videocam" : "call"}
            </span>
          </div>
        </div>

        {/* Text Info */}
        <div className="text-center z-10 mb-10">
          <p className="text-primary font-bold uppercase tracking-widest text-xs mb-2">
            Incoming {callType === CallType.Video ? "Video" : "Voice"} Call
          </p>
          <h2 className="text-3xl font-black text-white leading-tight mb-2">
            {caller.name}
          </h2>
          <p className="text-slate-400 font-medium">is calling you...</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-8 w-full justify-center z-10">
          {/* Reject */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onReject}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-110 active:scale-95 group"
            >
              <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">
                call_end
              </span>
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Decline
            </span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onAccept}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-110 active:scale-95 group animate-pulse-subtle"
            >
              <span className="material-symbols-outlined text-3xl group-hover:-rotate-12 transition-transform">
                call
              </span>
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Accept
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
