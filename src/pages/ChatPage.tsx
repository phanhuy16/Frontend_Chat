import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { conversationApi } from "../api/conversation.api";
import { friendApi } from "../api/friend.api";
import { userApi } from "../api/user.api";
import ChatEmptyState from "../components/Chat/ChatEmptyState";
import ChatPageSearchResults from "../components/Chat/ChatPageSearchResults";
import ChatWindow from "../components/Chat/ChatWindow";
import ConversationList from "../components/Chat/ConversationList";
import { CreateGroupModal } from "../components/Chat/CreateGroupModal";
import ChatFolders, { FolderType } from "../components/Chat/ChatFolders";
import SearchUsersModal from "../components/Chat/SearchUsersModal";
import GlobalSearchModal from "../components/Chat/GlobalSearchModal";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import { useSignalR } from "../hooks/useSignalR";
import { useSignalRHandlers } from "../hooks/useSignalRHandlers";
import { useFriendRequest } from "../context/FriendRequestContext";
import { FriendDto, Conversation, CallType } from "../types";
import { REACT_APP_AVATAR_URL, SIGNALR_HUB_URL_CHAT } from "../utils/constants";
import { useTranslation } from "react-i18next";

interface ChatPageProps {
  pendingRequestCount?: number;
}

const ChatPage: React.FC<ChatPageProps> = ({ pendingRequestCount = 0 }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const {
    conversations,
    currentConversation,
    setConversations,
    setCurrentConversation,
    updateConversation,
    drafts,
  } = useChat();
  const { t } = useTranslation();

  const { isConnected, on, off } = useSignalR(SIGNALR_HUB_URL_CHAT as string);
  const { incrementCount, refreshCount } = useFriendRequest();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<{ [key: number]: number }>(
    {},
  );
  const [activeFolder, setActiveFolder] = useState<FolderType>("all");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    navigate("/chat");
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const reloadConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const updatedConversations = await conversationApi.getUserConversations(
        user.id,
      );
      setConversations(updatedConversations);
    } catch (err) {
      console.error("Failed to reload conversations:", err);
    }
  }, [user?.id, setConversations]);

  const loadFriends = async () => {
    try {
      setLoadingFriends(true);
      const data = await friendApi.getFriendsList();
      setFriends(data);
    } catch (err) {
      console.error("Error loading friends:", err);
    } finally {
      setLoadingFriends(false);
    }
  };

  // Filter search results (conversations + friends)
  const searchResults = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    if (!searchTerm.trim()) {
      return { conversations: [], friends: [] };
    }

    // Filter conversations
    const filteredConversations = conversations.filter((conv) => {
      if (conv.isArchived) return false;

      if (conv.conversationType === 1) {
        const otherMember = conv.members.find((m) => m.id !== user!.id);
        return (
          otherMember?.displayName.toLowerCase().includes(searchLower) ||
          otherMember?.userName.toLowerCase().includes(searchLower)
        );
      }
      return conv.groupName?.toLowerCase().includes(searchLower);
    });

    // Filter friends (who are not already in conversations)
    const conversationUserIds = new Set(
      conversations
        .filter((c) => c.conversationType === 1)
        .flatMap((c) => c.members.map((m) => m.id)),
    );

    const filteredFriends = friends.filter(
      (friend) =>
        !conversationUserIds.has(friend.id) &&
        (friend.displayName.toLowerCase().includes(searchLower) ||
          friend.userName.toLowerCase().includes(searchLower)),
    );

    return { conversations: filteredConversations, friends: filteredFriends };
  }, [searchTerm, conversations, friends, user]);

  // Handle opening chat with friend
  const handleOpenChatWithFriend = async (friend: FriendDto) => {
    if (!user) return;

    try {
      const newConversation = await conversationApi.createDirectConversation({
        userId1: user.id,
        userId2: friend.id,
      });

      setConversations([newConversation, ...conversations]);
      navigate(`/chat/${newConversation.id}`);
      setSearchTerm("");
      setShowSearchResults(false);
      toast.success(t("toast.opening_chat"));
    } catch (err) {
      toast.error(t("toast.error_open_chat"));
      console.error(err);
    }
  };

  // Handle selecting conversation from search
  const handleSelectConversation = (conv: Conversation) => {
    navigate(`/chat/${conv.id}`);
    setSearchTerm("");
    setShowSearchResults(false);

    setUnreadCounts((prev) => ({
      ...prev,
      [conv.id]: 0,
    }));
  };

  const handleTogglePin = async (conv: Conversation) => {
    if (!user) return;
    try {
      const { isPinned } = await conversationApi.togglePin(conv.id, user.id);
      updateConversation(conv.id, { isPinned });
      toast.success(
        isPinned ? t("chat_list.menu.pin") : t("chat_list.menu.unpin"),
      );
    } catch (err) {
      toast.error(t("toast.action_failed"));
      console.error(err);
    }
  };

  const handleToggleArchive = async (conv: Conversation) => {
    if (!user) return;
    try {
      const { isArchived } = await conversationApi.toggleArchive(
        conv.id,
        user.id,
      );

      // If archived, remove from main list
      if (isArchived) {
        setConversations((prev) => prev.filter((c) => c.id !== conv.id));
        if (currentConversation?.id === conv.id) {
          setCurrentConversation(null);
          navigate("/chat");
        }
      } else {
        // This case might not happen in main ChatPage as we only filter out archived
        updateConversation(conv.id, { isArchived });
      }

      toast.success(
        isArchived
          ? t("chat_list.menu.archive")
          : t("chat_list.menu.unarchive"),
      );
    } catch (err) {
      toast.error(t("toast.action_failed"));
      console.error(err);
    }
  };

  const handleDeleteConversation = async (conv: Conversation) => {
    if (!user) return;
    if (
      !window.confirm(
        t("chat_list.menu.confirm_delete", {
          name: conv.groupName || t("chat_list.title"),
        }),
      )
    ) {
      return;
    }

    try {
      if (conv.conversationType === 1) {
        // Direct chat - currently just hide locally or show toast until backend supports hide
        // Assuming backend might have delete endpoint or we wait for feature
        toast.error(t("chat_list.menu.delete_direct_error"));
        return;
      }

      // Group chat
      await conversationApi.deleteGroupConversation(conv.id, user.id);
      setConversations((prev) => prev.filter((c) => c.id !== conv.id));
      if (currentConversation?.id === conv.id) {
        setCurrentConversation(null);
      }
      toast.success(t("chat_list.menu.delete"));
    } catch (err) {
      toast.error(t("toast.action_failed"));
      console.error(err);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    const loadConversations = async () => {
      if (user?.id) {
        try {
          const data = await conversationApi.getUserConversations(user.id);
          setConversations(data);
        } catch (err) {
          console.error("Failed to load conversations:", err);
        }
      }
    };

    loadConversations();
  }, [user, setConversations]);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const convIdNum = parseInt(conversationId);
      const existingConv = conversations.find((c) => c.id === convIdNum);
      if (existingConv) {
        if (currentConversation?.id !== convIdNum) {
          setCurrentConversation(existingConv);
        }
      } else {
        // If not found in current list, fetch it
        conversationApi
          .getConversation(convIdNum)
          .then((conv) => {
            setConversations((prev) => {
              if (prev.some((c) => c.id === conv.id)) return prev;
              return [conv, ...prev];
            });
            setCurrentConversation(conv);
          })
          .catch((err) => {
            console.error("Failed to fetch specific conversation:", err);
            toast.error("Conversation not found");
            navigate("/chat");
          });
      }
    }
  }, [
    conversationId,
    conversations,
    setCurrentConversation,
    setConversations,
    navigate,
    currentConversation?.id,
  ]);

  useSignalRHandlers(); // Centralized handlers

  // Global search keyboard shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Folder-based counts
  const folderCounts = useMemo(
    () => ({
      all: conversations.filter((c) => !c.isArchived).length,
      direct: conversations.filter(
        (c) => !c.isArchived && c.conversationType === 1,
      ).length,
      groups: conversations.filter(
        (c) => !c.isArchived && c.conversationType === 2,
      ).length,
      archived: conversations.filter((c) => c.isArchived).length,
    }),
    [conversations],
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // Filter conversations based on search term and active folder
  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchTerm.toLowerCase();

    // Search filtering
    const matchesSearch =
      conv.conversationType === 1
        ? conv.members
            .find((m) => m.id !== user.id)
            ?.displayName.toLowerCase()
            .includes(searchLower) || false
        : conv.groupName?.toLowerCase().includes(searchLower) || false;

    if (searchTerm.trim() && !matchesSearch) return false;

    // Folder filtering
    if (activeFolder === "archived") return conv.isArchived;

    if (conv.isArchived) {
      // Hide archived conversations unless it's the currently active one
      return conv.id === parseInt(conversationId || "0");
    }

    if (activeFolder === "direct") return conv.conversationType === 1;
    if (activeFolder === "groups") return conv.conversationType === 2;

    return true; // "all" folder
  });

  return (
    <div className="flex-1 flex gap-0 lg:gap-4 overflow-hidden h-full relative">
      {/* Column 2: Conversation List */}
      <aside
        className={`flex flex-col glass-effect lg:rounded-3xl shrink-0 overflow-hidden transition-all duration-300 ${
          conversationId ? "hidden md:flex" : "flex"
        } ${isSidebarCollapsed ? "w-0 md:w-0 opacity-0 pointer-events-none" : "w-full md:w-[320px] lg:w-[360px] opacity-100"}`}
      >
        <div className="flex flex-col gap-6 p-6 min-w-[320px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {t("chat_list.title")}
            </h2>
          </div>

          {/* Search */}
          <div className="relative w-full group" ref={searchRef}>
            <input
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-500 border-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 text-sm"
              placeholder={t("chat_list.search_placeholder")}
              type="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchResults(e.target.value.trim() !== "");
              }}
              onFocus={() => setShowSearchResults(searchTerm.trim() !== "")}
            />
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-lg">
              search
            </span>
            {showSearchResults && (
              <ChatPageSearchResults
                searchResults={searchResults}
                user={user}
                onSelectConversation={handleSelectConversation}
                onSelectFriend={handleOpenChatWithFriend}
              />
            )}
          </div>
        </div>

        <ChatFolders
          activeFolder={activeFolder}
          onFolderChange={setActiveFolder}
          counts={folderCounts}
        />

        {/* Conversation List */}
        <ConversationList
          conversations={filteredConversations}
          currentConversation={currentConversation}
          onSelectConversation={(conv) => {
            navigate(`/chat/${conv.id}`);
            setUnreadCounts((prev) => ({ ...prev, [conv.id]: 0 }));
          }}
          onTogglePin={handleTogglePin}
          onToggleArchive={handleToggleArchive}
          onDeleteConversation={handleDeleteConversation}
          user={user}
          unreadCounts={unreadCounts}
          drafts={drafts}
        />
      </aside>

      {/* Column 3: Main Chat Area */}
      <main
        className={`flex-1 flex flex-col glass-effect lg:rounded-3xl overflow-hidden relative transition-all duration-300 ${
          conversationId ? "flex" : "hidden md:flex"
        }`}
      >
        {isConnected && currentConversation ? (
          <ChatWindow
            conversation={currentConversation}
            onBack={handleBack}
            onToggleSidebar={toggleSidebar}
          />
        ) : !isConnected ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
            <p className="font-bold">{t("chat_list.connecting")}</p>
          </div>
        ) : (
          <ChatEmptyState onStartNewChat={() => setShowSearchModal(true)} />
        )}
      </main>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />
    </div>
  );
};

export default ChatPage;
