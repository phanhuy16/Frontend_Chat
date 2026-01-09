import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import { conversationApi } from "../../api/conversation.api";
import { friendApi } from "../../api/friend.api";

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
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAvailableUsers = useCallback(async () => {
    try {
      const users = await friendApi.getFriendsList();
      setAvailableUsers(users.filter((u) => u.id !== user?.id));
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("Không thể tải danh sách người dùng");
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  }, [isOpen, loadAvailableUsers]);

  const handleToggleMember = (userId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");

    if (!groupName.trim()) {
      setError("Tên nhóm không được trống");
      return;
    }

    if (selectedMembers.length < 2) {
      setError(
        "Chọn ít nhất 2 thành viên khác (tổng cộng 3 người bao gồm bạn) để tạo nhóm"
      );
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

      onClose();
      setGroupName("");
      setSelectedMembers([]);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#111418] rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-black dark:text-white">
          Tạo nhóm chat
        </h2>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Tên nhóm
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Nhập tên nhóm chat"
              className="w-full px-3 py-2 bg-input-light dark:bg-input-dark border border-gray-300 dark:border-gray-700 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">
              Chọn thành viên ({selectedMembers.length})
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-lg p-3">
              {availableUsers.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(u.id)}
                    onChange={() => handleToggleMember(u.id)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm text-black dark:text-white flex-1">
                    {u.displayName}
                  </span>
                  <span className="text-xs text-gray-500">@{u.userName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
            >
              Hủy
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
            >
              {loading ? "Đang tạo..." : "Tạo nhóm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
