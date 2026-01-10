import React, { useEffect, useState } from "react";
import SidebarNav from "./SidebarNav";
import { useAuth } from "../../hooks/useAuth";
import { userApi } from "../../api/user.api";
import { REACT_APP_AVATAR_URL } from "../../utils/constants";
import SearchUsersModal from "./SearchUsersModal";
import { CreateGroupModal } from "./CreateGroupModal";
import { conversationApi } from "../../api/conversation.api";
import { useChat } from "../../hooks/useChat";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const { setConversations } = useChat();
  const [avatar, setAvatar] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

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
    </div>
  );
};

export default MainLayout;
