import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import { conversationApi } from "../../api/conversation.api";
import { friendApi } from "../../api/friend.api";
import { FriendDto, StatusUser, User } from "../../types";
import { getAvatarUrl } from "../../utils/helpers";
import {
  getStatusUserColor,
  getStatusUserLabel,
} from "../../utils/enum-helpers";
import toast from "react-hot-toast";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
}) => {
  const { user } = useAuth();
  const { setConversations, conversations } = useChat();

  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadFriends = useCallback(async () => {
    try {
      const users = await friendApi.getFriendsList();
      // friendApi.getFriendsList() might return FriendDto which has similar fields or User
      setFriends(users.filter((u) => u.id !== user?.id));
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("Không thể tải danh sách bạn bè");
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOpen) {
      loadFriends();
      setGroupName("");
      setSearchTerm("");
      setSelectedMembers([]);
      setError("");
    }
  }, [isOpen, loadFriends]);

  const filteredFriends = useMemo(() => {
    return friends.filter(
      (f) =>
        f.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.userName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [friends, searchTerm]);

  const handleToggleMember = (userId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    setError("");

    if (!groupName.trim()) {
      setError("Tên nhóm không được trống");
      toast.error("Vui lòng nhập tên nhóm");
      return;
    }

    if (selectedMembers.length < 2) {
      setError("Chọn ít nhất 2 thành viên khác");
      toast.error("Chọn ít nhất 2 thành viên khác để tạo nhóm");
      return;
    }

    setLoading(true);

    try {
      const groupData = {
        groupName: groupName.trim(),
        createdBy: user?.id || 0,
        memberIds: [user?.id || 0, ...selectedMembers],
      };

      const newConversation = await conversationApi.createGroupConversation(
        groupData
      );

      setConversations([newConversation, ...conversations]);

      toast.success(`Nhóm "${groupName}" đã được tạo!`);
      onClose();
      onGroupCreated?.();
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi tạo nhóm chat");
      console.error("Failed to create group:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 lg:p-8 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh] animate-slide-up text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 shrink-0">
          <h2 className="text-xl font-black tracking-tight">Tạo nhóm chat</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
          >
            <span className="material-symbols-outlined !text-[20px]">
              close
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          {/* Group Info Section */}
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <div className="size-16 lg:size-20 rounded-[2rem] bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border-4 border-white dark:border-slate-800 shadow-premium flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-3xl">
                  groups
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 size-9 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center text-white border-2 border-white dark:border-slate-800 shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all duration-300 group-hover:shadow-primary/30">
                <span className="material-symbols-outlined text-[18px]">
                  add_a_photo
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                Tên nhóm
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nhập tên nhóm..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border-none text-sm font-bold placeholder:text-slate-500 focus:ring-2 focus:ring-primary/50 transition-all shadow-sm h-9"
              />
            </div>
          </div>

          {/* Member Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                Thêm thành viên
              </label>
              <span className="text-[10px] font-black px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-tighter">
                Đã chọn {selectedMembers.length}
              </span>
            </div>

            <div className="relative group">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm bạn bè..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border-none text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary/50 transition-all font-medium text-xs shadow-sm h-9"
              />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                search
              </span>
            </div>

            <div className="space-y-2 mt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2">
                Gợi ý
              </p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredFriends.length > 0 ? (
                  filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      onClick={() => handleToggleMember(friend.id)}
                      className={`group flex items-center justify-between gap-3 p-2 rounded-2xl border transition-all duration-300 cursor-pointer ${
                        selectedMembers.includes(friend.id)
                          ? "bg-primary/10 border-primary/20"
                          : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div
                            className="size-8 rounded-xl bg-center bg-no-repeat bg-cover border border-white dark:border-slate-800 shadow-sm"
                            style={{
                              backgroundImage: `url("${getAvatarUrl(
                                friend.avatar,
                              )}")`,
                            }}
                          />
                          <div
                            className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"
                            style={{
                              backgroundColor: getStatusUserColor(
                                friend.status as StatusUser,
                              ),
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs truncate">
                            {friend.displayName}
                          </p>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                            {getStatusUserLabel(friend.status as StatusUser)}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`size-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          selectedMembers.includes(friend.id)
                            ? "bg-emerald-500 border-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/20"
                            : "border-slate-200 dark:border-slate-700 bg-transparent group-hover:border-emerald-400/50"
                        }`}
                      >
                        {selectedMembers.includes(friend.id) && (
                          <span className="material-symbols-outlined text-[16px] font-black animate-scale-in">
                            done
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center opacity-40">
                    <span className="material-symbols-outlined text-4xl mb-2">
                      person_search
                    </span>
                    <p className="text-xs font-bold">
                      Không tìm thấy bạn bè nào
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-200/50 dark:border-slate-800/50 flex gap-4 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-[9px] hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={
              loading || selectedMembers.length < 2 || !groupName.trim()
            }
            className="flex-[1.5] h-9 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/25 hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 transition-all"
          >
            {loading ? "Đang tạo..." : "Tạo nhóm"}
          </button>
        </div>
      </div>
    </div>
  );
};
