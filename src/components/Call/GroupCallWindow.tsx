import React, { useEffect, useRef } from "react";
import { Participant } from "../../types/call.type";
import { CallType } from "../../types";
import {
  AudioOutlined,
  AudioMutedOutlined,
  VideoCameraOutlined,
  PhoneOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Avatar } from "antd";

interface GroupCallWindowProps {
  participants: Record<number, Participant>;
  localStream: MediaStream | null;
  callType: CallType | null;
  duration: number;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onEndCall: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
}

const GroupCallWindow: React.FC<GroupCallWindowProps> = ({
  participants,
  localStream,
  callType,
  duration,
  isAudioEnabled,
  isVideoEnabled,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const participantList = Object.values(participants);

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col text-white">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <TeamOutlined /> Cuộc gọi nhóm
          </h2>
          <span className="text-white/60 font-mono ml-2">
            {formatDuration(duration)}
          </span>
        </div>
        <div className="text-white/60 text-sm">
          {participantList.length + 1} người tham gia
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 p-6 overflow-hidden">
        <div
          className={`grid gap-4 h-full w-full ${
            participantList.length === 0
              ? "grid-cols-1"
              : participantList.length === 1
              ? "grid-cols-1 md:grid-cols-2"
              : participantList.length === 2
              ? "grid-cols-1 md:grid-cols-3"
              : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {/* Local Participant */}
          <ParticipantVideo
            name="Bạn"
            stream={localStream}
            isLocal
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
          />

          {/* Remote Participants */}
          {participantList.map((participant) => (
            <ParticipantVideo
              key={participant.userId}
              name={participant.userName}
              stream={participant.stream}
              avatar={participant.avatar}
              isAudioEnabled={participant.isAudioEnabled}
              isVideoEnabled={participant.isVideoEnabled}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="p-8 flex justify-center items-center gap-6 bg-gradient-to-t from-black to-transparent">
        <button
          onClick={onToggleAudio}
          className={`h-14 w-14 rounded-full flex items-center justify-center transition-all ${
            isAudioEnabled
              ? "bg-white/10 hover:bg-white/20"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {isAudioEnabled ? (
            <AudioOutlined className="text-xl" />
          ) : (
            <AudioMutedOutlined className="text-xl" />
          )}
        </button>

        <button
          onClick={onEndCall}
          className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg shadow-red-500/20"
        >
          <PhoneOutlined className="text-2xl rotate-[90deg]" />
        </button>

        {callType === CallType.Video && (
          <button
            onClick={onToggleVideo}
            className={`h-14 w-14 rounded-full flex items-center justify-center transition-all ${
              isVideoEnabled
                ? "bg-white/10 hover:bg-white/20"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            <VideoCameraOutlined className="text-xl" />
          </button>
        )}
      </div>
    </div>
  );
};

interface ParticipantVideoProps {
  name: string;
  stream: MediaStream | null;
  avatar?: string;
  isLocal?: boolean;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
}

const ParticipantVideo: React.FC<ParticipantVideoProps> = ({
  name,
  stream,
  avatar,
  isLocal,
  isAudioEnabled,
  isVideoEnabled,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-2xl bg-white/5 border border-white/10 overflow-hidden aspect-video flex items-center justify-center group shadow-2xl">
      {stream && (isLocal ? isVideoEnabled : true) ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          className={`h-full w-full object-cover ${
            isLocal ? "scale-x-[-1]" : ""
          }`}
        />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Avatar
            size={96}
            src={avatar}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl border-4 border-white/10"
          >
            {name.charAt(0).toUpperCase()}
          </Avatar>
          <p className="font-medium text-white/80">{name}</p>
        </div>
      )}

      {/* Overlay info */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 flex items-center gap-2">
          {name} {isLocal && "(Bạn)"}
        </div>
        <div className="flex gap-2">
          {!isAudioEnabled && (
            <div className="bg-red-500/80 backdrop-blur-sm p-1.5 rounded-full border border-white/10 flex items-center justify-center">
              <AudioMutedOutlined className="text-[10px]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupCallWindow;
