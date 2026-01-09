import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { conversationApi } from "../api/conversation.api";
import { friendApi } from "../api/friend.api";
import { userApi } from "../api/user.api";
import ChatEmptyState from "../components/Chat/ChatEmptyState";
import ChatPageDropdownMenu from "../components/Chat/ChatPageDropdownMenu";
import ChatPageSearchResults from "../components/Chat/ChatPageSearchResults";
import ChatWindow from "../components/Chat/ChatWindow";
import ConversationList from "../components/Chat/ConversationList";
import { CreateGroupModal } from "../components/Chat/CreateGroupModal";
import SearchUsersModal from "../components/Chat/SearchUsersModal";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import { useSignalR } from "../hooks/useSignalR";
import { FriendDto, Conversation } from "../types";
import { REACT_APP_AVATAR_URL, SIGNALR_HUB_URL_CHAT } from "../utils/constants";

interface ChatPageProps {
  pendingRequestCount?: number;
}

const ChatPage: React.FC<ChatPageProps> = ({ pendingRequestCount = 0 }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    conversations,
    currentConversation,
    setConversations,
    setCurrentConversation,
  } = useChat();
  const { isConnected, on } = useSignalR(SIGNALR_HUB_URL_CHAT as string);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<{ [key: number]: number }>(
    {}
  );

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const reloadConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const updatedConversations = await conversationApi.getUserConversations(
        user.id
      );
      setConversations(updatedConversations);
    } catch (err) {
      console.error("Failed to reload conversations:", err);
    }
  }, [user?.id, setConversations]);

  const handleMenuClick = (action: string) => {
    setIsDropdownOpen(false);
    switch (action) {
      case "friends":
        navigate("/friends/list");
        break;
      case "requests":
        navigate("/friends/requests");
        break;
      case "settings":
        navigate("/settings");
        break;
      case "new-chat":
        setShowSearchModal(true);
        break;
      case "create-group":
        setShowCreateGroup(true);
        break;
    }
  };

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
        .flatMap((c) => c.members.map((m) => m.id))
    );

    const filteredFriends = friends.filter(
      (friend) =>
        !conversationUserIds.has(friend.id) &&
        (friend.displayName.toLowerCase().includes(searchLower) ||
          friend.userName.toLowerCase().includes(searchLower))
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
      setCurrentConversation(newConversation);
      setSearchTerm("");
      setShowSearchResults(false);
      toast.success("Chat opened!");
    } catch (err) {
      toast.error("Failed to open chat");
      console.error(err);
    }
  };

  // Handle selecting conversation from search
  const handleSelectConversation = (conv: Conversation) => {
    setCurrentConversation(conv);
    setSearchTerm("");
    setShowSearchResults(false);

    // Reset unread count for this conversation
    setUnreadCounts((prev) => ({
      ...prev,
      [conv.id]: 0,
    }));
  };

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

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

  // Listen for SignalR conversation updates
  useEffect(() => {
    on("ReceiveMessage", async (data: any) => {
      await reloadConversations();

      // Update unread count if not in current conversation AND message exists
      // Note: message might be just a notification, ideally we check message.conversationId
      // The previous on("ReceiveMessage") callback didn't have arguments in the original code,
      // but SignalR typically sends arguments. We assume message object here.
      // If the event doesn't pass data, we can't know which conv it is.
      // Checking original ChatPage.tsx: it was `on("ReceiveMessage", async () => { ... })`.
      // Usage in implementation plan assumed message arg.
      // Let's modify to `on("ReceiveMessage", async (data: any) => { ... })`

      if (
        data &&
        data.conversationId &&
        currentConversation?.id !== data.conversationId
      ) {
        setUnreadCounts((prev) => ({
          ...prev,
          [data.conversationId]: (prev[data.conversationId] || 0) + 1,
        }));
      }
    });

    on("NewConversationCreated", async () => {
      if (user?.id) {
        try {
          const updatedConversations =
            await conversationApi.getUserConversations(user.id);
          setConversations(updatedConversations);
        } catch (err) {
          console.error("Failed to reload conversations:", err);
        }
      }
    });

    on("AddedToConversation", async (data: any) => {
      if (user?.id) {
        try {
          const updatedConversations =
            await conversationApi.getUserConversations(user.id);
          setConversations(updatedConversations);
          await reloadConversations();
        } catch (err) {
          console.error("Failed to reload conversations:", err);
        }
      }
    });

    on("RemovedFromConversation", async (data: any) => {
      if (user?.id) {
        try {
          const updatedConversations =
            await conversationApi.getUserConversations(user.id);
          setConversations(updatedConversations);

          // If removed from current conversation, clear it
          if (currentConversation?.id === data.ConversationId) {
            setCurrentConversation(null);
          }
        } catch (err) {
          console.error("Failed to reload conversations:", err);
        }
      }
    });
  }, [
    on,
    user?.id,
    setConversations,
    currentConversation,
    setCurrentConversation,
    reloadConversations,
  ]);

  // Fix: The 'data' variable in ReceiveMessage above might be undefined if not defined in callback parameters
  // I need to correct that part of the code before writing.

  useEffect(() => {
    const loadAvatar = async () => {
      const data = await userApi.getUserById(user!.id);
      setAvatar(`${REACT_APP_AVATAR_URL}${data.avatar}`);
    };

    loadAvatar();
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // Filter conversations based on search term
  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchTerm.toLowerCase();
    if (conv.conversationType === 1) {
      // Direct chat
      const otherMember = conv.members.find((m) => m.id !== user.id);
      return (
        otherMember?.displayName.toLowerCase().includes(searchLower) || false
      );
    }
    return conv.groupName?.toLowerCase().includes(searchLower) || false;
  });

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-hidden">
      <div className="flex h-full w-full">
        {/* Sidebar Navigation */}
        <aside className="flex flex-col w-full max-w-xs border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111418] shrink-0">
          <div className="flex flex-col gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
            {/* User Profile */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                  style={{ backgroundImage: `url("${avatar}")` }}
                />
                <div className="flex flex-col">
                  <h1 className="text-black dark:text-white text-base font-medium leading-normal">
                    {user.displayName}
                  </h1>
                  <p className="text-[#64748b] dark:text-[#9dabb9] text-sm font-normal leading-normal">
                    {user.status === 1
                      ? "Online"
                      : user.status === 2
                      ? "Offline"
                      : "Away"}
                  </p>
                </div>
              </div>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                  title="Menu"
                >
                  <span className="material-symbols-outlined">more_vert</span>
                </button>

                {/* Dropdown Menu Component */}
                <ChatPageDropdownMenu
                  isOpen={isDropdownOpen}
                  pendingRequestCount={pendingRequestCount}
                  onMenuClick={handleMenuClick}
                />
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full" ref={searchRef}>
              <input
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-input-light dark:bg-input-dark text-black dark:text-white placeholder-gray-500 border border-gray-200 dark:border-gray-700 focus:ring-primary focus:border-primary transition-all"
                placeholder="Search chats..."
                type="search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchResults(e.target.value.trim() !== "");
                }}
                onFocus={() => setShowSearchResults(searchTerm.trim() !== "")}
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                search
              </span>
              {loadingFriends ? (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <div className="animate-spin mb-4">
                      <span className="material-symbols-outlined text-4xl">
                        sync
                      </span>
                    </div>
                    <p className="text-lg">Đang tìm kiếm...</p>
                  </div>
                </div>
              ) : (
                showSearchResults && (
                  <ChatPageSearchResults
                    searchResults={searchResults}
                    user={user}
                    onSelectConversation={handleSelectConversation}
                    onSelectFriend={handleOpenChatWithFriend}
                  />
                )
              )}
            </div>
          </div>

          {/* Conversation List */}
          <ConversationList
            conversations={filteredConversations}
            currentConversation={currentConversation}
            onSelectConversation={(conv) => {
              setCurrentConversation(conv);
              // Reset unread count
              setUnreadCounts((prev) => ({
                ...prev,
                [conv.id]: 0,
              }));
            }}
            user={user}
            unreadCounts={unreadCounts}
          />
        </aside>

        {/* Main Chat Area */}
        <main className="flex flex-1 flex-col h-full">
          {isConnected && currentConversation ? (
            <ChatWindow conversation={currentConversation} />
          ) : !isConnected ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div className="animate-spin mb-4">
                  <span className="material-symbols-outlined text-4xl">
                    sync
                  </span>
                </div>
                <p className="text-lg">Đang kết nối...</p>
              </div>
            </div>
          ) : (
            /* Empty State Component */
            <ChatEmptyState onStartNewChat={() => setShowSearchModal(true)} />
          )}
        </main>
      </div>

      {/* Search Users Modal */}
      <SearchUsersModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={async () => {
          // Reload conversations
          if (user?.id) {
            const data = await conversationApi.getUserConversations(user.id);
            setConversations(data);
          }
        }}
      />
    </div>
  );
};

export default ChatPage;
