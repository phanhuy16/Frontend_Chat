import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { userApi } from "../../api/user.api";
import { REACT_APP_AVATAR_URL } from "../../utils/constants";
import { conversationApi } from "../../api/conversation.api";
import { useChat } from "../../hooks/useChat";
import SidebarNav from "../Chat/SidebarNav";
import SearchUsersModal from "../Chat/SearchUsersModal";
import { CreateGroupModal } from "../Chat/CreateGroupModal";
import GlobalSearch from "../Search/GlobalSearch";
import { useCallContext } from "../../context/CallContext";
import AudioCallWindow from "../Call/AudioCallWindow";
import CallModal from "../Call/CallModal";
import GroupCallWindow from "../Call/GroupCallWindow";
import IncomingCallModal from "../Call/IncomingCallModal";
import VideoCallWindow from "../Call/VideoCallWindow";
import { CallType, ConversationType } from "../../types";
import BottomNav from "../Chat/BottomNav";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversations, setConversations } = useChat();
  const [avatar, setAvatar] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [searchGlobal, setSearchGlobal] = useState(false);
  const location = useLocation();
  // Only hide if we are inside a specific conversation (URL matches /chat/xyz)
  // If we are at /chat (conversation list only), we still show the button
  const isConversationOpen = location.pathname.startsWith("/chat/");

  const handleAiClick = async () => {
    if (!user) return;

    // 1. Check if AI conversation already exists
    const existingAiConv = conversations.find(
      (c) =>
        c.conversationType === ConversationType.Direct &&
        c.members.some((m) => m.userName === "ai_bot"),
    );

    if (existingAiConv) {
      navigate(`/chat/${existingAiConv.id}`);
      return;
    }

    // 2. If not, find the AI bot user
    try {
      const searchResult = await userApi.searchUsers("ai_bot");
      const aiBotUser = searchResult.find((u) => u.userName === "ai_bot");

      if (aiBotUser) {
        // 3. Create new conversation
        const newConv = await conversationApi.createDirectConversation({
          userId1: user.id,
          userId2: aiBotUser.id,
        });
        // Check if it already exists in the list before adding
        if (!conversations.some((c) => c.id === newConv.id)) {
          setConversations((prev) => [newConv, ...prev]);
        }
        navigate(`/chat/${newConv.id}`);
      } else {
        console.error("AI Bot user found not found in search");
      }
    } catch (error) {
      console.error("Failed to setup AI chat", error);
    }
  };

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchGlobal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!user) return null;

  return (
    <div className="relative flex h-screen w-full bg-transparent overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex h-full w-full p-0 lg:p-2 gap-0 lg:gap-2 overflow-hidden flex-col md:flex-row">
        {/* Column 1: Primary Navigation (Desktop/Tablet) */}
        <SidebarNav
          user={user}
          avatar={avatar}
          onNewChat={() => setShowSearchModal(true)}
          onNewGroup={() => setShowCreateGroup(true)}
          onGlobalSearch={() => setSearchGlobal(true)}
        />

        {/* Dynamic Content Columns */}
        <div className="flex-1 flex gap-0 lg:gap-4 overflow-hidden mb-16 md:mb-0">
          {children}
        </div>

        {/* Bottom Navigation (Mobile) */}
        <BottomNav />
      </div>

      {/* Global AI FAB - Only show if NOT in a specific conversation on mobile */}
      {!isConversationOpen && (
        <button
          onClick={handleAiClick}
          className="fixed bottom-20 md:bottom-10 right-6 md:right-10 w-12 h-12 bg-gradient-to-tr from-primary to-primary-dark rounded-full shadow-lg shadow-primary/30 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-300 z-[100] group animate-bounce-in"
          title="Chat with AI Assistant"
        >
          <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">
            smart_toy
          </span>
          <span className="absolute right-full mr-3 px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
            Ask AI
          </span>
        </button>
      )}

      <SearchUsersModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={reloadConversations}
      />
      {searchGlobal && (
        <GlobalSearch
          onClose={() => setSearchGlobal(false)}
          onSelectMessage={(cid, mid) => {
            navigate(`/chat/${cid}`);
            setSearchGlobal(false);
            // We might need to pass messageId to highlight it,
            // but the current ChatWindow handles search highlight via state.
            // For now, navigating to chat is the priority.
          }}
          onSelectUser={(uid) => {
            navigate(`/profile/${uid}`);
            setSearchGlobal(false);
          }}
          onSelectFile={(url) => {
            window.open(url, "_blank");
            setSearchGlobal(false);
          }}
        />
      )}

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
