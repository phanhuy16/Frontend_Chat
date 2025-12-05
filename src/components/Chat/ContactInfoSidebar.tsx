import React, { useEffect, useMemo, useState } from "react";
import { Conversation, StatusUser, User } from "../../types";
import { Message } from "../../types/message.types";
import { useAuth } from "../../hooks/useAuth";
import blockApi from "../../api/block.api";
import toast from "react-hot-toast";

interface ContactInfoSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  otherMember?: User | null;
  conversation?: Conversation | null;
  messages?: Message[];
}

const ContactInfoSidebar: React.FC<ContactInfoSidebarProps> = ({
  isOpen,
  onClose,
  otherMember,
  conversation,
  messages = [],
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"info" | "media">("info");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

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

  // Handle block/unblock
  const handleBlockUser = async () => {
    if (!user?.id || !otherMember?.id) return;

    setBlockLoading(true);
    try {
      if (isBlocked) {
        await blockApi.unblockUser(user.id, otherMember.id);
        toast.success(`Đã bỏ chặn ${otherMember.displayName}`);
        setIsBlocked(false);
      } else {
        await blockApi.blockUser(user.id, otherMember.id);
        toast.success(`Đã chặn ${otherMember.displayName}`);
        setIsBlocked(true);
      }
    } catch (err) {
      console.error("Error blocking user:", err);
      toast.error("Lỗi khi chặn người dùng");
    } finally {
      setBlockLoading(false);
    }
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
            className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"
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
                    backgroundImage: `url("${otherMember?.avatar || ""}")`,
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
                      : "Hoạt động 15 phút trước"}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">call</span>
                    <span className="text-xs">Gọi</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">
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
                  <button
                    onClick={() => setActiveTab("media")}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">
                      image
                    </span>
                    <span className="text-black dark:text-white text-base">
                      File, phương tiện & liên kết
                    </span>
                  </button>
                  <a
                    href="#"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">
                      notifications
                    </span>
                    <span className="text-black dark:text-white text-base">
                      Thông báo
                    </span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">
                      palette
                    </span>
                    <span className="text-black dark:text-white text-base">
                      Chủ đề
                    </span>
                  </a>
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
                  <a
                    href="#"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-red-500">
                      report
                    </span>
                    <span className="text-red-500 text-base">Báo cáo</span>
                  </a>
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
    </>
  );
};

export default ContactInfoSidebar;
