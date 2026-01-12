import React, { useState, useEffect } from "react";
import { conversationApi } from "../../api/conversation.api";
import { Attachment } from "../../types/message.types";
import { formatFileSize } from "../../utils/formatters";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface MediaGalleryProps {
  conversationId: number;
  onClose: () => void;
}

type MediaType = "all" | "images" | "videos" | "files" | "links";

const MediaGallery: React.FC<MediaGalleryProps> = ({
  conversationId,
  onClose,
}) => {
  const { t } = useTranslation();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [filteredAttachments, setFilteredAttachments] = useState<Attachment[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<MediaType>("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAttachments();
  }, [conversationId]);

  useEffect(() => {
    filterAttachments();
  }, [selectedType, searchQuery, attachments]);

  const loadAttachments = async () => {
    setLoading(true);
    try {
      const data = await conversationApi.getConversationAttachments(
        conversationId
      );
      setAttachments(data);
    } catch (err) {
      console.error("Failed to load attachments:", err);
      toast.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  const filterAttachments = () => {
    let filtered = [...attachments];

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((att) => {
        const ext = att.fileName.toLowerCase().split(".").pop();
        switch (selectedType) {
          case "images":
            return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
          case "videos":
            return ["mp4", "avi", "mov", "wmv", "webm"].includes(ext || "");
          case "files":
            return ![
              "jpg",
              "jpeg",
              "png",
              "gif",
              "webp",
              "mp4",
              "avi",
              "mov",
              "wmv",
              "webm",
            ].includes(ext || "");
          default:
            return true;
        }
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((att) =>
        att.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAttachments(filtered);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % filteredAttachments.length);
  };

  const prevImage = () => {
    setLightboxIndex(
      (prev) =>
        (prev - 1 + filteredAttachments.length) % filteredAttachments.length
    );
  };

  const getFileUrl = (fileUrl: string) => {
    if (fileUrl.startsWith("http")) {
      return fileUrl;
    }
    const baseUrl = process.env.REACT_APP_API_URL?.replace("/api", "");
    return `${baseUrl}${fileUrl}`;
  };

  const isImage = (fileName: string) => {
    const ext = fileName.toLowerCase().split(".").pop();
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
  };

  const isVideo = (fileName: string) => {
    const ext = fileName.toLowerCase().split(".").pop();
    return ["mp4", "avi", "mov", "wmv", "webm"].includes(ext || "");
  };

  const getTabLabel = (type: MediaType) => {
    switch (type) {
      case "all":
        return t("media.tabs.all");
      case "images":
        return t("media.tabs.images");
      case "videos":
        return t("media.tabs.videos");
      case "files":
        return t("media.tabs.files");
      default:
        return t("media.tabs.all");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
          <div>
            <h2 className="text-2xl font-bold">{t("media.title")}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t("media.count_items", { count: filteredAttachments.length })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 p-6 border-b border-slate-200 dark:border-white/10">
          <div className="flex gap-2 flex-wrap">
            {(["all", "images", "videos", "files"] as MediaType[]).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                    selectedType === type
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10"
                  }`}
                >
                  {getTabLabel(type)}
                </button>
              )
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">
              search
            </span>
            <input
              type="text"
              placeholder={t("media.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : filteredAttachments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <span className="material-symbols-outlined text-6xl mb-4">
                folder_open
              </span>
              <p className="text-lg font-bold">{t("media.no_media")}</p>
              <p className="text-sm">{t("media.try_changing")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredAttachments.map((attachment, index) => (
                <div
                  key={attachment.id}
                  className="group relative aspect-square bg-slate-100 dark:bg-white/5 rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all"
                  onClick={() =>
                    isImage(attachment.fileName)
                      ? openLightbox(index)
                      : window.open(getFileUrl(attachment.fileUrl), "_blank")
                  }
                >
                  {isImage(attachment.fileName) ? (
                    <img
                      src={getFileUrl(attachment.fileUrl)}
                      alt={attachment.fileName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : isVideo(attachment.fileName) ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                      <span className="material-symbols-outlined text-white text-5xl">
                        play_circle
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                      <span className="material-symbols-outlined text-4xl text-primary mb-2">
                        description
                      </span>
                      <p className="text-xs font-bold truncate w-full">
                        {attachment.fileName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatFileSize(attachment.fileSize)}
                      </p>
                    </div>
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end">
                    <div className="w-full p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-bold truncate">
                        {attachment.fileName}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen &&
        filteredAttachments[lightboxIndex] &&
        isImage(filteredAttachments[lightboxIndex].fileName) && (
          <div
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeLightbox();
              }}
              className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <img
              src={getFileUrl(filteredAttachments[lightboxIndex].fileUrl)}
              alt={filteredAttachments[lightboxIndex].fileName}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full">
              <p className="text-white text-sm font-bold">
                {lightboxIndex + 1} / {filteredAttachments.length}
              </p>
            </div>
          </div>
        )}
    </div>
  );
};

export default MediaGallery;
