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
import SearchUsersModal from "../components/Chat/SearchUsersModal";
import { useTranslation } from "react-i18next";

const { confirm } = Modal;

const FriendsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentConversation, setConversations, conversations } = useChat();
  const { t } = useTranslation();

  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [removing, setRemoving] = useState<{ [key: number]: boolean }>({});

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

  const handleOpenChat = async (friend: FriendDto) => {
    if (!user) return;

    try {
      const existingConversation = conversations.find(
        (conv) =>
          conv.conversationType === 1 &&
          conv.members.some((m) => m.id === friend.id),
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
      toast.success(t("toast.opening_chat"));
    } catch (err) {
      toast.error(t("toast.error_open_chat"));
      console.error(err);
    }
  };

  const handleRemoveFriend = async (friendId: number, friendName: string) => {
    confirm({
      title: t("friends.confirm_remove_title"),
      icon: <ExclamationCircleFilled style={{ color: "red" }} />,
      content: t("friends.confirm_remove_content", { name: friendName }),
      async onOk() {
        try {
          setRemoving((prev) => ({ ...prev, [friendId]: true }));
          await friendApi.removeFriend(friendId);
          setFriends((prev) => prev.filter((f) => f.id !== friendId));
          toast.success(t("toast.friend_removed"));
        } catch (err) {
          toast.error(t("toast.error_remove_friend"));
          console.error(err);
        } finally {
          setRemoving((prev) => ({ ...prev, [friendId]: false }));
        }
      },
    });
  };

  // Group friends by the first letter of their display name
  const filteredFriends = friends.filter(
    (friend) =>
      friend.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friend.userName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const groupedFriends = filteredFriends.reduce(
    (groups, friend) => {
      const letter = friend.displayName.charAt(0).toUpperCase();
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(friend);
      return groups;
    },
    {} as { [key: string]: FriendDto[] },
  );

  const sortedLetters = Object.keys(groupedFriends).sort();

  return (
    <div className="flex-1 flex flex-col h-full glass-effect lg:rounded-3xl overflow-hidden animate-fade-in">
      {/* Header Area */}
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t("friends.title")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {t("friends.count_friends", { count: friends.length })}
            </p>
          </div>
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 text-[10px]"
          >
            <span className="material-symbols-outlined text-[10px]">
              person_add
            </span>
            {t("friends.add_friend")}
          </button>
        </div>

        {/* Premium Search Bar */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
          <div className="relative flex items-center bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-1.5 transition-all focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-primary/50 h-8">
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 mr-2 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder={t("friends.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-[11px]"
            />
          </div>
        </div>
      </div>

      {/* Friends List Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">
              {t("friends.loading")}
            </p>
          </div>
        ) : sortedLetters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">
                group_off
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {searchTerm ? t("friends.no_results") : t("friends.no_friends")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs font-medium">
              {searchTerm
                ? t("friends.no_results_desc", { term: searchTerm })
                : t("friends.no_friends_desc")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 mt-4">
            {sortedLetters.map((letter) => (
              <div key={letter} className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-primary font-black text-lg">
                    {letter}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-700/50 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {groupedFriends[letter].map((friend) => (
                    <div
                      key={friend.id}
                      className="group relative flex items-center gap-4 p-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/40 rounded-2xl hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {friend.avatar ? (
                          <div
                            className="w-11 h-11 rounded-xl bg-cover bg-center shadow-md bg-slate-200"
                            style={{
                              backgroundImage: `url("${friend.avatar}")`,
                            }}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/20">
                            {friend.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"
                          style={{
                            backgroundColor: getStatusUserColor(
                              friend.status as StatusUser,
                            ),
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                          {friend.displayName}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                          @{friend.userName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                            {t("friends.friend_since", {
                              date: formatDate(friend.becomeFriendAt),
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2">
                        <button
                          onClick={() => handleOpenChat(friend)}
                          className="w-9 h-9 flex items-center justify-center bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 hover:scale-110 active:scale-95 transition-all duration-200"
                          title={t("friends.send_message")}
                        >
                          <span className="material-symbols-outlined text-lg">
                            chat
                          </span>
                        </button>
                        <button
                          onClick={() =>
                            handleRemoveFriend(friend.id, friend.displayName)
                          }
                          disabled={removing[friend.id]}
                          className="w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/50 hover:scale-110 active:scale-95 transition-all duration-200"
                          title={t("friends.remove_friend")}
                        >
                          {removing[friend.id] ? (
                            <div className="w-4 h-4 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
                          ) : (
                            <span className="material-symbols-outlined text-lg">
                              person_remove
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SearchUsersModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </div>
  );
};

export default FriendsListPage;
