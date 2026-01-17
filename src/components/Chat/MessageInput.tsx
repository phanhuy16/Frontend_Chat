import React from "react";
import { EmojiPicker } from "./EmojiPicker";
import GiphyPicker from "./GiphyPicker";
import { useTranslation } from "react-i18next";
import PollCreationModal from "../CreatePoll/PollCreationModal";

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
}) => {
  const { t } = useTranslation();

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
        <form onSubmit={handleSendMessage} className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />

          {isRecording ? (
            <div className="flex-1 flex items-center gap-3 bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-xl animate-fade-in">
              <div className="flex items-center gap-2 text-red-500 animate-pulse">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="text-sm font-bold">
                  {Math.floor(recordingTime / 60)}:
                  {(recordingTime % 60).toString().padStart(2, "0")}
                </span>
              </div>
              <div className="flex-1 text-slate-500 text-xs italic truncate">
                {t("chat.recording") || "Recording..."}
              </div>
              <button
                type="button"
                onClick={cancelRecording}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  delete
                </span>
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="w-6 h-6 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all hover:scale-110"
              >
                <span className="material-symbols-outlined text-base">
                  send
                </span>
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUploadMenu(!showUploadMenu)}
                  className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">
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
                      <span className="text-sm">Images</span>
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
                      <span className="text-sm">Files</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenPollModal?.();
                        setShowUploadMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors text-slate-700 dark:text-slate-300 font-bold"
                    >
                      <span className="material-symbols-outlined text-orange-500">
                        poll
                      </span>
                      <span className="text-sm">Poll</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 relative group">
                <input
                  className="w-full pl-4 pr-12 py-1.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-500 border-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 font-medium text-[11px] h-7"
                  placeholder={t("chat.input_placeholder")}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  onClick={() => setShowGiphyPicker(!showGiphyPicker)}
                  className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    gif
                  </span>
                </button>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-accent transition-colors rounded-lg hover:bg-accent/10">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      sentiment_satisfied
                    </span>
                  </button>
                </div>
                <div className="absolute right-0 bottom-full mb-4">
                  <EmojiPicker
                    isOpen={showEmojiPicker}
                    onClose={() => setShowEmojiPicker(false)}
                    onEmojiSelect={(emoji) => {
                      setInputValue((prev) => prev + emoji);
                    }}
                  />
                  {showGiphyPicker && (
                    <GiphyPicker
                      onGifSelect={(gif) => {
                        onGifSelect(gif);
                        setShowGiphyPicker(false);
                      }}
                      onClose={() => setShowGiphyPicker(false)}
                    />
                  )}
                </div>
              </div>

              {inputValue.trim() ? (
                <button
                  type="submit"
                  disabled={!inputValue.trim() || uploadingFiles}
                  className="w-7 h-7 flex items-center justify-center text-white bg-primary rounded-lg disabled:opacity-30 hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all duration-200 shrink-0 transform active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    send
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    mic
                  </span>
                </button>
              )}
            </>
          )}
        </form>
      )}
    </div>
  );
};

export default MessageInput;
