import React, { useEffect, useRef } from "react";
import { Button, Space, Tooltip } from "antd";
import {
  CloseOutlined,
  AudioMutedOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  StopOutlined,
} from "@ant-design/icons";

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

  // Setup local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;

      // Ensure autoplay works
      localVideoRef.current.play().catch((err) => {
        console.error("Error playing local video:", err);
      });
    }

    return () => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, [localStream]);

  // Setup remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("📺 Setting remote stream:", remoteStream.id);
      console.log("🔊 Remote audio tracks:", remoteStream.getAudioTracks());
      console.log("📹 Remote video tracks:", remoteStream.getVideoTracks());

      remoteVideoRef.current.srcObject = remoteStream;

      // Ensure autoplay works
      remoteVideoRef.current.play().catch((err) => {
        console.error("Error playing remote video:", err);
      });
    }

    return () => {
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

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 flex justify-center gap-4">
        <Space size="large">
          {/* Mute/Unmute Audio Button */}
          <Tooltip
            title={audioEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
            placement="top"
          >
            <Button
              shape="circle"
              size="large"
              icon={audioEnabled ? <AudioOutlined /> : <AudioMutedOutlined />}
              onClick={onToggleAudio}
              className={`${
                audioEnabled
                  ? "bg-white text-black hover:bg-gray-200"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
              aria-label={audioEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
            />
          </Tooltip>

          {/* Mute/Unmute Video Button */}
          <Tooltip
            title={videoEnabled ? "Tắt camera" : "Bật camera"}
            placement="top"
          >
            <Button
              shape="circle"
              size="large"
              icon={videoEnabled ? <VideoCameraOutlined /> : <StopOutlined />}
              onClick={onToggleVideo}
              className={`${
                videoEnabled
                  ? "bg-white text-black hover:bg-gray-200"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
              aria-label={videoEnabled ? "Tắt camera" : "Bật camera"}
            />
          </Tooltip>

          {/* End Call Button */}
          <Tooltip title="Kết thúc cuộc gọi" placement="top">
            <Button
              danger
              shape="circle"
              size="large"
              icon={<CloseOutlined />}
              onClick={onEndCall}
              aria-label="Kết thúc cuộc gọi"
            />
          </Tooltip>
        </Space>
      </div>

      {/* No Video Indicator */}
      {!videoEnabled && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mb-4">
            <StopOutlined className="text-4xl text-gray-400" />
          </div>
          <p className="text-white text-lg font-semibold">{remoteUserName}</p>
          <p className="text-gray-400 text-sm">Camera đã bị tắt</p>
        </div>
      )}
    </div>
  );
};

export default VideoCallWindow;
