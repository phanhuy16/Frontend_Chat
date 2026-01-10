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
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Remote Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="flex-1 w-full h-full object-cover"
      />

      {/* Local Video (Picture in Picture) */}
      {localStream && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-20 right-4 w-32 h-48 bg-gray-900 rounded-lg border-2 border-white object-cover"
        />
      )}

      {/* Top Bar - User Info and Duration */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4 text-white">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {remoteUserName || "Cuộc gọi"}
          </h3>
          <span className="text-sm font-medium">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* No Video Indicator (Background when video is off) */}
      {!videoEnabled && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
          <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-gray-400">
              videocam_off
            </span>
          </div>
          <p className="text-white text-lg font-semibold">{remoteUserName}</p>
          <p className="text-gray-400 text-sm">Camera đã bị tắt</p>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 flex justify-center gap-6 z-20">
        {/* Mute/Unmute Audio Button */}
        <button
          onClick={onToggleAudio}
          className={`w-14 h-14 flex items-center justify-center rounded-full transition-colors ${
            audioEnabled
              ? "bg-white text-black hover:bg-gray-200"
              : "bg-red-500 text-white hover:bg-red-600 ring-2 ring-white/50"
          }`}
          title={audioEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
        >
          <span className="material-symbols-outlined text-2xl">
            {audioEnabled ? "mic" : "mic_off"}
          </span>
        </button>

        {/* Mute/Unmute Video Button */}
        <button
          onClick={onToggleVideo}
          className={`w-14 h-14 flex items-center justify-center rounded-full transition-colors ${
            videoEnabled
              ? "bg-white text-black hover:bg-gray-200"
              : "bg-red-500 text-white hover:bg-red-600 ring-2 ring-white/50"
          }`}
          title={videoEnabled ? "Tắt camera" : "Bật camera"}
        >
          <span className="material-symbols-outlined text-2xl">
            {videoEnabled ? "videocam" : "videocam_off"}
          </span>
        </button>

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          title="Kết thúc cuộc gọi"
        >
          <span className="material-symbols-outlined text-2xl">call_end</span>
        </button>
      </div>
    </div>
  );
};

export default VideoCallWindow;
