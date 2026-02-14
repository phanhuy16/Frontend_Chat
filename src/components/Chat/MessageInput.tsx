import React from "react";
import ChatMediaPicker from "./ChatMediaPicker";
import { useTranslation } from "react-i18next";
import PollCreationModal from "../CreatePoll/PollCreationModal";
import DateTimePicker from "./DateTimePicker";
import SelfDestructSelector from "./SelfDestructSelector";
import { format } from "date-fns";

interface MessageInputProps {
  inputValue: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  isBlocked: boolean;
  uploadingFiles: boolean;
  uploadProgress: number;
  showUploadMenu: boolean;
  setShowUploadMenu: (show: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRecording: boolean;
  recordingTime: number;
  startRecording: () => void;
  stopRecording: () => void;
  cancelRecording: () => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  setInputValue: (val: string | ((prev: string) => string)) => void;
  uploadMenuRef: React.RefObject<HTMLDivElement | null>;
  showGiphyPicker: boolean;
  setShowGiphyPicker: (show: boolean) => void;
  onGifSelect: (gif: any) => void;
  blockerId?: number;
  currentUserId?: number;
  conversationId?: number;
  onOpenPollModal?: () => void;
  scheduledAt: string | null;
  setScheduledAt: (val: string | null) => void;
  showDateTimePicker: boolean;
  setShowDateTimePicker: (show: boolean) => void;
  members: {
    id: number;
    displayName: string;
    avatar: string;
    userName?: string;
  }[];
  onMentionSelect?: (userId: number) => void;
  isGroup: boolean;
  selfDestructAfterSeconds: number | null;
  setSelfDestructAfterSeconds: (seconds: number | null) => void;
  slowMode?: number;
  isAdmin?: boolean;
  smartReplies?: string[];
  onSmartReplyClick?: (reply: string) => void;
  onAiClick?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  inputValue,
  handleInputChange,
  handleSendMessage,
  isBlocked,
  uploadingFiles,
  uploadProgress,
  showUploadMenu,
  setShowUploadMenu,
  fileInputRef,
  handleFileInput,
  isRecording,
  recordingTime,
  startRecording,
  stopRecording,
  cancelRecording,
  showEmojiPicker,
  setShowEmojiPicker,
  setInputValue,
  uploadMenuRef,
  showGiphyPicker,
  setShowGiphyPicker,
  onGifSelect,
  blockerId,
  currentUserId,
  conversationId,
  onOpenPollModal,
  scheduledAt,
  setScheduledAt,
  showDateTimePicker,
  setShowDateTimePicker,
  members,
  onMentionSelect,
  isGroup,
  selfDestructAfterSeconds,
  setSelfDestructAfterSeconds,
  slowMode = 0,
  isAdmin = false,
  smartReplies = [],
  onSmartReplyClick,
  onAiClick,
}) => {
  const { t } = useTranslation();
  const [showMentions, setShowMentions] = React.useState(false);
  const [mentionQuery, setMentionQuery] = React.useState("");
  const [mentionIndex, setMentionIndex] = React.useState(0);
  const [cursorPosition, setCursorPosition] = React.useState(0);
  const [showSelfDestructSelector, setShowSelfDestructSelector] =
    React.useState(false);
  const [showCommands, setShowCommands] = React.useState(false);
  const [commandQuery, setCommandQuery] = React.useState("");
  const [commandIndex, setCommandIndex] = React.useState(0);
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  const moreMenuRef = React.useRef<HTMLDivElement | null>(null);
  const moreButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const internalInputRef = React.useRef<HTMLInputElement | null>(null);

  // Slow Mode Logic
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (!slowMode || isAdmin) {
      setCooldown(0);
      return;
    }

    const checkCooldown = () => {
      const lastSent = localStorage.getItem(`lastSent_${conversationId}`);
      if (lastSent) {
        const timePassed = (Date.now() - parseInt(lastSent)) / 1000;
        if (timePassed < slowMode) {
          setCooldown(Math.ceil(slowMode - timePassed));
        } else {
          setCooldown(0);
        }
      }
    };

    checkCooldown();
    const interval = setInterval(() => {
      const lastSent = localStorage.getItem(`lastSent_${conversationId}`);
      if (lastSent) {
        const timePassed = (Date.now() - parseInt(lastSent)) / 1000;
        if (timePassed < slowMode) {
          setCooldown(Math.ceil(slowMode - timePassed));
        } else {
          setCooldown(0);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [slowMode, isAdmin, conversationId]);

  const onSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 && !isAdmin) {
      return;
    }

    if (slowMode > 0 && !isAdmin) {
      localStorage.setItem(`lastSent_${conversationId}`, Date.now().toString());
      setCooldown(slowMode);
    }

    handleSendMessage(e);
  };

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showMoreMenu &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(event.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreMenu]);

  const filteredMembers = React.useMemo(() => {
    if (!mentionQuery) return members.filter((m) => m.id !== currentUserId);
    return members.filter(
      (m) =>
        m.id !== currentUserId &&
        m.displayName.toLowerCase().includes(mentionQuery.toLowerCase()),
    );
  }, [members, mentionQuery, currentUserId]);

  const AVAILABLE_COMMANDS = React.useMemo(
    () => [
      { command: "/ai", icon: "smart_toy", desc: t("chat.commands.ai") },
      { command: "/weather", icon: "sunny", desc: t("chat.commands.weather") },
      {
        command: "/remind",
        icon: "notifications_active",
        desc: t("chat.commands.remind"),
      },
    ],
    [t],
  );

  const isAiChat = React.useMemo(() => {
    return members.some((m) => m.userName === "ai_bot");
  }, [members]);

  const filteredCommands = React.useMemo(() => {
    let commands = AVAILABLE_COMMANDS;

    if (isAiChat) {
      // In AI Chat: Show everything EXCEPT /ai (redundant)
      commands = commands.filter((c) => c.command !== "/ai");
    } else {
      // Normal Chat: Show ONLY /ai (to switch context)
      commands = commands.filter((c) => c.command === "/ai");
    }

    if (!commandQuery) return commands;
    return commands.filter((c) =>
      c.command.toLowerCase().includes(commandQuery.toLowerCase()),
    );
  }, [commandQuery, AVAILABLE_COMMANDS, isAiChat]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const selectionStart = e.target.selectionStart || 0;
    setCursorPosition(selectionStart);

    handleInputChange(e);

    // Slash Commands Logic
    if (value.startsWith("/")) {
      const spaceIndex = value.indexOf(" ");
      if (spaceIndex === -1 || selectionStart <= spaceIndex) {
        setCommandQuery(value.substring(0, selectionStart));
        setShowCommands(true);
        setMentionIndex(0); // reuse index or use commandIndex
        return;
      }
    }
    setShowCommands(false);

    // Mention logic - ONLY in Group Chats
    if (!isGroup) {
      setShowMentions(false);
      return;
    }

    const textBeforeCursor = value.substring(0, selectionStart);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex !== -1) {
      const query = textBeforeCursor.substring(atIndex + 1);
      // Check if there's a space before @ or if it's the start
      if (atIndex === 0 || textBeforeCursor[atIndex - 1] === " ") {
        if (!query.includes(" ")) {
          setMentionQuery(query);
          setShowMentions(true);
          setMentionIndex(0);
          return;
        }
      }
    }
    setShowMentions(false);
  };

  const insertMention = (member: { id: number; displayName: string }) => {
    const textBeforeAt = inputValue.substring(
      0,
      inputValue.lastIndexOf("@", cursorPosition - 1),
    );
    const textAfterCursor = inputValue.substring(cursorPosition);
    const newValue = `${textBeforeAt}@${member.displayName} ${textAfterCursor}`;

    setInputValue(newValue);
    setShowMentions(false);
    onMentionSelect?.(member.id);

    // Autofocus back to input would be good, but we don't have the ref easily here without adding it.
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredMembers.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex(
          (prev) =>
            (prev - 1 + filteredMembers.length) % filteredMembers.length,
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMembers[mentionIndex]);
      } else if (e.key === "Escape") {
        setShowMentions(false);
      }
    }

    if (showCommands && filteredCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCommandIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCommandIndex(
          (prev) =>
            (prev - 1 + filteredCommands.length) % filteredCommands.length,
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const cmd = filteredCommands[commandIndex].command;
        if (cmd === "/poll") {
          onOpenPollModal?.();
          setInputValue("");
        } else {
          setInputValue(cmd + " ");
        }
        setShowCommands(false);
      } else if (e.key === "Escape") {
        setShowCommands(false);
      }
    }
  };

  return (
    <div className="px-3 py-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 shrink-0 z-20">
      {uploadingFiles && (
        <div className="mb-4 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {isBlocked ? (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl animate-fade-in backdrop-blur-sm">
          <div className="mb-2 size-10 flex items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30 text-red-500">
            <span className="material-symbols-outlined text-xl">
              {blockerId === currentUserId ? "block" : "lock"}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center">
            {t("chat.disabled_blocked") ||
              "You cannot send messages to this user."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col w-full relative">
          {/* Smart Replies */}
          {smartReplies.length > 0 && !inputValue && (
            <div className="flex items-center gap-2 px-1 mb-3 overflow-x-auto no-scrollbar animate-fade-in-up">
              {smartReplies.map((reply, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSmartReplyClick?.(reply)}
                  className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm whitespace-nowrap active:scale-95"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSendMessage} className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />

            {isRecording ? (
              <div className="flex-1 flex items-center justify-between gap-4 bg-gradient-to-r from-red-500/10 via-transparent to-transparent pl-4 pr-2 py-2 rounded-full border border-red-500/20 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 text-red-500 animate-pulse">
                    <span className="material-symbols-outlined text-lg">
                      mic
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-red-500 uppercase tracking-wider animate-pulse">
                      Recording
                    </span>
                    <span className="font-mono text-sm font-black text-slate-700 dark:text-white tabular-nums">
                      {Math.floor(recordingTime / 60)}:
                      {(recordingTime % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {/* Simulated Waveform Visualizer */}
                <div className="flex-1 flex items-center justify-center gap-1 h-6 opacity-50">
                  {[1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-red-500 rounded-full animate-wave"
                      style={{
                        height: `${h * 20}%`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all hover:scale-110 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-xl">
                      send
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {cooldown > 0 && !isAdmin && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded-md animate-bounce z-30">
                    {t("chat.slow_mode_wait", { seconds: cooldown })}
                  </div>
                )}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUploadMenu(!showUploadMenu)}
                    className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-200 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      add
                    </span>
                  </button>
                  {showUploadMenu && (
                    <div
                      ref={uploadMenuRef}
                      className="absolute bottom-16 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 py-2 min-w-[180px] animate-slide-up"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = "image/*";
                            fileInputRef.current.click();
                          }
                          setShowUploadMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors text-slate-700 dark:text-slate-300 font-bold"
                      >
                        <span className="material-symbols-outlined text-primary">
                          image
                        </span>
                        <span className="text-sm">
                          {t("chat.upload.images")}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = "*/*";
                            fileInputRef.current.click();
                          }
                          setShowUploadMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors text-slate-700 dark:text-slate-300 font-bold"
                      >
                        <span className="material-symbols-outlined text-secondary">
                          description
                        </span>
                        <span className="text-sm">
                          {t("chat.upload.files")}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 relative group">
                  <input
                    ref={internalInputRef}
                    className={`w-full pl-5 pr-14 py-2.5 rounded-full bg-slate-100/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-500 border-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 font-medium text-sm h-10 ${cooldown > 0 && !isAdmin ? "opacity-50 cursor-not-allowed" : ""}`}
                    placeholder={
                      cooldown > 0 && !isAdmin
                        ? t("chat.slow_mode_wait", { seconds: cooldown })
                        : t("chat.input_placeholder")
                    }
                    type="text"
                    value={inputValue}
                    onChange={onInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={cooldown > 0 && !isAdmin}
                  />

                  {showCommands && filteredCommands.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-up">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {t("chat.commands.title")}
                        </p>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredCommands.length === 0 && (
                          <div className="p-3 text-sm text-slate-500 text-center italic">
                            {t("chat.commands.no_results")}
                          </div>
                        )}
                        {filteredCommands.map((cmd, index) => (
                          <button
                            key={cmd.command}
                            type="button"
                            onClick={() => {
                              if (cmd.command === "/poll") {
                                onOpenPollModal?.();
                                setInputValue("");
                              } else {
                                setInputValue(cmd.command + " ");
                              }
                              setShowCommands(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                              index === commandIndex
                                ? "bg-primary/10 dark:bg-primary/20"
                                : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                            }`}
                          >
                            <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-primary">
                              <span className="material-symbols-outlined text-lg">
                                {cmd.icon}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                {cmd.command}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {cmd.desc}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {showMentions && filteredMembers.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-up">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {t("chat.mention_title")}
                        </p>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredMembers.map((member, index) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => insertMention(member)}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                              index === mentionIndex
                                ? "bg-primary/10 dark:bg-primary/20"
                                : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                            }`}
                          >
                            <img
                              src={member.avatar || "/default-avatar.png"}
                              alt=""
                              className="size-6 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                              onError={(e) =>
                                (e.currentTarget.src = "/default-avatar.png")
                              }
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                {member.displayName}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-primary transition-colors rounded-full hover:bg-primary/10 ${showEmojiPicker ? "text-primary" : ""}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      sentiment_satisfied
                    </span>
                  </button>
                  <div className="absolute right-0 bottom-full mb-4">
                    <ChatMediaPicker
                      isOpen={showEmojiPicker || showGiphyPicker}
                      onClose={() => {
                        setShowEmojiPicker(false);
                        setShowGiphyPicker(false);
                      }}
                      onEmojiSelect={(emoji) => {
                        setInputValue((prev) => prev + emoji);
                      }}
                      onGifSelect={(gif) => {
                        onGifSelect(gif);
                        setShowGiphyPicker(false);
                        setShowEmojiPicker(false);
                      }}
                    />
                    {showDateTimePicker && (
                      <DateTimePicker
                        value={scheduledAt || ""}
                        onChange={(val) => setScheduledAt(val)}
                        onClose={() => setShowDateTimePicker(false)}
                        onConfirm={() => setShowDateTimePicker(false)}
                      />
                    )}
                    {showSelfDestructSelector && (
                      <SelfDestructSelector
                        value={selfDestructAfterSeconds}
                        onChange={setSelfDestructAfterSeconds}
                        isOpen={showSelfDestructSelector}
                        onClose={() => setShowSelfDestructSelector(false)}
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <div className="relative">
                    <button
                      ref={moreButtonRef}
                      type="button"
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                        showMoreMenu || scheduledAt || selfDestructAfterSeconds
                          ? "text-primary bg-primary/10"
                          : "text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary/10"
                      }`}
                      title="More options"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        widgets
                      </span>
                    </button>

                    {showMoreMenu && (
                      <div
                        ref={moreMenuRef}
                        className="absolute bottom-10 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 py-2 min-w-[200px] animate-slide-up"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onOpenPollModal?.();
                            setShowMoreMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors text-slate-700 dark:text-slate-300 font-bold"
                        >
                          <span className="material-symbols-outlined text-orange-500">
                            poll
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm">Poll</span>
                            <span className="text-[10px] font-normal text-slate-500">
                              Create a survey
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowDateTimePicker(true);
                            setShowMoreMenu(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors font-bold ${
                            scheduledAt
                              ? "text-blue-500"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="material-symbols-outlined text-blue-500">
                            schedule
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm">Schedule Message</span>
                            <span className="text-[10px] font-normal text-slate-500">
                              Send later
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowSelfDestructSelector(true);
                            setShowMoreMenu(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors font-bold ${
                            selfDestructAfterSeconds
                              ? "text-red-500"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="material-symbols-outlined text-red-500">
                            timer
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm">Self-destruct Timer</span>
                            <span className="text-[10px] font-normal text-slate-500">
                              Automatic delete
                            </span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {inputValue.trim() ? (
                    <button
                      type="submit"
                      disabled={
                        !inputValue.trim() ||
                        uploadingFiles ||
                        (cooldown > 0 && !isAdmin)
                      }
                      className="w-10 h-10 flex items-center justify-center text-white bg-primary rounded-full disabled:opacity-30 hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all duration-200 shrink-0 transform active:scale-95 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        send
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-200 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        mic
                      </span>
                    </button>
                  )}
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {scheduledAt && (
        <div className="mt-2 flex items-center gap-2 px-2 py-1 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg animate-in fade-in slide-in-from-top-1">
          <span className="material-symbols-outlined text-sm text-blue-500">
            schedule
          </span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
            Scheduled for: {format(new Date(scheduledAt), "MMM d, HH:mm")}
          </span>
          <button
            onClick={() => setScheduledAt(null)}
            className="ml-auto text-blue-400 hover:text-blue-600 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
