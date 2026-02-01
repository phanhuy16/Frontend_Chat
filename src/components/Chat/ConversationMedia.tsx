import {
  format,
  isSameMonth,
  isThisMonth,
  parseISO,
  subMonths,
} from "date-fns";
import { enUS, vi } from "date-fns/locale";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { conversationApi } from "../../api/conversation.api";
import { AttachmentDto } from "../../types/message.types";
import { formatFileSize } from "../../utils/formatters";
import MediaGallery from "./MediaGallery";

interface ConversationMediaProps {
  conversationId: number;
}

const ConversationMedia: React.FC<ConversationMediaProps> = ({
  conversationId,
}) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<"media" | "files" | "links">(
    "media"
  );
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!conversationId) return;
      try {
        setLoading(true);
        const [atts, conversationLinks] = await Promise.all([
          conversationApi.getConversationAttachments(conversationId),
          conversationApi.getConversationLinks(conversationId)
        ]);
        setAttachments(atts);
        setLinks(conversationLinks);
      } catch (err) {
        console.error("Failed to fetch media", err);
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

  const mediaItems = useMemo(
    () => attachments.filter((a) => isImage(a.fileName)),
    [attachments]
  );
  const fileItems = useMemo(
    () => attachments.filter((a) => !isImage(a.fileName)),
    [attachments]
  );

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return {
          icon: "picture_as_pdf",
          color: "text-red-500",
          bg: "bg-red-50 dark:bg-red-900/20",
        };
      case "doc":
      case "docx":
        return {
          icon: "description",
          color: "text-blue-500",
          bg: "bg-blue-50 dark:bg-blue-900/20",
        };
      case "xls":
      case "xlsx":
        return {
          icon: "grid_on",
          color: "text-emerald-500",
          bg: "bg-emerald-50 dark:bg-emerald-900/20",
        };
      case "ppt":
      case "pptx":
        return {
          icon: "slideshow",
          color: "text-orange-500",
          bg: "bg-orange-50 dark:bg-orange-900/20",
        };
      case "zip":
      case "rar":
      case "7z":
        return {
          icon: "folder_zip",
          color: "text-purple-500",
          bg: "bg-purple-50 dark:bg-purple-900/20",
        };
      case "txt":
        return {
          icon: "article",
          color: "text-slate-500",
          bg: "bg-slate-50 dark:bg-slate-900/20",
        };
      default:
        return { icon: "draft", color: "text-primary", bg: "bg-primary/10" };
    }
  };

  const filteredAttachments = useMemo(() => {
    let items: any[] = [];
    if (activeTab === "media") items = mediaItems;
    else if (activeTab === "files") items = fileItems;
    else if (activeTab === "links") items = links;

    if (!searchTerm) return items;

    return items.filter((item: any) => {
      const name = item.fileName || item.url || "";
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [activeTab, mediaItems, fileItems, links, searchTerm]);

  // Dynamic Date Locale
  const dateLocale = i18n.language === "vi" ? vi : enUS;

  // Group media by month
  const groupedMedia = useMemo(() => {
    const itemsToGroup = activeTab === "media" ? mediaItems : [];
    return itemsToGroup.reduce((groups: any, item) => {
      const date = parseISO(item.uploadedAt);
      let groupName = format(date, "MMMM yyyy", { locale: dateLocale });

      if (isThisMonth(date))
        groupName = i18n.language === "vi" ? "Tháng này" : "This Month";
      else if (isSameMonth(date, subMonths(new Date(), 1)))
        groupName = i18n.language === "vi" ? "Tháng trước" : "Last Month";

      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(item);
      return groups;
    }, {});
  }, [mediaItems, activeTab, dateLocale, i18n.language]);

  return (
    <div className="flex flex-col h-full animate-fade-in bg-slate-50 dark:bg-slate-900/20">
      {/* Search Header Area */}
      <div className="px-6 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {t("media.title")}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {t("media.subtitle", {
                count: attachments.length + links.length,
              })}
            </p>
          </div>
          <button
            onClick={() => setShowGallery(true)}
            className="px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm"
          >
            {t("media.view_all")}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("media.search_placeholder")}
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium placeholder:text-slate-500 focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors !text-[18px]">
            search
          </span>
        </div>

        {/* Custom Redesigned Tabs (Chips) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveTab("media")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
              activeTab === "media"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {t("media.tabs.images")}
          </button>
          <button
            onClick={() => setActiveTab("files")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
              activeTab === "files"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {t("media.tabs.files")}
          </button>
          <button
            onClick={() => setActiveTab("links")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
              activeTab === "links"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {t("media.tabs.links")}
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
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <span className="material-symbols-outlined text-5xl opacity-20">
                image
              </span>
              <p className="text-xs font-medium italic">
                {t("media.no_media")}
              </p>
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
                {searchTerm
                  ? `Results for "${searchTerm}"`
                  : t("media.recent_files")}
              </h3>
            </div>

            {filteredAttachments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                <span className="material-symbols-outlined text-5xl opacity-20">
                  description
                </span>
                <p className="text-xs font-medium italic">
                  {t("media.no_files")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredAttachments.map((item) => {
                  const style = getFileIcon(item.fileName);
                  return (
                    <a
                      key={item.id}
                      href={getFileUrl(item.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/30 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group shadow-sm"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl ${style.bg} ${style.color} flex items-center justify-center shrink-0`}
                      >
                        <span className="material-symbols-outlined !text-[24px]">
                          {style.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                          {item.fileName}
                        </p>
                        <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                          {formatFileSize(item.fileSize)} •{" "}
                          {format(parseISO(item.uploadedAt), "MMM d, yyyy", {
                            locale: dateLocale,
                          })}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {searchTerm ? `Links matching "${searchTerm}"` : "Shared Links"}
              </h3>
            </div>
            {filteredAttachments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                <span className="material-symbols-outlined text-5xl opacity-20">
                  link
                </span>
                <p className="text-xs font-medium italic">No links shared</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAttachments.map((link: any, idx: number) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/30 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-xl">
                        link
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-primary transition-colors">
                        {link.url}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">
                          Shared by {link.senderName}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Media Gallery Modal */}
      {showGallery && (
        <MediaGallery
          conversationId={conversationId}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
};

export default ConversationMedia;
