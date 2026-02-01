import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { userApi } from "../../api/user.api";
import { REACT_APP_AVATAR_URL } from "../../utils/constants";
import { conversationApi } from "../../api/conversation.api";
import { useChat } from "../../hooks/useChat";
import SidebarNav from "../Chat/SidebarNav";
import SearchUsersModal from "../Chat/SearchUsersModal";
import { CreateGroupModal } from "../Chat/CreateGroupModal";
import GlobalSearchModal from "../Chat/GlobalSearchModal";
import { useCallContext } from "../../context/CallContext";
import AudioCallWindow from "../Call/AudioCallWindow";
import CallModal from "../Call/CallModal";
import GroupCallWindow from "../Call/GroupCallWindow";
import IncomingCallModal from "../Call/IncomingCallModal";
import VideoCallWindow from "../Call/VideoCallWindow";
import { CallType } from "../../types";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const { setConversations } = useChat();
  const [avatar, setAvatar] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [searchGlobal, setSearchGlobal] = useState(false);

  const {
    callState,
    incomingCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
  } = useCallContext();

  useEffect(() => {
    const loadAvatar = async () => {
      if (user?.id) {
        const data = await userApi.getUserById(user.id);
        setAvatar(`${REACT_APP_AVATAR_URL}${data.avatar}`);
      }
    };
    loadAvatar();
  }, [user]);

  const reloadConversations = async () => {
    if (user?.id) {
      const data = await conversationApi.getUserConversations(user.id);
      setConversations(data);
    }
  };

  if (!user) return null;

  return (
    <div className="relative flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex h-full w-full p-0 lg:p-2 gap-0 lg:gap-2 overflow-hidden">
        {/* Column 1: Primary Navigation */}
        <SidebarNav
          user={user}
          avatar={avatar}
          onNewChat={() => setShowSearchModal(true)}
          onNewGroup={() => setShowCreateGroup(true)}
          onGlobalSearch={() => setSearchGlobal(true)}
        />

        {/* Dynamic Content Columns */}
        <div className="flex-1 flex gap-0 lg:gap-4 overflow-hidden">
          {children}
        </div>
      </div>

      <SearchUsersModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={reloadConversations}
      />
      <GlobalSearchModal
        isOpen={searchGlobal}
        onClose={() => setSearchGlobal(false)}
      />

      {/* Global Call UI */}
      {incomingCall && (
        <IncomingCallModal
          caller={{
            id: incomingCall.callerId,
            name: incomingCall.callerName,
            avatar: incomingCall.callerAvatar,
          }}
          callType={
            incomingCall.callType === "Video" ? CallType.Video : CallType.Audio
          }
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {callState.callStatus === "ringing" && !incomingCall && (
        <CallModal
          callState={callState}
          isIncoming={false}
          onAnswer={acceptCall}
          onReject={rejectCall}
          onEnd={endCall}
          callerAvatar={callState.remoteUserAvatar}
        />
      )}

      {callState.callStatus === "connected" && (
        <>
          {callState.isGroup ? (
            <GroupCallWindow
              participants={callState.participants}
              localStream={callState.localStream}
              callType={callState.callType}
              duration={callState.duration}
              isAudioEnabled={callState.isAudioEnabled}
              isVideoEnabled={callState.isVideoEnabled}
              onEndCall={endCall}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
            />
          ) : callState.callType === CallType.Video ? (
            <VideoCallWindow
              localStream={callState.localStream}
              remoteStream={callState.remoteStream}
              remoteUserName={callState.remoteUserName}
              duration={callState.duration}
              onEndCall={endCall}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              audioEnabled={callState.isAudioEnabled}
              videoEnabled={callState.isVideoEnabled}
            />
          ) : (
            <AudioCallWindow
              remoteStream={callState.remoteStream}
              remoteUserName={callState.remoteUserName}
              remoteUserAvatar={callState.remoteUserAvatar}
              duration={callState.duration}
              onEndCall={endCall}
              onToggleAudio={toggleAudio}
              audioEnabled={callState.isAudioEnabled}
            />
          )}
        </>
      )}
    </div>
  );
};

export default MainLayout;
