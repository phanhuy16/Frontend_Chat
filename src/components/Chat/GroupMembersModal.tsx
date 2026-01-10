import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { conversationApi } from "../../api/conversation.api";
import toast from "react-hot-toast";
import { AddMembersModal } from "./AddMembersModal";
import { Modal } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons";
import { getAvatarUrl } from "../../utils/helpers";

interface GroupMembersModalProps {
  conversation: any;
  isOpen: boolean;
  onClose: () => void;
  onMemberRemoved?: () => void;
  onGroupDeleted?: () => void;
}

const { confirm } = Modal;

export const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  conversation,
  isOpen,
  onClose,
  onMemberRemoved,
  onGroupDeleted,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedUserForAdmin, setSelectedUserForAdmin] = useState<
    number | null
  >(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [updatedConversation, setUpdatedConversation] = useState(conversation);

  const isGroupAdmin = conversation?.createdBy === user?.id;
  const isMember = updatedConversation?.members?.some(
    (m: any) => m.id === user?.id
  );

  useEffect(() => {
    setUpdatedConversation(conversation);
  }, [conversation]);

  const handleRemoveMember = async (memberId: number) => {
    setLoading(true);
    try {
      await conversationApi.removeMember(conversation.id, memberId);

      // Update local state immediately
      setUpdatedConversation((prev: any) => ({
        ...prev,
        members: prev.members.filter((m: any) => m.id !== memberId),
      }));

      onMemberRemoved?.();
      toast.success("Thành viên đã được xoá");
    } catch (err: any) {
      console.error("Failed to remove member:", err);
      toast.error(err.response?.data?.message || "Lỗi xoá thành viên");
    } finally {
      setLoading(false);
    }
  };

  const handleTransferAdmin = async (newAdminId: number) => {
    const newAdminName = updatedConversation.members.find(
      (m: any) => m.id === newAdminId
    )?.displayName;

    confirm({
      title: "Xác nhận chuyển quyền admin",
      icon: <ExclamationCircleFilled style={{ color: "red" }} />,
      content: `Chuyển quyền admin cho ${newAdminName}?`,
      async onOk() {
        setLoading(true);
        try {
          await conversationApi.transferAdminRights(
            conversation.id,
            user?.id || 0,
            newAdminId
          );

          // Update local state immediately
          setUpdatedConversation((prev: any) => ({
            ...prev,
            createdBy: newAdminId, // Update createdBy to new admin
            members: prev.members.map((m: any) => ({
              ...m,
            })),
          }));

          setSelectedUserForAdmin(null);
          toast.success("Chuyển quyền admin thành công");
        } catch (err: any) {
          console.error("Failed to transfer admin:", err);
          toast.error(err.response?.data?.message || "Lỗi chuyển quyền admin");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleDeleteGroup = async () => {
    setLoading(true);
    try {
      await conversationApi.deleteGroupConversation(
        conversation.id,
        user?.id || 0
      );
      onGroupDeleted?.();
      onClose();
      toast.success("Nhóm đã được xoá");
    } catch (err: any) {
      console.error("Failed to delete group:", err);
      toast.error(err.response?.data?.message || "Lỗi xoá nhóm");
    } finally {
      setLoading(false);
    }
  };

  const handleMembersAdded = async () => {
    // Reload conversation to update members list
    onMemberRemoved?.();
    setShowAddMembers(false);
    toast.success("Thêm thành viên thành công");
  };

  if (!isOpen || !conversation) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-[#111418] rounded-xl p-5 w-[340px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
          {/* Header */}
          <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-black dark:text-white">
                👥 Thành viên nhóm
              </h2>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                {updatedConversation.members?.length || 0}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {updatedConversation.groupName || "Nhóm không có tên"}
            </p>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-2">
            {updatedConversation.members?.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full bg-center bg-cover ring-2 ring-blue-200 dark:ring-blue-900"
                    style={{
                      backgroundImage: `url("${getAvatarUrl(member.avatar)}")`,
                    }}
                  />

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black dark:text-white truncate">
                      {member.displayName || member.userName}
                    </p>
                    {updatedConversation.createdBy === member.id && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                        👑 Quản trị viên
                      </p>
                    )}
                    {member.id === user?.id && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        (Bạn)
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {isGroupAdmin && member.id !== user?.id && (
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => setSelectedUserForAdmin(member.id)}
                      disabled={loading}
                      title="Chuyển quyền admin"
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      👑
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={loading}
                      title="Xoá thành viên"
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Confirm transfer admin dialog */}
          {selectedUserForAdmin && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg mb-4 border-2 border-yellow-200 dark:border-yellow-700">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
                    Xác nhận chuyển quyền admin
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                    {
                      updatedConversation.members.find(
                        (m: any) => m.id === selectedUserForAdmin
                      )?.displayName
                    }{" "}
                    sẽ trở thành quản trị viên và bạn sẽ trở thành thành viên
                    thường.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTransferAdmin(selectedUserForAdmin)}
                      disabled={loading}
                      className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 disabled:opacity-50 font-medium transition-colors"
                    >
                      Xác nhận
                    </button>
                    <button
                      onClick={() => setSelectedUserForAdmin(null)}
                      disabled={loading}
                      className="flex-1 px-3 py-2 bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded-md text-sm hover:bg-gray-400 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {isMember && (
              <button
                onClick={() => setShowAddMembers(true)}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2 text-xs"
              >
                ➕ Thêm thành viên
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors text-xs"
              >
                Đóng
              </button>

              {isGroupAdmin && (
                <button
                  onClick={() =>
                    confirm({
                      title: "Xác nhận xoá",
                      icon: (
                        <ExclamationCircleFilled style={{ color: "red" }} />
                      ),
                      content:
                        "Xoá nhóm này sẽ xoá tất cả tin nhắn. Bạn chắc chắn?",
                      async onOk() {
                        await handleDeleteGroup();
                      },
                    })
                  }
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium transition-colors text-xs"
                >
                  🗑️ Xoá nhóm
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Members Modal */}
      <AddMembersModal
        conversation={updatedConversation}
        isOpen={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        onMembersAdded={handleMembersAdded}
      />
    </>
  );
};
