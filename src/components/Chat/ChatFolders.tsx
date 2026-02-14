import React from "react";
import { useTranslation } from "react-i18next";

export type FolderType = "all" | "direct" | "groups" | "archived";

interface ChatFoldersProps {
  activeFolder: FolderType;
  onFolderChange: (folder: FolderType) => void;
  counts: {
    all: number;
    direct: number;
    groups: number;
    archived: number;
  };
}

const ChatFolders: React.FC<ChatFoldersProps> = ({
  activeFolder,
  onFolderChange,
  counts,
}) => {
  const { t } = useTranslation();

  const folders = [
    {
      id: "all",
      label: t("chat_folders.all"),
      icon: "forum",
      count: counts.all,
    },
    {
      id: "direct",
      label: t("chat_folders.direct"),
      icon: "person",
      count: counts.direct,
    },
    {
      id: "groups",
      label: t("chat_folders.groups"),
      icon: "group",
      count: counts.groups,
    },
    {
      id: "archived",
      label: t("chat_folders.archived"),
      icon: "archive",
      count: counts.archived,
    },
  ] as const;

  return (
    <div className="flex items-center gap-0.5 p-0.5 bg-slate-100/50 dark:bg-slate-800/40 rounded-xl mb-2 mx-4 border border-slate-200/30 dark:border-white/5">
      {folders.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onFolderChange(folder.id as FolderType)}
          className={`flex-1 flex items-center justify-center gap-1 py-1 px-0.5 rounded-lg transition-all relative ${
            activeFolder === folder.id
              ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/30 dark:hover:bg-slate-700/30"
          }`}
        >
          <span
            className={`material-symbols-outlined text-[14px] ${activeFolder === folder.id ? "font-fill" : ""}`}
          >
            {folder.icon}
          </span>
          <span className="text-[8px] font-black uppercase tracking-tighter truncate">
            {folder.label}
          </span>
          {folder.count > 0 && (
            <span className="absolute -top-1 -right-0.5 size-3 flex items-center justify-center bg-primary text-white text-[7px] font-black rounded-full border border-white dark:border-slate-800 shadow-sm animate-scale-in">
              {folder.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default ChatFolders;
