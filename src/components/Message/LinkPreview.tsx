import React, { useEffect, useState } from "react";
import metadataApi, { LinkPreviewData } from "../../api/metadata.api";

interface LinkPreviewProps {
  url: string;
  isOwn?: boolean;
  hideMargin?: boolean;
}

const LinkPreview: React.FC<LinkPreviewProps> = ({
  url,
  isOwn,
  hideMargin,
}) => {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const data = await metadataApi.getLinkPreview(url);
        setPreview(data);
      } catch (err) {
        console.error("Failed to fetch link preview:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (loading) {
    return (
      <div className="mt-2 p-3 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse border border-slate-200 dark:border-white/10 max-w-sm">
        <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-full mb-2"></div>
        <div className="h-32 bg-slate-200 dark:bg-white/10 rounded w-full"></div>
      </div>
    );
  }

  if (!preview || (!preview.title && !preview.description)) return null;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${!hideMargin ? "mt-2" : ""} block rounded-xl overflow-hidden border ${
        isOwn
          ? "border-white/20 bg-white/10 hover:bg-white/20"
          : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10"
      } transition-all no-underline text-inherit group shadow-sm w-full max-w-sm`}
    >
      {preview.imageUrl && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={preview.imageUrl}
            alt={preview.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>
      )}
      <div className="p-3">
        <span
          className={`text-[10px] font-bold ${
            isOwn ? "text-white/50" : "text-primary"
          } uppercase tracking-widest mb-1 block`}
        >
          {preview.siteName}
        </span>
        <h5 className="text-sm font-bold truncate mb-1 line-clamp-1">
          {preview.title}
        </h5>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {preview.description}
        </p>
      </div>
    </a>
  );
};

export default LinkPreview;
