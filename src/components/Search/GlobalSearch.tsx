import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { searchApi } from "../../api/search.api";
import {
  SearchResultDto,
  MessageSearchResultDto,
  AttachmentSearchResultDto,
  UserSearchResultDto,
} from "../../types/search.types";
import { formatTime } from "../../utils/formatters";
import { getAvatarUrl } from "../../utils/helpers";
import "../../styles/global-search.css";

interface GlobalSearchProps {
  onClose: () => void;
  onSelectMessage: (conversationId: number, messageId: number) => void;
  onSelectUser: (userId: number) => void;
  onSelectFile: (fileUrl: string) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onClose,
  onSelectMessage,
  onSelectUser,
  onSelectFile,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "all" | "messages" | "users" | "files"
  >("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleSearch = async () => {
      if (!query.trim()) {
        setResults(null);
        return;
      }

      setLoading(true);
      try {
        const data = await searchApi.searchAll(query);
        setResults(data);
      } catch (err) {
        console.error("Global search failed", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const renderMessageResult = (msg: MessageSearchResultDto) => (
    <div
      key={`msg-${msg.id}`}
      className="search-item"
      onClick={() => onSelectMessage(msg.conversationId, msg.id)}
    >
      <img
        src={getAvatarUrl(msg.senderAvatar)}
        alt=""
        className="search-item-avatar"
      />
      <div className="search-item-content">
        <div className="search-item-title">
          {msg.senderName}{" "}
          <span className="text-slate-400 font-normal">
            {t("global_search.in")} {msg.conversationName}
          </span>
        </div>
        <div className="search-item-subtitle">{msg.content}</div>
      </div>
      <div className="search-item-meta">{formatTime(msg.createdAt)}</div>
    </div>
  );

  const renderUserResult = (user: UserSearchResultDto) => (
    <div
      key={`user-${user.id}`}
      className="search-item"
      onClick={() => onSelectUser(user.id)}
    >
      <img
        src={getAvatarUrl(user.avatar)}
        alt=""
        className="search-item-avatar"
      />
      <div className="search-item-content">
        <div className="search-item-title">{user.displayName}</div>
        <div className="search-item-subtitle">
          @{user.username} {user.bio ? `• ${user.bio}` : ""}
        </div>
      </div>
      {user.isContact && (
        <div className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded-full uppercase">
          {t("global_search.contact_badge")}
        </div>
      )}
    </div>
  );

  const renderFileResult = (file: AttachmentSearchResultDto) => (
    <div
      key={`file-${file.id}`}
      className="search-item"
      onClick={() => onSelectFile(file.fileUrl)}
    >
      <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-primary">
          description
        </span>
      </div>
      <div className="search-item-content">
        <div className="search-item-title">{file.fileName}</div>
        <div className="search-item-subtitle">
          {t("global_search.shared_in")} {file.conversationName}
        </div>
      </div>
      <div className="search-item-meta">
        {(file.fileSize / 1024 / 1024).toFixed(1)} MB
      </div>
    </div>
  );

  return (
    <div className="global-search-backdrop" onClick={handleBackdropClick}>
      <div className="global-search-container">
        <div className="search-input-wrapper">
          <div className="search-input-container">
            <span className="material-symbols-outlined text-slate-400">
              search
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder={t("global_search.placeholder")}
              className="search-field"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {loading && (
              <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            )}
            {query && !loading && (
              <button
                onClick={() => setQuery("")}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  cancel
                </span>
              </button>
            )}
          </div>
        </div>

        {query && (
          <div className="search-tab-bar">
            {["all", "messages", "users", "files"].map((tab) => (
              <button
                key={tab}
                className={`search-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab as any)}
              >
                {t(`global_search.tabs.${tab === "users" ? "people" : tab}`)}
              </button>
            ))}
          </div>
        )}

        <div className="search-results-area custom-scrollbar">
          {!query && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
              <span className="material-symbols-outlined text-5xl opacity-20">
                manage_search
              </span>
              <p className="text-sm font-medium italic">
                {t("global_search.type_to_search")}
              </p>
            </div>
          )}

          {query && results && (
            <>
              {(activeTab === "all" || activeTab === "users") &&
                results.users.length > 0 && (
                  <>
                    <div className="category-header">
                      {t("global_search.people_results")}
                    </div>
                    {results.users.map(renderUserResult)}
                  </>
                )}

              {(activeTab === "all" || activeTab === "messages") &&
                results.messages.length > 0 && (
                  <>
                    <div className="category-header">
                      {t("global_search.messages_results")}
                    </div>
                    {results.messages.map(renderMessageResult)}
                  </>
                )}

              {(activeTab === "all" || activeTab === "files") &&
                results.files.length > 0 && (
                  <>
                    <div className="category-header">
                      {t("global_search.files_results")}
                    </div>
                    {results.files.map(renderFileResult)}
                  </>
                )}

              {results.users.length === 0 &&
                results.messages.length === 0 &&
                results.files.length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                    <span className="material-symbols-outlined text-5xl opacity-20">
                      sentiment_dissatisfied
                    </span>
                    <p className="text-sm font-medium italic">
                      {t("global_search.no_results", { query })}
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
