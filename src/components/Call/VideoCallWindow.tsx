import React, { useEffect, useRef } from "react";

interface VideoCallWindowProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  remoteUserName: string | null;
  duration: number;
  onEndCall: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

const VideoCallWindow: React.FC<VideoCallWindowProps> = ({
  localStream,
  remoteStream,
  remoteUserName,
  duration,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  audioEnabled,
  videoEnabled,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Fix local video setup
  useEffect(() => {
    if (!localVideoRef.current || !localStream) return;
    localVideoRef.current.srcObject = localStream;

    // Chỉ gọi play() một lần, wrap trong async
    const playVideo = async () => {
      try {
        await localVideoRef.current?.play();
      } catch (err) {
        // Local video fail không ảnh hưởng, âm thanh vẫn hoạt động
        console.warn("Could not play local video:", err);
      }
    };

    // Delay 100ms to avoid race condition
    const timeoutId = setTimeout(playVideo, 100);

    return () => {
      clearTimeout(timeoutId);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, [localStream]);

  // Fix remote video setup
  useEffect(() => {
    if (!remoteVideoRef.current || !remoteStream) return;

    remoteVideoRef.current.srcObject = remoteStream;

    // Chỉ gọi play() một lần
    const playVideo = async () => {
      try {
        await remoteVideoRef.current?.play();
      } catch (err) {
        console.warn("Could not play remote video:", err);
      }
    };

    // Delay 100ms to avoid race condition
    const timeoutId = setTimeout(playVideo, 100);

    return () => {
      clearTimeout(timeoutId);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };
  }, [remoteStream]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden animate-fade-in">
      {/* Remote Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Grid Overlay Pattern (optional subtle texture) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-20" />

      {/* Top Bar - Glassmorphism */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20">
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-lg font-bold text-white tracking-wide shadow-sm">
              {remoteUserName || "Unknown User"}
            </h3>
          </div>
          <div className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 backdrop-blur-md">
            <span className="text-sm font-black text-white tracking-widest font-mono">
              {formatDuration(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Local Video - Floating & Draggable style (visual only) */}
      {localStream && (
        <div className="absolute bottom-32 right-6 w-36 h-56 z-30 group overflow-hidden rounded-2xl shadow-2xl border-2 border-white/20 hover:scale-105 transition-transform duration-300 bg-gray-900">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/40 backdrop-blur-sm text-[10px] font-bold text-white">
            YOU
          </div>
        </div>
      )}

      {/* No Video Indicator */}
      {!videoEnabled && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-3xl z-10 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <div className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative shadow-2xl">
              <span className="material-symbols-outlined text-5xl text-white/50">
                videocam_off
              </span>
            </div>
          </div>
          <p className="text-white text-2xl font-bold tracking-tight mb-2">
            {remoteUserName}
          </p>
          <p className="text-white/50 text-sm font-medium uppercase tracking-widest">
            Camera Off
          </p>
        </div>
      )}

      {/* Bottom Controls - Floating Glass Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-auto">
        <div className="flex items-center gap-4 bg-black/30 backdrop-blur-2xl border border-white/10 p-4 rounded-[2rem] shadow-2xl hover:bg-black/40 transition-colors duration-300">
          {/* Mute/Unmute Audio */}
          <button
            onClick={onToggleAudio}
            className={`w-14 h-14 flex items-center justify-center rounded-full transition-all duration-300 group ${
              audioEnabled
                ? "bg-white/10 text-white hover:bg-white/20 border border-white/5"
                : "bg-red-500/80 text-white hover:bg-red-500 border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
            }`}
            title={audioEnabled ? "Tắt Micro" : "Bật Micro"}
          >
            <span className="material-symbols-outlined text-2xl group-active:scale-95 transition-transform">
              {audioEnabled ? "mic" : "mic_off"}
            </span>
          </button>

          {/* End Call - Large Primary Action */}
          <button
            onClick={onEndCall}
            className="w-20 h-20 flex items-center justify-center rounded-[2rem] bg-red-500 hover:bg-red-600 active:scale-95 transition-all duration-300 shadow-[0_0_30px_rgba(239,68,68,0.4)] mx-2 border-4 border-black/20"
            title="Kết thúc"
          >
            <span className="material-symbols-outlined text-4xl text-white">
              call_end
            </span>
          </button>

          {/* Mute/Unmute Video */}
          <button
            onClick={onToggleVideo}
            className={`w-14 h-14 flex items-center justify-center rounded-full transition-all duration-300 group ${
              videoEnabled
                ? "bg-white/10 text-white hover:bg-white/20 border border-white/5"
                : "bg-red-500/80 text-white hover:bg-red-500 border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
            }`}
            title={videoEnabled ? "Tắt Camera" : "Bật Camera"}
          >
            <span className="material-symbols-outlined text-2xl group-active:scale-95 transition-transform">
              {videoEnabled ? "videocam" : "videocam_off"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallWindow;
