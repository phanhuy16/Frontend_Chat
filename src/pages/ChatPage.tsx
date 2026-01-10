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
import ChatPageSearchResults from "../components/Chat/ChatPageSearchResults";
import ChatWindow from "../components/Chat/ChatWindow";
import ConversationList from "../components/Chat/ConversationList";
import { CreateGroupModal } from "../components/Chat/CreateGroupModal";
import SearchUsersModal from "../components/Chat/SearchUsersModal";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import { useSignalR } from "../hooks/useSignalR";
import { useFriendRequest } from "../context/FriendRequestContext";
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
  const { incrementCount, refreshCount } = useFriendRequest();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<{ [key: number]: number }>(
    {}
  );

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
      // Note: reloadConversations already fetches updated conversation data with correct unread counts
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

  // Listen for friend request notifications
  useEffect(() => {
    if (!isConnected) return;

    on(
      "FriendRequestReceived",
      (data: {
        SenderId: number;
        SenderName: string;
        SenderAvatar: string;
      }) => {
        console.log("Friend request received:", data);
        incrementCount();
        refreshCount();
        toast.success(`${data.SenderName} đã gửi lời mời kết bạn!`, {
          duration: 4000,
          icon: "👋",
        });
      }
    );
  }, [isConnected, on, incrementCount, refreshCount]);

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
    <div className="flex-1 flex gap-0 lg:gap-4 overflow-hidden h-full">
      {/* Column 2: Conversation List */}
      <aside className="flex flex-col w-full max-w-[320px] lg:max-w-[360px] glass-effect lg:rounded-3xl shrink-0 overflow-hidden transition-all duration-300">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Conversations
            </h2>
          </div>

          {/* Search */}
          <div className="relative w-full group" ref={searchRef}>
            <input
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-500 border-none focus:ring-2 focus:ring-primary/50 transition-all duration-300"
              placeholder="Search conversations..."
              type="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchResults(e.target.value.trim() !== "");
              }}
              onFocus={() => setShowSearchResults(searchTerm.trim() !== "")}
            />
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
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

        {/* Conversation List */}
        <ConversationList
          conversations={filteredConversations}
          currentConversation={currentConversation}
          onSelectConversation={(conv) => {
            setCurrentConversation(conv);
            setUnreadCounts((prev) => ({ ...prev, [conv.id]: 0 }));
          }}
          user={user}
          unreadCounts={unreadCounts}
        />
      </aside>

      {/* Column 3: Main Chat Area */}
      <main className="flex-1 flex flex-col glass-effect lg:rounded-3xl overflow-hidden relative transition-all duration-300">
        {isConnected && currentConversation ? (
          <ChatWindow conversation={currentConversation} />
        ) : !isConnected ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
            <p className="font-bold">Connecting...</p>
          </div>
        ) : (
          <ChatEmptyState onStartNewChat={() => setShowSearchModal(true)} />
        )}
      </main>
    </div>
  );
};

export default ChatPage;
