import React, { useEffect, useRef } from "react";
import { getAvatarUrl } from "../../utils/helpers";



interface AudioCallWindowProps {
  remoteStream: MediaStream | null;
  remoteUserName: string | null;
  remoteUserAvatar?: string;
  duration: number;
  onEndCall: () => void;
  onToggleAudio: () => void;
  audioEnabled: boolean;
}

const AudioCallWindow: React.FC<AudioCallWindowProps> = ({
  remoteStream,
  remoteUserName,
  remoteUserAvatar,
  duration,
  onEndCall,
  onToggleAudio,
  audioEnabled,
}) => {
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Setup remote audio stream
  useEffect(() => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl || !remoteStream) {
      console.warn("Remote audio ref or stream not available");
      return;
    }

    // Avoid interrupting if stream is already set
    if (audioEl.srcObject === remoteStream) {
      console.log("Stream already set, skipping");
      return;
    }

    // Set the stream
    audioEl.srcObject = remoteStream;

    // Ensure audio element plays
    const playAudio = async () => {
      try {
        await audioEl.play();
        console.log(" Remote audio playing");
      } catch (err: any) {
        // Ignore AbortError which happens when stream changes quickly
        if (err.name === "AbortError") {
          console.log("Play aborted (likely stream changed)");
        } else {
          console.error("Error playing remote audio:", err);
        }
      }
    };

    playAudio();

    return () => {
      if (audioEl) {
        audioEl.srcObject = null;
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
    <div className="fixed inset-0 bg-gradient-to-b from-blue-600 to-blue-800 z-50 flex flex-col items-center justify-center">
      {/*  Hidden audio element - chỉ để phát audio, không hiển thị */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
        onLoadedMetadata={() => {
          console.log(" Audio element metadata loaded");
        }}
        onPlay={() => {
          console.log("Audio element playing");
        }}
        onPause={() => {
          console.log("Audio element paused");
        }}
        onError={(e) => {
          console.error("Audio element error:", e);
        }}
      />

      {/* Call Avatar */}
      <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center mb-8 border-4 border-white/30">
        {remoteUserAvatar ? (
          <img
            src={getAvatarUrl(remoteUserAvatar)}
            alt={remoteUserName || "Caller"}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <span className="text-6xl text-white">♪</span>
          </div>
        )}
      </div>

      {/* Caller Name */}
      <h2 className="text-4xl font-bold text-white mb-4 text-center">
        {remoteUserName || "Cuộc gọi"}
      </h2>

      {/* Duration */}
      <div className="text-5xl font-light text-white mb-8 font-mono tracking-wider">
        {formatDuration(duration)}
      </div>

      {/* Audio Indicator */}
      <div
        className={`mb-12 px-6 py-3 rounded-full flex items-center gap-2 transition-all ${
          audioEnabled ? "bg-white/20 text-white" : "bg-red-500/30 text-red-100"
        }`}
      >
        {audioEnabled ? (
          <>
            <div className="animate-pulse">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5h3V9h2v3h3l-5 5zm6-4h-1v2h-2v-2h-2v-2h2v-2h2v2h1v2z" />
              </svg>
            </div>
            <span className="text-sm font-medium">Đang nói chuyện</span>
          </>
        ) : (
          <>
            <span className="text-lg">🔇</span>
            <span className="text-sm font-medium">Tắt âm</span>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-16 left-0 right-0 p-6 flex justify-center gap-6">
        {/* Toggle Mute */}
        <button
          onClick={onToggleAudio}
          className={`w-14 h-14 flex items-center justify-center rounded-full transition-colors ${
            audioEnabled
              ? "bg-white/20 text-white hover:bg-white/30 backdrop-blur-md"
              : "bg-red-500 text-white hover:bg-red-600 ring-2 ring-white/50"
          }`}
          title={audioEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
        >
          <span className="material-symbols-outlined text-2xl">
            {audioEnabled ? "mic" : "mic_off"}
          </span>
        </button>

        {/* End Call */}
        <button
          onClick={onEndCall}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg"
          title="Kết thúc cuộc gọi"
        >
          <span className="material-symbols-outlined text-2xl">call_end</span>
        </button>
      </div>

      {/* Floating Info */}
      <div className="absolute top-8 left-8 text-white/80 text-sm">
        <p>Cuộc gọi thoại</p>
      </div>
    </div>
  );
};

export default AudioCallWindow;
