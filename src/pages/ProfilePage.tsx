import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userApi } from "../api/user.api";
import { conversationApi } from "../api/conversation.api";
import { friendApi } from "../api/friend.api";
import blockApi from "../api/block.api";
import { User } from "../types";
import { useAuth } from "../hooks/useAuth";
import { REACT_APP_AVATAR_URL } from "../utils/constants";
import { format } from "date-fns";
import toast from "react-hot-toast";
import "../styles/profile.css";
import { getStatusUserColor } from "../utils/enum-helpers";
import { getAvatarUrl } from "../utils/helpers";
import { useTranslation } from "react-i18next";

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [blockStatus, setBlockStatus] = useState<{
    isBlocked: boolean;
    blockerId?: number;
  }>({ isBlocked: false });

  useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const userData = await userApi.getUserById(parseInt(userId));
        setProfileUser(userData);

        // Check if they're friends
        if (currentUser && currentUser.id !== parseInt(userId)) {
          const friends = await friendApi.getFriendsList();
          setIsFriend(friends.some((f) => f.id === parseInt(userId)));

          // Check mutual block status
          const blockData = await blockApi.isUserBlockedMutual(
            currentUser.id,
            parseInt(userId),
          );
          setBlockStatus(blockData);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, currentUser]);

  const handleSendMessage = async () => {
    if (!currentUser || !profileUser) return;

    try {
      const conversation = await conversationApi.createDirectConversation({
        userId1: currentUser.id,
        userId2: profileUser.id,
      });

      navigate(`/chat/${conversation.id}`);
      toast.success("Chat opened!");
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to open chat");
    }
  };

  const handleAddFriend = async () => {
    if (!profileUser) return;

    try {
      await friendApi.sendFriendRequest(profileUser.id);
      toast.success("Friend request sent!");
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>{t("profile_page.loading")}</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="profile-page">
        <div className="profile-not-found">
          <span className="material-symbols-outlined">person_off</span>
          <h2>{t("profile_page.not_found_title")}</h2>
          <p>{t("profile_page.not_found_desc")}</p>
          <button onClick={handleBack} className="btn-back">
            {t("profile_page.go_back")}
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id;
  const memberSince = profileUser.createdAt
    ? format(new Date(profileUser.createdAt), "MMMM yyyy")
    : t("profile_page.recently");

  const avatarUrl = getAvatarUrl(profileUser.avatar) || "/default-avatar.png";

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header with Back Button */}
        <div className="profile-header">
          <button
            onClick={handleBack}
            className="btn-back-header"
            title={t("profile_page.go_back")}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1>{t("profile_page.title")}</h1>
          <div className="header-actions">
            {isOwnProfile && (
              <button
                onClick={() => navigate("/settings")}
                className="btn-icon-header"
                title={t("profile_page.edit_profile")}
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
            )}
          </div>
        </div>

        <div className="profile-content-grid">
          {/* Main Profile Info Card */}
          <div className="profile-main-card">
            <div className="profile-cover">
              <div className="cover-overlay"></div>
            </div>

            <div className="profile-avatar-wrapper">
              <img
                src={avatarUrl}
                alt={profileUser.displayName}
                className="profile-avatar"
              />
              <div
                className={`status-indicator`}
                style={{
                  backgroundColor: getStatusUserColor(profileUser.status),
                }}
              ></div>
            </div>

            <div className="profile-identity">
              <h2 className="profile-display-name">
                {profileUser.displayName}
              </h2>
              <p className="profile-username-handle">@{profileUser.userName}</p>

              {profileUser.customStatus && (
                <div className="profile-custom-status">
                  <span className="material-symbols-outlined">mood</span>
                  <span>{profileUser.customStatus}</span>
                </div>
              )}
            </div>

            <div className="profile-primary-actions">
              {!isOwnProfile ? (
                <>
                  <button
                    onClick={handleSendMessage}
                    className={`btn-action-primary ${blockStatus.isBlocked ? "btn-blocked" : ""}`}
                    disabled={blockStatus.isBlocked}
                  >
                    <span className="material-symbols-outlined">
                      {blockStatus.isBlocked ? "block" : "chat_bubble"}
                    </span>
                    {blockStatus.isBlocked
                      ? blockStatus.blockerId === currentUser?.id
                        ? t("profile_page.you_blocked")
                        : t("profile_page.blocked")
                      : t("profile_page.message")}
                  </button>
                  {!isFriend && (
                    <button
                      onClick={handleAddFriend}
                      className="btn-action-secondary"
                    >
                      <span className="material-symbols-outlined">
                        person_add
                      </span>
                      {t("profile_page.add_friend")}
                    </button>
                  )}
                  {isFriend && (
                    <div className="friend-badge">
                      <span className="material-symbols-outlined">
                        check_circle
                      </span>
                      {t("profile_page.friend")}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => navigate("/settings")}
                  className="btn-action-primary"
                >
                  <span className="material-symbols-outlined">edit</span>
                  {t("profile_page.edit_profile")}
                </button>
              )}
            </div>
          </div>

          {/* Details & About Sections */}
          <div className="profile-details-column">
            {/* About Section */}
            <div className="profile-section-card">
              <h3 className="section-title">{t("profile_page.about")}</h3>
              <p className="profile-bio-text">
                {profileUser.bio || t("profile_page.no_bio")}
              </p>

              <div className="info-list">
                <div className="info-item">
                  <span className="material-symbols-outlined">
                    calendar_today
                  </span>
                  <div className="info-content">
                    <span className="info-label">
                      {t("profile_page.member_since")}
                    </span>
                    <span className="info-value">{memberSince}</span>
                  </div>
                </div>

                <div className="info-item">
                  <span className="material-symbols-outlined">mail</span>
                  <div className="info-content">
                    <span className="info-label">
                      {t("profile_page.email")}
                    </span>
                    <span className="info-value">{profileUser.email}</span>
                  </div>
                </div>

                {profileUser.phoneNumber && (
                  <div className="info-item">
                    <span className="material-symbols-outlined">call</span>
                    <div className="info-content">
                      <span className="info-label">
                        {t("profile_page.phone")}
                      </span>
                      <span className="info-value">
                        {profileUser.phoneNumber}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Media/Shared Section (Placeholder) */}
            <div className="profile-section-card">
              <h3 className="section-title">
                {t("profile_page.shared_media")}
              </h3>
              <div className="shared-media-placeholder">
                <span className="material-symbols-outlined">photo_library</span>
                <p>{t("profile_page.shared_media_desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
