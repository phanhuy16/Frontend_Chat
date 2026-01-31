import React from "react";

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
  const folders = [
    { id: "all", label: "Tất cả", icon: "forum", count: counts.all },
    { id: "direct", label: "Cá nhân", icon: "person", count: counts.direct },
    { id: "groups", label: "Nhóm", icon: "group", count: counts.groups },
    { id: "archived", label: "Lưu trữ", icon: "archive", count: counts.archived },
  ] as const;

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl mb-4 mx-4">
      {folders.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onFolderChange(folder.id as FolderType)}
          className={`flex-1 flex flex-col items-center py-2 px-1 rounded-lg transition-all relative ${
            activeFolder === folder.id
              ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50"
          }`}
        >
          <span className={`material-symbols-outlined text-[20px] mb-0.5 ${activeFolder === folder.id ? "font-fill" : ""}`}>
            {folder.icon}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-tighter truncate w-full text-center">
            {folder.label}
          </span>
          {folder.count > 0 && folder.id !== "all" && (
            <span className="absolute top-1 right-1 size-4 flex items-center justify-center bg-primary text-white text-[9px] font-black rounded-full border-2 border-white dark:border-slate-800">
              {folder.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default ChatFolders;
