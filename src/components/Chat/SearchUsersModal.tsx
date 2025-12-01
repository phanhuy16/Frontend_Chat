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

interface SearchUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchUsersModal: React.FC<SearchUsersModalProps> = ({
  isOpen,
  onClose,
}) => {
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
          conv.members.some((m) => m.id === selectedUser.id)
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
        text: "Bạn bè",
        icon: "done",
        variant:
          "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        disabled: true,
      },
      pending: {
        text: "Đã gửi",
        icon: "schedule",
        variant:
          "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
        disabled: true,
      },
      none: {
        text: "Kết bạn",
        icon: "person_add",
        variant: "bg-primary/20 text-primary hover:bg-primary/30",
        disabled: false,
      },
    }[status];

    return config;
  };

  if (!isOpen) return null;

  return (
    <div>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
        <div
          ref={modalRef}
          className="bg-white dark:bg-[#111418] rounded-xl shadow-lg w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
            <h2 className="text-xl font-bold text-black dark:text-white">
              {selectedUser ? "Chat Preview" : "Start a Chat"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                close
              </span>
            </button>
          </div>

          {/* Search or User Preview */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {!selectedUser ? (
              <>
                {/* Search Input */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search by username or name..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-background-dark border border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder-gray-500 focus:ring-primary focus:border-primary transition-all"
                      autoFocus
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      search
                    </span>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Search Results */}
                <div className="flex-1">
                  {searchTerm === "" ? (
                    <div className="px-6 py-8 text-center">
                      <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 block mb-2">
                        search
                      </span>
                      <p className="text-gray-500 dark:text-gray-400">
                        Search for users to start chatting
                      </p>
                    </div>
                  ) : loading ? (
                    <div className="px-6 py-8 text-center">
                      <div className="animate-spin mb-2">
                        <span className="material-symbols-outlined text-2xl text-primary block">
                          sync
                        </span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        Searching...
                      </p>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 block mb-2">
                        person_off
                      </span>
                      <p className="text-gray-500 dark:text-gray-400">
                        No users found matching "{searchTerm}"
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {results.map((resultUser) => (
                        <div
                          key={resultUser.id}
                          className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-gray-800 last:border-b-0 transition-colors cursor-pointer"
                          onClick={() => handleSelectUser(resultUser)}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 shrink-0"
                              style={{
                                backgroundImage: `url("${
                                  resultUser.avatar || ""
                                }")`,
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-black dark:text-white font-medium text-sm truncate">
                                {resultUser.displayName}
                              </p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                                @{resultUser.userName}
                              </p>
                            </div>
                          </div>

                          {/* Status indicator */}
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: getStatusUserColor(
                                  resultUser.status as StatusUser
                                ),
                              }}
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {getStatusUserLabel(
                                resultUser.status as StatusUser
                              )}
                            </span>
                          </div>

                          {/* Arrow icon */}
                          <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 ml-2">
                            arrow_forward
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* User Preview Card */
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
                {/* Avatar */}
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-32"
                  style={{
                    backgroundImage: `url("${selectedUser.avatar || ""}")`,
                  }}
                />

                {/* User Info */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-black dark:text-white">
                    {selectedUser.displayName}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    @{selectedUser.userName}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: getStatusUserColor(
                          selectedUser.status as StatusUser
                        ),
                      }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: getStatusUserColor(
                          selectedUser.status as StatusUser
                        ),
                      }}
                    >
                      {getStatusUserLabel(selectedUser.status as StatusUser)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 w-full max-w-xs">
                  <button
                    onClick={handleOpenChat}
                    disabled={addingFriend}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <span className="material-symbols-outlined">chat</span>
                    <span>Nhắn tin</span>
                  </button>
                  {(() => {
                    const state = getFriendButton(selectedUser.id);
                    let buttonClass =
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors";

                    if (state.variant === "success") {
                      buttonClass +=
                        " bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
                    } else if (state.variant === "pending") {
                      buttonClass +=
                        " bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400";
                    } else {
                      buttonClass +=
                        " bg-primary/20 text-primary hover:bg-primary/30";
                    }

                    return (
                      <button
                        onClick={handleAddFriend}
                        disabled={state.disabled || addingFriend}
                        className={buttonClass}
                      >
                        <span className="material-symbols-outlined">
                          {state.variant === "success" ? "done" : "person_add"}
                        </span>
                        <span>{state.text}</span>
                      </button>
                    );
                  })()}
                </div>

                {/* Back Button */}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium"
                >
                  ← Back to Search
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchUsersModal;
