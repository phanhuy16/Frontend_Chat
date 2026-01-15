import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import blockApi from "../../api/block.api";
import { getAvatarUrl } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";

interface BlockedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnblocked?: () => void;
}

const BlockedUsersModal: React.FC<BlockedUsersModalProps> = ({
  isOpen,
  onClose,
  onUnblocked,
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBlockedUsers = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await blockApi.getBlockedUsers(user.id);
      setBlockedUsers(data);
    } catch (err) {
      console.error("Failed to fetch blocked users:", err);
      toast.error("Không thể tải danh sách chặn");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchBlockedUsers();
    }
  }, [isOpen, fetchBlockedUsers]);

  const handleUnblock = async (blockedUserId: number) => {
    if (!user) return;
    try {
      await blockApi.unblockUser(user.id, blockedUserId);
      toast.success("Đã bỏ chặn người dùng");
      fetchBlockedUsers();
      onUnblocked?.();
    } catch (err) {
      console.error("Failed to unblock user:", err);
      toast.error("Không thể bỏ chặn người dùng");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
      <div 
        className="bg-white dark:bg-[#0f1115] rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-white/5 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t("settings.privacy.blocked_users")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {t("settings.privacy.blocked_count", { count: blockedUsers.length })}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined italic">close</span>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-slate-500 font-medium italic">Đang tải...</p>
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 text-slate-400">
                <span className="material-symbols-outlined text-4xl italic">block</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">
                Danh sách chặn trống
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
                Bạn chưa chặn người dùng nào trong cộng đồng.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-slate-800 bg-cover bg-center border-2 border-white dark:border-slate-800 shadow-sm"
                      style={{ backgroundImage: `url(${getAvatarUrl(item.blockedUserProfile?.avatar)})` }}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.blockedUserProfile?.displayName}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        @{item.blockedUserProfile?.userName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(item.blockedUserId)}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-xl transition-all"
                  >
                    Bỏ chặn
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockedUsersModal;
