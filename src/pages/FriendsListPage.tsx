import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { formatDate } from "../utils/formatters";
import { useAuth } from "../hooks/useAuth";
import { FriendDto, StatusUser } from "../types";
import { useChat } from "../hooks/useChat";
import { friendApi } from "../api/friend.api";
import { conversationApi } from "../api/conversation.api";
import { getStatusUserColor, getStatusUserLabel } from "../utils/enum-helpers";
import { Modal } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons";

const { confirm } = Modal;

const FriendsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentConversation, setConversations, conversations } = useChat();

  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [removing, setRemoving] = useState<{ [key: number]: boolean }>({});
  const [filterStatus, setFilterStatus] = useState<
    "all" | "online" | "offline"
  >("all");

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const data = await friendApi.getFriendsList();
      setFriends(data);
    } catch (err) {
      setError("Failed to load friends");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Open chat with friend
  const handleOpenChat = async (friend: FriendDto) => {
    if (!user) return;

    try {
      const existingConversation = conversations.find(
        (conv) =>
          conv.conversationType === 1 &&
          conv.members.some((m) => m.id === friend.id)
      );

      if (existingConversation) {
        setCurrentConversation(existingConversation);
      } else {
        const newConversation = await conversationApi.createDirectConversation({
          userId1: user.id,
          userId2: friend.id,
        });

        setConversations([newConversation, ...conversations]);
        setCurrentConversation(newConversation);
      }

      navigate("/chat");
      toast.success("Chat opened!");
    } catch (err) {
      toast.error("Failed to open chat");
      console.error(err);
    }
  };

  // Remove friend
  const handleRemoveFriend = async (friendId: number, friendName: string) => {
    confirm({
      title: "Xác nhận xoá bạn bè",
      icon: <ExclamationCircleFilled style={{ color: "red" }} />,
      content: `Bạn có chắc chắn muốn xóa ${friendName} khỏi danh sách bạn bè của mình không?`,
      async onOk() {
        try {
          setRemoving((prev) => ({ ...prev, [friendId]: true }));
          await friendApi.removeFriend(friendId);

          setFriends((prev) => prev.filter((f) => f.id !== friendId));
          toast.success("Friend removed");
        } catch (err) {
          toast.error("Failed to remove friend");
          console.error(err);
        } finally {
          setRemoving((prev) => ({ ...prev, [friendId]: false }));
        }
      },
    });
  };

  // ✅ Filter friends
  const filteredFriends = friends.filter((friend) => {
    const matchesSearch =
      friend.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friend.userName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "online" && friend.status === StatusUser.Online) ||
      (filterStatus === "offline" && friend.status !== StatusUser.Online);

    return matchesSearch && matchesStatus;
  });

  const onlineCount = friends.filter(
    (f) => f.status === StatusUser.Online
  ).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#111418]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Friends
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {friends.length} friends • {onlineCount} online
            </p>
          </div>
          {/* Back Button */}
          <button
            onClick={() => navigate("/chat")}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
            title="Back to Chat"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder-gray-500 focus:ring-primary focus:border-primary transition-all"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              search
            </span>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as "all" | "online" | "offline")
            }
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-black dark:text-white focus:ring-primary focus:border-primary transition-all"
          >
            <option value="all">All</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin mb-4">
                <span className="material-symbols-outlined text-4xl text-primary">
                  sync
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Loading friends...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 p-4 rounded-lg">
            {error}
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
              <span className="material-symbols-outlined text-4xl text-gray-400">
                people_outline
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {searchTerm ? "No friends found" : "No friends yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              {searchTerm
                ? `Try searching with a different name`
                : `Start adding friends to begin chatting`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex flex-col p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:shadow-md transition-shadow"
              >
                {/* Friend Avatar & Info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div
                      className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-14 shrink-0"
                      style={{
                        backgroundImage: `url("${friend.avatar || ""}")`,
                      }}
                    />
                    {/* Status Indicator */}
                    <div
                      className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900"
                      style={{
                        backgroundColor: getStatusUserColor(
                          friend.status as StatusUser
                        ),
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-black dark:text-white truncate">
                      {friend.displayName}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      @{friend.userName}
                    </p>
                    <p
                      className="text-xs font-medium mt-1"
                      style={{
                        color: getStatusUserColor(friend.status as StatusUser),
                      }}
                    >
                      {getStatusUserLabel(friend.status as StatusUser)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {/* ✅ Chat Button */}
                  <button
                    onClick={() => handleOpenChat(friend)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">
                      message
                    </span>
                    <span className="truncate">Chat</span>
                  </button>

                  {/* ✅ Remove Button */}
                  <button
                    onClick={() =>
                      handleRemoveFriend(friend.id, friend.displayName)
                    }
                    disabled={removing[friend.id]}
                    className="flex items-center justify-center px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                    title="Remove friend"
                  >
                    <span className="material-symbols-outlined text-base">
                      person_remove
                    </span>
                  </button>
                </div>

                {/* Friend Since */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  Friends since {formatDate(friend.becomeFriendAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsListPage;
