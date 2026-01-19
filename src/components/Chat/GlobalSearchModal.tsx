import React, { useState, useEffect, useCallback } from "react";
import { searchApi } from "../../api/search.api";
import {
  SearchResultDto,
  MessageSearchResultDto,
  AttachmentSearchResultDto,
  UserSearchResultDto,
} from "../../types/search.types";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import toast from "react-hot-toast";
import "../../styles/global-search.css";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchTab = "all" | "messages" | "media" | "people";

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [searchResults, setSearchResults] = useState<SearchResultDto | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setLoading(true);
    try {
      const results = await searchApi.searchAll(searchQuery, 20);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to perform search");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, performSearch]);

  const handleMessageClick = (message: MessageSearchResultDto) => {
    navigate(`/chat/${message.conversationId}`);
    onClose();
  };

  const handleFileClick = (file: AttachmentSearchResultDto) => {
    navigate(`/chat/${file.conversationId}`);
    onClose();
  };

  const handleUserClick = (user: UserSearchResultDto) => {
    // Navigate to user profile or start conversation
    navigate(`/profile/${user.id}`);
    onClose();
  };

  const handleClose = () => {
    setQuery("");
    setSearchResults(null);
    setActiveTab("all");
    onClose();
  };

  if (!isOpen) return null;

  const filteredMessages = searchResults?.messages || [];
  const filteredFiles = searchResults?.files || [];
  const filteredUsers = searchResults?.users || [];

  return (
    <div className="global-search-modal-overlay" onClick={handleClose}>
      <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <input
            type="text"
            className="search-modal-input"
            placeholder="Search messages, files, and people..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button className="search-modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="search-modal-tabs">
          <button
            className={`search-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All
            {searchResults && (
              <span className="tab-count">
                {filteredMessages.length +
                  filteredFiles.length +
                  filteredUsers.length}
              </span>
            )}
          </button>
          <button
            className={`search-tab ${activeTab === "messages" ? "active" : ""}`}
            onClick={() => setActiveTab("messages")}
          >
            Messages
            {searchResults && (
              <span className="tab-count">{filteredMessages.length}</span>
            )}
          </button>
          <button
            className={`search-tab ${activeTab === "media" ? "active" : ""}`}
            onClick={() => setActiveTab("media")}
          >
            Media
            {searchResults && (
              <span className="tab-count">{filteredFiles.length}</span>
            )}
          </button>
          <button
            className={`search-tab ${activeTab === "people" ? "active" : ""}`}
            onClick={() => setActiveTab("people")}
          >
            People
            {searchResults && (
              <span className="tab-count">{filteredUsers.length}</span>
            )}
          </button>
        </div>

        <div className="search-modal-results">
          {loading && <div className="search-loading">Searching...</div>}

          {!loading && !query.trim() && (
            <div className="search-empty-state">
              <p>Type to search messages, files, and people</p>
            </div>
          )}

          {!loading && query.trim() && !searchResults && (
            <div className="search-empty-state">
              <p>No results found</p>
            </div>
          )}

          {!loading && searchResults && (
            <>
              {/* Messages */}
              {(activeTab === "all" || activeTab === "messages") &&
                filteredMessages.length > 0 && (
                  <div className="search-results-section">
                    {activeTab === "all" && <h3>Messages</h3>}
                    {filteredMessages.map((message) => (
                      <div
                        key={`msg-${message.id}`}
                        className="search-result-item message-result"
                        onClick={() => handleMessageClick(message)}
                      >
                        <img
                          src={message.senderAvatar || "/default-avatar.png"}
                          alt={message.senderName}
                          className="result-avatar"
                        />
                        <div className="result-content">
                          <div className="result-header">
                            <span className="result-name">
                              {message.senderName}
                            </span>
                            <span className="result-conversation">
                              {message.conversationName}
                            </span>
                          </div>
                          <p className="result-text">{message.content}</p>
                          <span className="result-time">
                            {format(
                              new Date(message.createdAt),
                              "MMM d, yyyy h:mm a",
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Files */}
              {(activeTab === "all" || activeTab === "media") &&
                filteredFiles.length > 0 && (
                  <div className="search-results-section">
                    {activeTab === "all" && <h3>Media & Files</h3>}
                    {filteredFiles.map((file) => (
                      <div
                        key={`file-${file.id}`}
                        className="search-result-item file-result"
                        onClick={() => handleFileClick(file)}
                      >
                        <div className="file-icon">
                          {file.fileType.startsWith("image/") ? (
                            <img
                              src={file.fileUrl}
                              alt={file.fileName}
                              className="file-thumbnail"
                            />
                          ) : (
                            <span>📄</span>
                          )}
                        </div>
                        <div className="result-content">
                          <div className="result-header">
                            <span className="result-name">{file.fileName}</span>
                          </div>
                          <p className="result-text">{file.conversationName}</p>
                          <span className="result-time">
                            {format(new Date(file.uploadedAt), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Users */}
              {(activeTab === "all" || activeTab === "people") &&
                filteredUsers.length > 0 && (
                  <div className="search-results-section">
                    {activeTab === "all" && <h3>People</h3>}
                    {filteredUsers.map((user) => (
                      <div
                        key={`user-${user.id}`}
                        className="search-result-item user-result"
                        onClick={() => handleUserClick(user)}
                      >
                        <img
                          src={user.avatar || "/default-avatar.png"}
                          alt={user.displayName}
                          className="result-avatar"
                        />
                        <div className="result-content">
                          <div className="result-header">
                            <span className="result-name">
                              {user.displayName}
                            </span>
                            {user.isContact && (
                              <span className="contact-badge">Contact</span>
                            )}
                          </div>
                          <p className="result-text">@{user.username}</p>
                          {user.bio && <p className="result-bio">{user.bio}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* No results in selected tab */}
              {activeTab !== "all" &&
                ((activeTab === "messages" && filteredMessages.length === 0) ||
                  (activeTab === "media" && filteredFiles.length === 0) ||
                  (activeTab === "people" && filteredUsers.length === 0)) && (
                  <div className="search-empty-state">
                    <p>No {activeTab} found</p>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
