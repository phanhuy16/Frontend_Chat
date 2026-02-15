import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { conversationApi } from "../api/conversation.api";
import ChatEmptyState from "../components/Chat/ChatEmptyState";
import ConversationList from "../components/Chat/ConversationList";
import ChatWindow from "../components/Chat/ChatWindow";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import { useSignalR } from "../hooks/useSignalR";
import { useSignalRHandlers } from "../hooks/useSignalRHandlers";
import { Conversation } from "../types";
import { SIGNALR_HUB_URL_CHAT } from "../utils/constants";

const ArchivedChatsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { currentConversation, setCurrentConversation, drafts } = useChat();
  const { isConnected } = useSignalR(SIGNALR_HUB_URL_CHAT as string);
  const [archivedConversations, setArchivedConversations] = useState<
    Conversation[]
  >([]);
  const [loading, setLoading] = useState(true);

  useSignalRHandlers(); // Enable real-time updates while on this page

  const loadArchivedConversations = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await conversationApi.getUserArchivedConversations(user.id);
      setArchivedConversations(data);
    } catch (err) {
      console.error("Failed to load archived conversations:", err);
      toast.error("Failed to load archived chats");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadArchivedConversations();
  }, [loadArchivedConversations]);

  useEffect(() => {
    if (conversationId && archivedConversations.length > 0) {
      const convIdNum = parseInt(conversationId);
      const selected = archivedConversations.find((c) => c.id === convIdNum);
      if (selected) {
        if (currentConversation?.id !== convIdNum) {
          setCurrentConversation(selected);
        }
      } else if (!loading) {
        // If not in archived list, might be unarchived or invalid
        // Try to fetch it to be sure
        conversationApi
          .getConversation(convIdNum)
          .then((conv) => {
            if (conv.isArchived) {
              setArchivedConversations((prev) => [conv, ...prev]);
              setCurrentConversation(conv);
            } else {
              toast.error("Group is not archived");
              navigate("/chat/archived");
            }
          })
          .catch(() => {
            toast.error("Conversation not found");
            navigate("/chat/archived");
          });
      }
    } else if (!conversationId) {
      setCurrentConversation(null);
    }
  }, [
    conversationId,
    archivedConversations,
    currentConversation?.id,
    setCurrentConversation,
    loading,
    navigate,
  ]);

  const handleToggleArchive = async (conv: Conversation) => {
    if (!user) return;
    try {
      const { isArchived } = await conversationApi.toggleArchive(
        conv.id,
        user.id,
      );

      // If unarchived, remove from archived list
      if (!isArchived) {
        setArchivedConversations((prev) =>
          prev.filter((c) => c.id !== conv.id),
        );
        if (currentConversation?.id === conv.id) {
          setCurrentConversation(null);
          navigate("/chat/archived");
        }
        toast.success("Chat unarchived");
      }
    } catch (err) {
      toast.error("Failed to unarchive chat");
      console.error(err);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    navigate(`/chat/archived/${conv.id}`);
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // ... (useSignalRHandlers call)

  const handleBack = () => {
    navigate("/chat/archived");
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="flex-1 flex gap-0 lg:gap-4 overflow-hidden h-full relative">
      <aside
        className={`flex flex-col glass-effect lg:rounded-3xl shrink-0 overflow-hidden transition-all duration-300 ${
          conversationId ? "hidden md:flex" : "flex"
        } ${isSidebarCollapsed ? "w-0 md:w-0 opacity-0 pointer-events-none" : "w-full md:w-[320px] lg:w-[360px] opacity-100"}`}
      >
        <div className="flex flex-col gap-6 p-6 min-w-[320px]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/chat")}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 transition-all"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {t("archived_page.title")}
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
        ) : archivedConversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <div>
              <div className="size-16 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                <span className="material-symbols-outlined text-3xl">
                  archive
                </span>
              </div>
              <p className="text-slate-900 dark:text-white font-bold">
                {t("archived_page.no_archived")}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t("archived_page.no_archived_desc")}
              </p>
            </div>
          </div>
        ) : (
          <ConversationList
            conversations={archivedConversations}
            currentConversation={currentConversation}
            onSelectConversation={handleSelectConversation}
            onToggleArchive={handleToggleArchive}
            user={user}
            unreadCounts={{}}
            drafts={drafts}
          />
        )}
      </aside>

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
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-slate-500">
            <div className="text-center max-w-sm">
              <div className="size-20 bg-slate-100 dark:bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-600">
                <span className="material-symbols-outlined text-5xl">
                  archive
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {t("archived_page.center_title")}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                {t("archived_page.center_desc")}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ArchivedChatsPage;
