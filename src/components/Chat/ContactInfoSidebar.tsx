import { Button, Modal, Switch } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import blockApi from "../../api/block.api";
import reportApi from "../../api/report.api";
import { useAuth } from "../../hooks/useAuth";
import { Conversation, StatusUser, User } from "../../types";
import { Message } from "../../types/message.types";
import { getAvatarUrl, formatLastActive } from "../../utils/helpers";

interface ContactInfoSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  otherMember?: User | null;
  conversation?: Conversation | null;
  messages?: Message[];
  onBlockChange?: (isBlocked: boolean) => void;
  onStartAudioCall: () => void;
  onStartVideoCall: () => void;
}

const ContactInfoSidebar: React.FC<ContactInfoSidebarProps> = ({
  isOpen,
  onClose,
  otherMember,
  conversation,
  messages = [],
  onBlockChange,
  onStartAudioCall,
  onStartVideoCall,
}) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"info" | "media">("info");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  // Notification settings
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    sound: true,
    preview: true,
    mute: false,
    muteUntil: "never",
  });

  // Theme settings
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<
    "default" | "dark" | "light" | "custom"
  >("default");

  // Report settings
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const reportReasons = [
    { value: "spam", label: "Thư rác/Quảng cáo" },
    { value: "harassment", label: "Quấy rối/Tấn công" },
    { value: "hate_speech", label: "Phát ngôn gây thù địch" },
    { value: "misinformation", label: "Thông tin sai lệch" },
    { value: "adult_content", label: "Nội dung người lớn" },
    { value: "violence", label: "Bạo lực/Đe dọa" },
    { value: "other", label: "Khác" },
  ];

  // Check if user is blocked
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (user?.id && otherMember?.id) {
        try {
          const blocked = await blockApi.isUserBlocked(user.id, otherMember.id);
          setIsBlocked(blocked);
        } catch (err) {
          console.error("Error checking block status:", err);
        }
      }
    };

    if (isOpen) {
      checkBlockStatus();
    }
  }, [isOpen, user?.id, otherMember?.id]);

  // Load notification settings from localStorage
  useEffect(() => {
    const convId = conversation?.id;
    if (convId) {
      const saved = localStorage.getItem(`notif_${convId}`);
      if (saved) {
        setNotificationSettings(JSON.parse(saved));
      }
    }
  }, [conversation?.id]);

  // Load theme settings from localStorage
  useEffect(() => {
    const convId = conversation?.id;
    if (convId) {
      const saved = localStorage.getItem(`theme_${convId}`);
      if (saved) {
        setSelectedTheme(saved as any);
      }
    }
  }, [conversation?.id]);

  // Handle block/unblock
  const handleBlockUser = async () => {
    if (!user?.id || !otherMember?.id) return;

    setBlockLoading(true);
    try {
      if (isBlocked) {
        await blockApi.unblockUser(user.id, otherMember.id);
        toast.success(`Đã bỏ chặn ${otherMember.displayName}`);
        setIsBlocked(false);
        onBlockChange?.(false);
      } else {
        await blockApi.blockUser(user.id, otherMember.id);
        toast.success(`Đã chặn ${otherMember.displayName}`);
        setIsBlocked(true);
        onBlockChange?.(true);
      }
    } catch (err) {
      console.error("Error blocking user:", err);
      toast.error("Lỗi khi chặn người dùng");
    } finally {
      setBlockLoading(false);
    }
  };

  // Handle notification settings save
  const handleNotificationSave = () => {
    const convId = conversation?.id;
    if (convId) {
      localStorage.setItem(
        `notif_${convId}`,
        JSON.stringify(notificationSettings)
      );
      toast.success("Đã lưu cài đặt thông báo");
      setNotificationModalOpen(false);
    }
  };

  // Handle theme settings save
  const handleThemeSave = () => {
    const convId = conversation?.id;
    if (convId) {
      localStorage.setItem(`theme_${convId}`, selectedTheme);
      toast.success("Đã lưu chủ đề cuộc trò chuyện");
      setThemeModalOpen(false);
    }
  };

  // Handle report submit - using API
  const handleReportSubmit = async () => {
    if (!reportReason) {
      toast.error("Vui lòng chọn lý do báo cáo");
      return;
    }

    if (!user?.id || !otherMember?.id) {
      toast.error("Không thể xác định người dùng");
      return;
    }

    setReportLoading(true);
    try {
      // Use report API
      await reportApi.createReport({
        reportedUserId: otherMember.id,
        reporterId: user.id,
        conversationId: conversation?.id,
        reason: reportReason,
        description: reportDescription.substring(0, 500), // Limit to 500 chars
      });

      // Show success message
      toast.success("Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét vấn đề này.");

      // Reset form
      setReportSubmitted(true);
      setReportReason("");
      setReportDescription("");

      // Close modal after 2 seconds
      setTimeout(() => {
        setReportModalOpen(false);
        setReportSubmitted(false);
      }, 2000);
    } catch (err: any) {
      console.error("Error submitting report:", err);

      // Better error handling
      const errorMessage =
        err.response?.data?.message || err.message || "Lỗi khi gửi báo cáo";

      toast.error(errorMessage);
    } finally {
      setReportLoading(false);
    }
  };

  // Handle report modal close
  const handleReportModalClose = () => {
    setReportModalOpen(false);
    setReportReason("");
    setReportDescription("");
    setReportSubmitted(false);
  };

  // Extract all attachments from messages
  const allAttachments = useMemo(() => {
    const attachments: Array<{
      id: number;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      type: "image" | "file";
      messageId: number;
      senderName: string;
    }> = [];

    messages.forEach((msg) => {
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((attachment) => {
          const isImage = attachment.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i);
          attachments.push({
            id: attachment.id,
            fileName: attachment.fileName,
            fileUrl: attachment.fileUrl,
            fileSize: attachment.fileSize,
            type: isImage ? "image" : "file",
            messageId: msg.id,
            senderName: msg.sender?.displayName || "Unknown",
          });
        });
      }
    });

    return attachments.sort(
      (a, b) => new Date(b.fileUrl).getTime() - new Date(a.fileUrl).getTime()
    );
  }, [messages]);

  const getFileUrl = (fileUrl: string) => {
    if (fileUrl.startsWith("http")) {
      return fileUrl;
    }
    const baseUrl = process.env.REACT_APP_API_URL?.replace("/api", "");
    return `${baseUrl}${fileUrl}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed md:relative flex flex-col w-full max-w-sm border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111418] h-full transition-transform duration-300 ease-in-out z-50
        ${isOpen ? "translate-x-0" : "translate-x-full"}
        md:translate-x-0 ${isOpen ? "md:block" : "md:hidden"}`}
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <h3 className="text-lg font-semibold text-black dark:text-white">
            {activeTab === "info" ? "Thông tin liên hệ" : "Media & Files"}
          </h3>
          <button
            onClick={onClose}
            className="md:hidden w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 shrink-0">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "info"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            Thông tin
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === "media"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            Media ({allAttachments.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "info" ? (
            <>
              {/* Contact Info */}
              <div className="flex flex-col items-center p-6 gap-4 border-b border-gray-200 dark:border-gray-800">
                {/* Avatar */}
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-24"
                  style={{
                    backgroundImage: `url("${
                      getAvatarUrl(otherMember?.avatar) || ""
                    }")`,
                  }}
                />

                {/* Name and Status */}
                <div className="flex flex-col items-center text-center">
                  <h2 className="text-xl font-bold text-black dark:text-white">
                    {otherMember?.displayName || conversation?.groupName}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {otherMember?.status === StatusUser.Online
                      ? "Đang hoạt động"
                      : formatLastActive(otherMember?.lastActiveAt)}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={onStartAudioCall}
                    disabled={isBlocked}
                    className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined">call</span>
                    <span className="text-xs">Gọi</span>
                  </button>
                  <button
                    onClick={onStartVideoCall}
                    disabled={isBlocked}
                    className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined">videocam</span>
                    <span className="text-xs">Video</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">search</span>
                    <span className="text-xs">Tìm kiếm</span>
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="p-4 space-y-4">
                {/* Tùy chọn */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 px-2">
                    Tùy chọn
                  </h4>

                  {/* Notifications */}
                  <button
                    onClick={() => setNotificationModalOpen(true)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">
                      notifications
                    </span>
                    <div className="text-left flex-1">
                      <p className="text-black dark:text-white text-base">
                        Thông báo
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {notificationSettings.mute ? "Đã tắt" : "Bật"}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-gray-400">
                      chevron_right
                    </span>
                  </button>

                  {/* Theme */}
                  <button
                    onClick={() => setThemeModalOpen(true)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">
                      palette
                    </span>
                    <div className="text-left flex-1">
                      <p className="text-black dark:text-white text-base">
                        Chủ đề
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedTheme === "default"
                          ? "Mặc định"
                          : selectedTheme === "dark"
                          ? "Tối"
                          : selectedTheme === "light"
                          ? "Sáng"
                          : "Tuỳ chỉnh"}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-gray-400">
                      chevron_right
                    </span>
                  </button>
                </div>

                {/* Quyền riêng tư & hỗ trợ */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 px-2">
                    Quyền riêng tư & hỗ trợ
                  </h4>
                  <button
                    onClick={handleBlockUser}
                    disabled={blockLoading}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isBlocked
                        ? "hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                        : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="material-symbols-outlined">
                      {isBlocked ? "check_circle" : "block"}
                    </span>
                    <span className="text-black dark:text-white text-base">
                      {isBlocked ? "Đã chặn" : "Chặn"}
                    </span>
                  </button>

                  {/* Report Button */}
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors"
                  >
                    <span className="material-symbols-outlined">report</span>
                    <span className="text-red-500 text-base">Báo cáo</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            // Media Tab
            <div className="p-4">
              {allAttachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">
                    image
                  </span>
                  <p className="text-sm">Không có media nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allAttachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={getFileUrl(attachment.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={attachment.fileName}
                      className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
                    >
                      {attachment.type === "image" ? (
                        <>
                          <img
                            src={getFileUrl(attachment.fileUrl)}
                            alt={attachment.fileName}
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {attachment.fileName}
                          </p>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-lg text-primary">
                            description
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-black dark:text-white truncate">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(attachment.fileSize)}
                            </p>
                          </div>
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
      {/* Notifications Modal */}
      <Modal
        title="Cài đặt thông báo"
        open={notificationModalOpen}
        onOk={handleNotificationSave}
        onCancel={() => setNotificationModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <p className="font-medium text-black dark:text-white">Âm thanh</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Phát âm thanh khi có tin nhắn mới
              </p>
            </div>
            <Switch
              checked={notificationSettings.sound}
              onChange={(checked) =>
                setNotificationSettings({
                  ...notificationSettings,
                  sound: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <p className="font-medium text-black dark:text-white">
                Xem trước nội dung
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hiển thị nội dung tin nhắn trong thông báo
              </p>
            </div>
            <Switch
              checked={notificationSettings.preview}
              onChange={(checked) =>
                setNotificationSettings({
                  ...notificationSettings,
                  preview: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <p className="font-medium text-black dark:text-white">
                Tắt tiếng
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tạm dừng thông báo từ cuộc trò chuyện này
              </p>
            </div>
            <Switch
              checked={notificationSettings.mute}
              onChange={(checked) =>
                setNotificationSettings({
                  ...notificationSettings,
                  mute: checked,
                })
              }
            />
          </div>

          {notificationSettings.mute && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tắt tiếng cho đến
              </p>
              <select
                value={notificationSettings.muteUntil}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    muteUntil: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white"
              >
                <option value="1hour">1 giờ</option>
                <option value="8hour">8 giờ</option>
                <option value="1day">1 ngày</option>
                <option value="never">Vĩnh viễn</option>
              </select>
            </div>
          )}
        </div>
      </Modal>
      {/* Theme Modal */}
      <Modal
        title="Chọn chủ đề cuộc trò chuyện"
        open={themeModalOpen}
        onOk={handleThemeSave}
        onCancel={() => setThemeModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <div className="space-y-3">
          <div
            onClick={() => setSelectedTheme("default")}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedTheme === "default"
                ? "border-primary bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-gradient-to-br from-blue-500 to-blue-600" />
              <div>
                <p className="font-medium text-black dark:text-white">
                  Mặc định
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Xanh dương tiêu chuẩn
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedTheme("dark")}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedTheme === "dark"
                ? "border-primary bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-gradient-to-br from-gray-800 to-gray-900" />
              <div>
                <p className="font-medium text-black dark:text-white">Tối</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tối để bảo vệ mắt
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedTheme("light")}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedTheme === "light"
                ? "border-primary bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-gradient-to-br from-gray-100 to-gray-200" />
              <div>
                <p className="font-medium text-black dark:text-white">Sáng</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sáng để dễ đọc
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedTheme("custom")}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedTheme === "custom"
                ? "border-primary bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" />
              <div>
                <p className="font-medium text-black dark:text-white">
                  Tuỳ chỉnh
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Màu sắc cá nhân
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      {/* Report Modal - with success state */}
      <Modal
        title="Báo cáo người dùng"
        open={reportModalOpen}
        onCancel={handleReportModalClose}
        footer={
          reportSubmitted
            ? null
            : [
                <Button key="cancel" onClick={handleReportModalClose}>
                  Hủy
                </Button>,
                <Button
                  key="submit"
                  danger
                  loading={reportLoading}
                  onClick={handleReportSubmit}
                  disabled={!reportReason}
                >
                  Gửi báo cáo
                </Button>,
              ]
        }
      >
        {reportSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-400">
                check_circle
              </span>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-black dark:text-white">
                Báo cáo đã được gửi
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Cảm ơn bạn. Chúng tôi sẽ xem xét vấn đề này sớm.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Báo cáo này sẽ được gửi đến đội quản lý. Vui lòng cung cấp
                chi tiết chính xác.
              </p>
            </div>

            {/* Reported User */}
            <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Báo cáo
              </p>
              <p className="font-medium text-black dark:text-white">
                {otherMember?.displayName}
              </p>
            </div>

            {/* Report Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lý do báo cáo <span className="text-red-500">*</span>
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Chọn lý do --</option>
                {reportReasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Report Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chi tiết (tuỳ chọn)
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) =>
                  setReportDescription(e.target.value.substring(0, 500))
                }
                placeholder="Mô tả chi tiết vấn đề mà bạn gặp phải..."
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {reportDescription.length}/500 ký tự
              </p>
            </div>

            {/* Warning */}
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-xs text-red-700 dark:text-red-300">
                ❌ Báo cáo giả mạo hoặc lạm dụng có thể dẫn đến hành động chống
                lại tài khoản của bạn.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ContactInfoSidebar;
