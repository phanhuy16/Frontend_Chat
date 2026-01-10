import React, { useEffect, useState } from "react";
import { conversationApi } from "../../api/conversation.api";
import { AttachmentDto } from "../../types/message.types";
import { formatFileSize } from "../../utils/formatters";
import {
  format,
  isThisMonth,
  isSameMonth,
  subMonths,
  parseISO,
} from "date-fns";
import { vi } from "date-fns/locale";

interface ConversationMediaProps {
  conversationId: number;
}

const ConversationMedia: React.FC<ConversationMediaProps> = ({
  conversationId,
}) => {
  const [activeTab, setActiveTab] = useState<"media" | "files" | "links">(
    "media"
  );
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!conversationId) return;
      try {
        setLoading(true);
        const data = await conversationApi.getConversationAttachments(
          conversationId
        );
        setAttachments(data);
      } catch (err) {
        console.error("Failed to fetch attachments", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();
  }, [conversationId]);

  const getFileUrl = (fileUrl: string) => {
    if (fileUrl.startsWith("http")) return fileUrl;
    const baseUrl = process.env.REACT_APP_API_URL?.replace("/api", "");
    return `${baseUrl}${fileUrl}`;
  };

  const isImage = (fileName: string) =>
    /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(fileName);
  const isVideo = (fileName: string) =>
    /\.(mp4|mov|avi|wmv|flv|mkv)$/i.test(fileName);

  const filteredAttachments = attachments.filter((a) =>
    a.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mediaItems = filteredAttachments.filter((a) => isImage(a.fileName));
  const fileItems = filteredAttachments.filter((a) => !isImage(a.fileName));

  // Group media by month
  const groupedMedia = mediaItems.reduce((groups: any, item) => {
    const date = parseISO(item.uploadedAt);
    let groupName = format(date, "MMMM yyyy", { locale: vi });

    if (isThisMonth(date)) groupName = "Tháng này";
    else if (isSameMonth(date, subMonths(new Date(), 1)))
      groupName = "Tháng trước";

    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(item);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-full animate-fade-in bg-slate-50 dark:bg-slate-900/20">
      {/* Search Header Area */}
      <div className="px-6 py-4 space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Kho lưu trữ Media & Tệp tin
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Tất cả hình ảnh, video và tài liệu trong cuộc hội thoại này
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tên tệp..."
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-medium placeholder:text-slate-500 focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors !text-[18px]">
            search
          </span>
        </div>

        {/* Custom Redesigned Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-1">
          <button
            onClick={() => setActiveTab("media")}
            className={`flex items-center gap-2 pb-2 text-[11px] font-bold transition-all relative ${
              activeTab === "media"
                ? "text-primary"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <span className="material-symbols-outlined !text-[18px]">
              image
            </span>
            Hình ảnh
            {activeTab === "media" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("files")}
            className={`flex items-center gap-2 pb-2 text-[11px] font-bold transition-all relative ${
              activeTab === "files"
                ? "text-primary"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <span className="material-symbols-outlined !text-[18px]">
              description
            </span>
            Tệp tin
            {activeTab === "files" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("links")}
            className={`flex items-center gap-2 pb-2 text-[11px] font-bold transition-all relative ${
              activeTab === "links"
                ? "text-primary"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <span className="material-symbols-outlined !text-[18px]">link</span>
            Liên kết
            {activeTab === "links" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : activeTab === "media" ? (
          mediaItems.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs font-medium italic">
              Không có hình ảnh/video
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedMedia).map((groupName) => (
                <div key={groupName} className="space-y-3">
                  <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                    {groupName}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {groupedMedia[groupName].map((item: any) => (
                      <div
                        key={item.id}
                        className="relative group/media aspect-square"
                      >
                        <a
                          href={getFileUrl(item.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 hover:opacity-90 transition-all hover:shadow-lg"
                        >
                          <img
                            src={getFileUrl(item.fileUrl)}
                            alt={item.fileName}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-110"
                          />
                          {isVideo(item.fileName) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <span className="material-symbols-outlined text-white text-3xl opacity-80 group-hover/media:scale-125 transition-transform">
                                play_circle
                              </span>
                            </div>
                          )}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === "files" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Tài liệu gần đây
              </h3>
              <button className="text-[10px] font-bold text-primary hover:underline">
                Xem tất cả
              </button>
            </div>

            {fileItems.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-medium italic">
                Không có tập tin nào
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {fileItems.map((item) => (
                  <a
                    key={item.id}
                    href={getFileUrl(item.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/30 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined !text-[20px]">
                        description
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                        {item.fileName}
                      </p>
                      <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                        {formatFileSize(item.fileSize)} •{" "}
                        {format(parseISO(item.uploadedAt), "HH:mm a", {
                          locale: vi,
                        })}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-40">
            <span className="material-symbols-outlined text-4xl">link_off</span>
            <p className="text-xs font-bold tracking-tight">
              Tính năng Link đang phát triển
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationMedia;
