import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { formatDate } from "../utils/formatters";
import { friendApi } from "../api/friend.api";
import { FriendRequestDto } from "../types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import { conversationApi } from "../api/conversation.api";

const FriendRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentConversation, setConversations, conversations } = useChat();

  const [requests, setRequests] = useState<FriendRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const data = await friendApi.getPendingRequests();
      setRequests(data);
    } catch (err) {
      setError("Failed to load friend requests");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Accept friend request
  const handleAccept = async (request: FriendRequestDto) => {
    try {
      setProcessing((prev) => ({ ...prev, [request.id]: true }));
      await friendApi.acceptFriendRequest(request.id);
      // Step 2: Create direct conversation with the friend
      const newConversation = await conversationApi.createDirectConversation({
        userId1: user!.id,
        userId2: request.senderId,
      });

      // Step 3: Add to conversations list
      setConversations([newConversation, ...conversations]);

      // Step 4: Open the conversation
      setCurrentConversation(newConversation);

      // Step 5: Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      toast.success("Friend request accepted!");

      setTimeout(() => {
        navigate("/chat");
      }, 500);
    } catch (err) {
      toast.error("Failed to accept friend request");
      console.error(err);
    } finally {
      setProcessing((prev) => ({ ...prev, [request.id]: false }));
    }
  };

  // Step 6: Reject friend request
  const handleReject = async (requestId: number) => {
    try {
      setProcessing((prev) => ({ ...prev, [requestId]: true }));
      await friendApi.rejectFriendRequest(requestId);

      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success("Friend request rejected");
    } catch (err) {
      toast.error("Failed to reject friend request");
      console.error(err);
    } finally {
      setProcessing((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#111418]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Friend Requests
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {requests.length > 0
            ? `You have ${requests.length} pending friend request${
                requests.length !== 1 ? "s" : ""
              }`
            : "No pending friend requests"}
        </p>
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
                Loading friend requests...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 p-4 rounded-lg">
            {error}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
              <span className="material-symbols-outlined text-4xl text-gray-400">
                person_outline
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Friend Requests
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              You don't have any pending friend requests at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:shadow-md transition-shadow"
              >
                {/* User Info */}
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-16 shrink-0"
                    style={{
                      backgroundImage: `url("${request.senderAvatar || ""}")`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-black dark:text-white truncate">
                      {request.senderName}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      Sent {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAccept(request)}
                    disabled={processing[request.id]}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      done
                    </span>
                    <span className="truncate">Accept</span>
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={processing[request.id]}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      close
                    </span>
                    <span className="truncate">Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequestsPage;
