import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import { StatusUser, User } from "../../types";
import { userApi } from "../../api/user.api";
import { conversationApi } from "../../api/conversation.api";
import { friendApi } from "../../api/friend.api";
import toast from "react-hot-toast";
import {
  getStatusUserColor,
  getStatusUserLabel,
} from "../../utils/enum-helpers";
import { getAvatarUrl } from "../../utils/helpers";
import { useTranslation } from "react-i18next";

interface SearchUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchUsersModal: React.FC<SearchUsersModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { setCurrentConversation, setConversations, conversations } = useChat();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [addingFriend, setAddingFriend] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<{
    [key: number]: "friend" | "pending" | "none";
  }>({});
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Close modal with Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setError("");
    setSelectedUser(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!term.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await userApi.searchUsers(term);
        // Filter out current user
        const filtered = data.filter((u) => u.id !== user?.id);
        setResults(filtered);

        // Check friendship status for each result
        await checkFriendshipStatus(filtered);
      } catch (err) {
        setError("Failed to search users");
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 500); // Debounce 500ms
  };

  // Check friendship status for multiple users
  const checkFriendshipStatus = async (users: User[]) => {
    const statuses: { [key: number]: "friend" | "pending" | "none" } = {};

    for (const u of users) {
      try {
        const isFriend = await friendApi.checkFriendship(u.id);
        statuses[u.id] = isFriend.isFriend ? "friend" : "none";
      } catch (err) {
        statuses[u.id] = "none";
      }
    }

    setFriendshipStatus(statuses);
  };

  // Preview chat without adding to conversations list
  const handleSelectUser = (selectedUser: User) => {
    setSelectedUser(selectedUser);
  };

  // Create temporary conversation for preview
  const handleOpenChat = async () => {
    if (!user || !selectedUser) return;

    try {
      setAddingFriend(true);

      // Check if conversation already exists
      const existingConversation = conversations.find(
        (conv) =>
          conv.conversationType === 1 &&
          conv.members.some((m) => m.id === selectedUser.id),
      );

      if (existingConversation) {
        setCurrentConversation(existingConversation);
      } else {
        // Create new conversation
        const newConversation = await conversationApi.createDirectConversation({
          userId1: user.id,
          userId2: selectedUser.id,
        });

        // Add to conversations list (first time opening chat)
        setConversations([newConversation, ...conversations]);
        setCurrentConversation(newConversation);
      }

      // Close modal
      setSearchTerm("");
      setResults([]);
      setSelectedUser(null);
      onClose();
      console.log("Chat opened");
    } catch (err) {
      setError("Failed to create conversation");
      console.error("Create conversation error:", err);
    } finally {
      setAddingFriend(false);
    }
  };

  // Add friend (placeholder for future implementation)
  const handleAddFriend = async () => {
    if (!user || !selectedUser) return;

    try {
      setAddingFriend(true);
      await friendApi.sendFriendRequest(selectedUser.id);
      // Show success message
      setFriendshipStatus((prev) => ({
        ...prev,
        [selectedUser.id]: "pending",
      }));

      toast.success(`Friend request sent to ${selectedUser.displayName}`);
    } catch (err) {
      console.error("Add friend error:", err);
      toast.error("Failed to send friend request");
    } finally {
      setAddingFriend(false);
    }
  };

  // Get button text and state using enum
  const getFriendButton = (userId: number) => {
    const status = friendshipStatus[userId] || "none";
    const config = {
      friend: {
        text: t("find_people.status.friend"),
        icon: "done",
        variant:
          "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        disabled: true,
      },
      pending: {
        text: t("find_people.status.sent"),
        icon: "schedule",
        variant:
          "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
        disabled: true,
      },
      none: {
        text: t("find_people.status.add"),
        icon: "person_add",
        variant:
          "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-hover hover:-translate-y-1",
        disabled: false,
      },
    }[status];

    return config;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 lg:p-8 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 shrink-0">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {selectedUser
              ? t("find_people.title_profile")
              : t("find_people.title_find")}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
          >
            <span className="material-symbols-outlined !text-[20px]">
              close
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {!selectedUser ? (
            <>
              {/* Search Bar */}
              <div className="px-8 py-6 shrink-0">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-300"></div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder={t("find_people.search_placeholder")}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary/50 transition-all font-medium text-xs shadow-sm h-9"
                      autoFocus
                    />
                    <span className="material-symbols-outlined absolute left-3 text-slate-400 group-focus-within:text-primary transition-colors text-[18px]">
                      search
                    </span>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mx-8 mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-2xl text-sm font-bold flex items-center gap-3 animate-shake">
                  <span className="material-symbols-outlined">error</span>
                  {error}
                </div>
              )}

              {/* Search States & Results */}
              <div className="flex-1 px-8 pb-8">
                {searchTerm === "" ? (
                  <div className="py-12 text-center opacity-40">
                    <div className="mb-4">
                      <span className="material-symbols-outlined text-7xl">
                        face
                      </span>
                    </div>
                    <p className="text-lg font-bold">
                      {t("find_people.discover_title")}
                    </p>
                    <p className="text-sm">{t("find_people.discover_desc")}</p>
                  </div>
                ) : loading ? (
                  <div className="py-12 text-center">
                    <div className="animate-spin inline-block mb-4">
                      <span className="material-symbols-outlined text-4xl text-primary">
                        sync
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold tracking-wide uppercase text-xs">
                      {t("find_people.loading")}
                    </p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-12 text-center opacity-40">
                    <span className="material-symbols-outlined text-7xl mb-4">
                      search_off
                    </span>
                    <p className="text-lg font-bold">
                      {t("find_people.no_results")}
                    </p>
                    <p className="text-sm">
                      {t("find_people.no_results_desc", { query: searchTerm })}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.map((resultUser) => (
                      <div
                        key={resultUser.id}
                        className="group flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-white/5 hover:bg-primary hover:text-white rounded-2xl border border-slate-100 dark:border-white/5 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg hover:shadow-primary/20"
                        onClick={() => handleSelectUser(resultUser)}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="relative">
                            <div className="absolute -inset-0.5 bg-white rounded-full blur-[1px] opacity-30 group-hover:opacity-60 transition duration-300"></div>
                            <div
                              className="relative bg-center bg-no-repeat aspect-square bg-cover rounded-full size-11 border-2 border-white/20"
                              style={{
                                backgroundImage: `url("${getAvatarUrl(
                                  resultUser.avatar,
                                )}")`,
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-base truncate leading-tight">
                              {resultUser.displayName}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 group-hover:text-white/80 text-sm font-bold truncate">
                              @{resultUser.userName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full border border-white/10 group-hover:border-white/20">
                            <div
                              className="h-2 w-2 rounded-full shadow-[0_0_8px] shadow-current"
                              style={{
                                backgroundColor: getStatusUserColor(
                                  resultUser.status as StatusUser,
                                ),
                                color: getStatusUserColor(
                                  resultUser.status as StatusUser,
                                ),
                              }}
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
                              {getStatusUserLabel(
                                resultUser.status as StatusUser,
                              )}
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-slate-300 group-hover:text-white transition-colors !text-[18px]">
                            arrow_forward_ios
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* User Profile Preview */
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-fade-in">
              <div className="relative mb-8">
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary to-secondary rounded-full blur-2xl opacity-20 animate-pulse-subtle"></div>
                <div
                  className="relative bg-center bg-no-repeat aspect-square bg-cover rounded-[2rem] size-32 border-4 border-white dark:border-slate-800 shadow-premium"
                  style={{
                    backgroundImage: `url("${getAvatarUrl(
                      selectedUser.avatar,
                    )}")`,
                  }}
                />
                <div
                  className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700"
                  style={{
                    color: getStatusUserColor(
                      selectedUser.status as StatusUser,
                    ),
                  }}
                >
                  <span className="material-symbols-outlined text-[32px] block">
                    {selectedUser.status === StatusUser.Online
                      ? "bolt"
                      : "bedtime"}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-10">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  {selectedUser.displayName}
                </h3>
                <p className="text-primary font-black text-base tracking-wide uppercase">
                  @{selectedUser.userName}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 mt-4">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: getStatusUserColor(
                        selectedUser.status as StatusUser,
                      ),
                    }}
                  />
                  <span className="text-xs font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-400">
                    {getStatusUserLabel(selectedUser.status as StatusUser)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <button
                  onClick={handleOpenChat}
                  disabled={addingFriend}
                  className="flex-1 group h-10 flex items-center justify-center gap-2 px-6 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary-hover hover:-translate-y-1 active:scale-95 transition-all duration-300"
                >
                  <span className="material-symbols-outlined !text-xl group-hover:animate-bounce-subtle">
                    chat
                  </span>
                  <span>{t("find_people.btn_message")}</span>
                </button>

                {(() => {
                  const state = getFriendButton(selectedUser.id);
                  return (
                    <button
                      onClick={handleAddFriend}
                      disabled={state.disabled || addingFriend}
                      className={`flex-1 group h-10 flex items-center justify-center gap-2 px-6 rounded-2xl font-bold text-sm transition-all duration-300 ${
                        state.variant === "friend"
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                          : state.variant === "pending"
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                            : state.variant
                      } disabled:opacity-50 disabled:hover:translate-y-0 active:scale-95`}
                    >
                      <span className="material-symbols-outlined">
                        {state.icon}
                      </span>
                      <span>{state.text}</span>
                    </button>
                  );
                })()}
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="mt-10 text-slate-400 hover:text-primary text-sm font-black uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">
                  arrow_back
                </span>
                {t("find_people.btn_back")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchUsersModal;
