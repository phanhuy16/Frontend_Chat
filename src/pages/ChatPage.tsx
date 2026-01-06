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
import ChatWindow from "../components/Chat/ChatWindow";
import ConversationList from "../components/Chat/ConversationList";
import { CreateGroupModal } from "../components/Chat/CreateGroupModal";
import SearchUsersModal from "../components/Chat/SearchUsersModal";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import { useSignalR } from "../hooks/useSignalR";
import { FriendDto, StatusUser } from "../types";
import { REACT_APP_AVATAR_URL, SIGNALR_HUB_URL_CHAT } from "../utils/constants";
import { getStatusUserColor, getStatusUserLabel } from "../utils/enum-helpers";

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
    on("ReceiveMessage", async () => {
      await reloadConversations();
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
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                  title="Menu"
                >
                  <span className="material-symbols-outlined">more_vert</span>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-50">
                    {/* Friends List */}
                    <button
                      onClick={() => handleMenuClick("friends")}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors first:rounded-t-lg"
                    >
                      <span className="material-symbols-outlined text-lg">
                        people
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Friends</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          View your friends
                        </p>
                      </div>
                    </button>

                    {/* Friend Requests */}
                    <button
                      onClick={() => handleMenuClick("requests")}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border-t border-gray-200 dark:border-gray-700 relative"
                    >
                      <span className="material-symbols-outlined text-lg">
                        person_add
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Friend Requests</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Manage requests
                        </p>
                      </div>
                      {/* Badge in dropdown */}
                      {pendingRequestCount > 0 && (
                        <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                          {pendingRequestCount > 9 ? "9+" : pendingRequestCount}
                        </span>
                      )}
                    </button>

                    {/* New Chat */}
                    <button
                      onClick={() => handleMenuClick("new-chat")}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border-t border-gray-200 dark:border-gray-700"
                    >
                      <span className="material-symbols-outlined text-lg">
                        add_circle
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">New Chat</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Start a conversation
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => setShowCreateGroup(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border-t border-gray-200 dark:border-gray-700"
                    >
                      <span className="material-symbols-outlined text-lg">
                        group_add
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">New Group</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Start a conversation
                        </p>
                      </div>
                    </button>

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

                    {/* Settings */}
                    <button
                      onClick={() => handleMenuClick("settings")}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        settings
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Settings</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Profile & preferences
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full" ref={searchRef}>
              <input
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-background-light dark:bg-background-dark text-black dark:text-white placeholder-gray-500 border border-gray-200 dark:border-gray-700 focus:ring-primary focus:border-primary transition-all"
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
                  <div className="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-40 max-h-96 overflow-y-auto">
                    {/* Conversations Results */}
                    {searchResults.conversations.length > 0 && (
                      <>
                        <div className="sticky top-0 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                          Kết quả cuộc trò chuyện
                        </div>
                        {searchResults.conversations.map((conv) => {
                          const otherMember =
                            conv.conversationType === 1
                              ? conv.members.find((m) => m.id !== user.id)
                              : null;
                          return (
                            <button
                              key={conv.id}
                              onClick={() => {
                                setCurrentConversation(conv);
                                setSearchTerm("");
                                setShowSearchResults(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                            >
                              <div
                                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shrink-0"
                                style={{
                                  backgroundImage: `url("${
                                    otherMember?.avatar || ""
                                  }")`,
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-black dark:text-white truncate">
                                  {otherMember?.displayName || conv.groupName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  @{otherMember?.userName}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </>
                    )}

                    {/* Friends Results */}
                    {searchResults.friends.length > 0 && (
                      <>
                        <div className="sticky top-0 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                          Friends
                        </div>
                        {searchResults.friends.map((friend) => (
                          <button
                            key={friend.id}
                            onClick={() => {
                              handleOpenChatWithFriend(friend);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                          >
                            <div className="relative">
                              <div
                                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shrink-0"
                                style={{
                                  backgroundImage: `url("${
                                    friend.avatar || ""
                                  }")`,
                                }}
                              />
                              <div
                                className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white dark:border-gray-900"
                                style={{
                                  backgroundColor: getStatusUserColor(
                                    friend.status as StatusUser
                                  ),
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-black dark:text-white truncate">
                                {friend.displayName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {getStatusUserLabel(
                                  friend.status as StatusUser
                                )}
                              </p>
                            </div>
                          </button>
                        ))}
                      </>
                    )}

                    {/* No Results */}
                    {searchResults.conversations.length === 0 &&
                      searchResults.friends.length === 0 && (
                        <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                          <span className="material-symbols-outlined block text-3xl mb-2">
                            search_off
                          </span>
                          <p className="text-sm">No results found</p>
                        </div>
                      )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Conversation List */}
          <ConversationList
            conversations={filteredConversations}
            currentConversation={currentConversation}
            onSelectConversation={setCurrentConversation}
            user={user}
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
            /* Empty State */
            <div className="flex flex-1 flex-col items-center justify-center bg-white dark:bg-[#111418] p-8 text-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 mb-6">
                <span className="material-symbols-outlined !text-6xl text-primary">
                  chat_bubble
                </span>
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white">
                Your conversations live here
              </h3>
              <p className="mt-2 max-w-sm text-gray-600 dark:text-gray-400">
                Select a chat to see the conversation or start a new one with
                your friends and colleagues.
              </p>
              <button className="mt-6 flex h-10 min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary px-5 text-white font-display text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
                <span className="material-symbols-outlined !text-xl">add</span>
                <span className="truncate">Start a New Chat</span>
              </button>
            </div>
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
