import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { formatDate } from "../utils/formatters";
import { friendApi } from "../api/friend.api";
import { FriendRequestDto } from "../types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import { conversationApi } from "../api/conversation.api";
import { useFriendRequest } from "../context/FriendRequestContext";

const FriendRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentConversation, setConversations, conversations } = useChat();
  const { decrementCount, refreshCount } = useFriendRequest();

  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [requests, setRequests] = useState<FriendRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    loadRequests();
  }, [activeTab]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data =
        activeTab === "received"
          ? await friendApi.getPendingRequests()
          : await friendApi.getSentRequests();
      setRequests(data);
    } catch (err) {
      toast.error("Không thể tải danh sách lời mời");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request: FriendRequestDto) => {
    try {
      setProcessing((prev) => ({ ...prev, [request.id]: true }));
      await friendApi.acceptFriendRequest(request.id);

      const newConversation = await conversationApi.createDirectConversation({
        userId1: user!.id,
        userId2: request.senderId,
      });

      setConversations([newConversation, ...conversations]);
      setCurrentConversation(newConversation);
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      decrementCount(); // Update badge count
      toast.success("Đã chấp nhận lời mời kết bạn");

      setTimeout(() => {
        navigate("/chat");
      }, 500);
    } catch (err) {
      toast.error("Không thể chấp nhận lời mời");
    } finally {
      setProcessing((prev) => ({ ...prev, [request.id]: false }));
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      setProcessing((prev) => ({ ...prev, [requestId]: true }));
      await friendApi.rejectFriendRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      decrementCount(); // Update badge count
      toast.success(
        activeTab === "received" ? "Đã từ chối lời mời" : "Đã thu hồi lời mời"
      );
    } catch (err) {
      toast.error("Thao tác thất bại");
    } finally {
      setProcessing((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full glass-effect lg:rounded-3xl overflow-hidden animate-fade-in">
      {/* Header Area */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Lời mời kết bạn
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Bạn có {requests.length} lời mời{" "}
              {activeTab === "received" ? "đang chờ" : "đã gửi"}
            </p>
          </div>
          <button
            onClick={() => navigate("/chat")}
            className="w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined !text-[16px]">
              close
            </span>
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab("received")}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all duration-300 ${
              activeTab === "received"
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Lời mời đã nhận
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all duration-300 ${
              activeTab === "sent"
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Lời mời đã gửi
          </button>
        </div>
      </div>

      {/* Requests Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">
              Đang tải...
            </p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">
                {activeTab === "received"
                  ? "person_add_disabled"
                  : "outgoing_mail"}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {activeTab === "received"
                ? "Không có lời mời nào"
                : "Bạn chưa gửi lời mời nào"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs font-medium">
              {activeTab === "received"
                ? "Khi có ai đó muốn kết bạn với bạn, lời mời sẽ xuất hiện tại đây."
                : "Hãy tìm kiếm bạn bè và gửi lời mời để bắt đầu trò chuyện!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {requests.map((request) => (
              <div
                key={request.id}
                className="group p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/40 rounded-3xl hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  {/* Avatar section */}
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-secondary rounded-full opacity-0 group-hover:opacity-100 blur transition duration-500"></div>
                    {(
                      activeTab === "received"
                        ? request.senderAvatar
                        : request.receiverAvatar
                    ) ? (
                      <div
                        className="relative w-14 h-14 rounded-xl bg-cover bg-center border-4 border-white dark:border-slate-800 shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-500"
                        style={{
                          backgroundImage: `url("${
                            activeTab === "received"
                              ? request.senderAvatar
                              : request.receiverAvatar
                          }")`,
                        }}
                      />
                    ) : (
                      <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-black border-4 border-white dark:border-slate-800 shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                        {(activeTab === "received"
                          ? request.senderName
                          : request.receiverName
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info section */}
                  <div className="flex flex-col gap-1 mt-2">
                    <h4 className="font-black text-slate-900 dark:text-white text-base group-hover:text-primary transition-colors">
                      {activeTab === "received"
                        ? request.senderName
                        : request.receiverName}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                      {activeTab === "received"
                        ? "Đã gửi lời mời cho bạn"
                        : "Chờ xác nhận"}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-2 font-medium italic">
                      {formatDate(request.createdAt)}
                    </span>
                  </div>

                  {/* Actions section */}
                  {activeTab === "received" ? (
                    <div className="flex flex-col w-full gap-1.5 mt-3">
                      <button
                        onClick={() => handleAccept(request)}
                        disabled={processing[request.id]}
                        className="w-full py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 text-[10px]"
                      >
                        {processing[request.id] ? "Đang xử lý..." : "Chấp nhận"}
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={processing[request.id]}
                        className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg font-bold hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all active:scale-95 disabled:opacity-50 text-[10px]"
                      >
                        Để sau
                      </button>
                    </div>
                  ) : (
                    <div className="w-full mt-4">
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={processing[request.id]}
                        className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-lg font-bold hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all active:scale-95 disabled:opacity-50 group/cancel"
                      >
                        <span className="group-hover/cancel:hidden text-[10px]">
                          Đang chờ phản hồi
                        </span>
                        <span className="hidden group-hover/cancel:block text-[10px]">
                          Thu hồi lời mời
                        </span>
                      </button>
                    </div>
                  )}
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
