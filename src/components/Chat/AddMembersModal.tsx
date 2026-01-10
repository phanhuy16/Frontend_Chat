import { useCallback, useEffect, useState } from "react";
import { conversationApi } from "../../api/conversation.api";
import { friendApi } from "../../api/friend.api";
import toast from "react-hot-toast";
import { getAvatarUrl } from "../../utils/helpers";

interface AddMembersModalProps {
  conversation: any;
  isOpen: boolean;
  onClose: () => void;
  onMembersAdded?: () => void;
}

export const AddMembersModal: React.FC<AddMembersModalProps> = ({
  conversation,
  isOpen,
  onClose,
  onMembersAdded,
}) => {
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState("");

  const loadAvailableUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      setError("");
      const users = await friendApi.getFriendsList();

      const currentMemberIds =
        conversation?.members?.map((m: any) => m.id) || [];
      const filtered = users.filter((u) => !currentMemberIds.includes(u.id));
      setAvailableUsers(filtered);
    } catch (err: any) {
      console.error("Failed to load users:", err);
      setError("Không thể tải danh sách bạn bè");
      toast.error("Không thể tải danh sách bạn bè");
    } finally {
      setLoadingUsers(false);
    }
  }, [conversation?.members]);

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
      setSelectedMembers([]);
    }
  }, [isOpen, loadAvailableUsers]);

  const handleAddMembers = async () => {
    setError("");

    if (selectedMembers.length === 0) {
      setError("Chọn ít nhất 1 thành viên");
      toast.error("Chọn ít nhất 1 thành viên");
      return;
    }

    setLoading(true);

    try {
      const addPromises = selectedMembers.map((memberId) =>
        conversationApi.addMember(conversation.id, memberId)
      );

      await Promise.all(addPromises);

      toast.success(`Thêm ${selectedMembers.length} thành viên thành công`);
      onMembersAdded?.();
      onClose();
      setSelectedMembers([]);
    } catch (err: any) {
      console.error("Failed to add members:", err);
      const errorMsg = err.response?.data?.message || "Lỗi thêm thành viên";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#111418] rounded-xl p-5 w-[340px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-black dark:text-white">
            ➕ Thêm thành viên vào nhóm
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Chọn bạn bè từ danh sách để thêm vào nhóm
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col py-4">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm mb-3 flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Loading */}
          {loadingUsers ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin mb-3">
                <span className="material-symbols-outlined text-3xl text-blue-500">
                  sync
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Đang tải danh sách...
              </p>
            </div>
          ) : availableUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <span className="text-4xl mb-2">🎉</span>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                Tất cả bạn bè đã trong nhóm
              </p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto pr-2">
              {availableUsers.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(u.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers([...selectedMembers, u.id]);
                      } else {
                        setSelectedMembers(
                          selectedMembers.filter((id) => id !== u.id)
                        );
                      }
                    }}
                    className="w-4 h-4 cursor-pointer accent-blue-500"
                  />

                  {/* Avatar */}
                  <div
                    className="w-7 h-7 rounded-full bg-center bg-cover shrink-0"
                    style={{
                      backgroundImage: `url("${getAvatarUrl(u.avatar)}")`,
                    }}
                  />

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black dark:text-white truncate">
                      {u.displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      @{u.userName}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Selected count */}
        {availableUsers.length > 0 && selectedMembers.length > 0 && (
          <div className="py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4 text-center">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              ✓ Đã chọn {selectedMembers.length}{" "}
              {selectedMembers.length === 1 ? "người" : "người"}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors disabled:opacity-50 text-xs"
          >
            Hủy
          </button>
          <button
            onClick={handleAddMembers}
            disabled={loading || selectedMembers.length === 0}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2 text-xs"
          >
            {loading ? (
              <>
                <span className="animate-spin material-symbols-outlined text-lg">
                  sync
                </span>
                Đang thêm...
              </>
            ) : (
              <>➕ Thêm ({selectedMembers.length})</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
