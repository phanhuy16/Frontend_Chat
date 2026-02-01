import { MemberPermissionsModal } from "./MemberPermissionsModal";
import { MemberPermissions } from "../../types/conversation.types";
import { useTranslation } from "react-i18next";
import {
  ExclamationCircleFilled,
  GlobalOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Modal } from "antd";
import { useAuth } from "../../hooks/useAuth";
import { useEffect, useState } from "react";
import { conversationApi } from "../../api/conversation.api";
import toast from "react-hot-toast";
import { getAvatarUrl } from "../../utils/helpers";
import { AddMembersModal } from "./AddMembersModal";

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
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedUserForAdmin, setSelectedUserForAdmin] = useState<
    number | null
  >(null);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<
    any | null
  >(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatedConversation, setUpdatedConversation] = useState(conversation);

  const currentUserMember = updatedConversation?.members?.find(
    (m: any) => m.id === user?.id,
  );
  const isGroupAdmin = conversation?.createdBy === user?.id;
  const canAddMembers = isGroupAdmin || currentUserMember?.canAddMembers;
  const canRemoveMembers = isGroupAdmin || currentUserMember?.canRemoveMembers;
  const canManagePermissions =
    isGroupAdmin || currentUserMember?.canChangePermissions;

  const filteredMembers = updatedConversation?.members?.filter(
    (member: any) => {
      const searchLow = searchTerm.toLowerCase();
      return (
        member.displayName?.toLowerCase().includes(searchLow) ||
        member.userName?.toLowerCase().includes(searchLow)
      );
    },
  );

  const isMember = updatedConversation?.members?.some(
    (m: any) => m.id === user?.id,
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
      toast.success(t("group_members.remove_success"));
    } catch (err: any) {
      console.error("Failed to remove member:", err);
      toast.error(
        err.response?.data?.message || t("group_members.remove_error"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTransferAdmin = async (newAdminId: number) => {
    const newAdminName = updatedConversation.members.find(
      (m: any) => m.id === newAdminId,
    )?.displayName;

    confirm({
      title: t("group_members.confirm_transfer_title"),
      icon: <ExclamationCircleFilled style={{ color: "red" }} />,
      content: t("group_members.confirm_transfer_content", {
        name: newAdminName,
      }),
      async onOk() {
        setLoading(true);
        try {
          await conversationApi.transferAdminRights(
            conversation.id,
            user?.id || 0,
            newAdminId,
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
          toast.success(t("group_members.transfer_success"));
        } catch (err: any) {
          console.error("Failed to transfer admin:", err);
          toast.error(
            err.response?.data?.message || t("group_members.transfer_error"),
          );
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
        user?.id || 0,
      );
      onGroupDeleted?.();
      onClose();
      toast.success(t("group_members.delete_success"));
    } catch (err: any) {
      console.error("Failed to delete group:", err);
      toast.error(
        err.response?.data?.message || t("group_members.delete_error"),
      );
    } finally {
      setLoading(false);
    }
  };
  const handleMembersAdded = async () => {
    setShowAddMembers(false);
    toast.success(t("group_members.add_success") || "Success");
  };

  const handleUpdatePermissions = async (permissions: MemberPermissions) => {
    if (!selectedUserForPermissions) return;
    setLoading(true);
    try {
      await conversationApi.updateMemberPermissions(
        conversation.id,
        selectedUserForPermissions.id,
        permissions,
      );

      // Update local state
      setUpdatedConversation((prev: any) => ({
        ...prev,
        members: prev.members.map((m: any) =>
          m.id === selectedUserForPermissions.id ? { ...m, ...permissions } : m,
        ),
      }));

      setSelectedUserForPermissions(null);
      toast.success(t("group_members.permissions_success"));
    } catch (err: any) {
      console.error("Failed to update permissions:", err);
      toast.error(
        err.response?.data?.message || t("group_members.permissions_error"),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !conversation) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
        <div className="bg-white/90 dark:bg-[#111418]/90 backdrop-blur-xl rounded-2xl p-6 w-[380px] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-white/20 dark:border-gray-800">
          {/* Header */}
          <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                <GlobalOutlined className="text-blue-500" />
                {t("group_members.title")}
              </h2>
              <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-800/50">
                {updatedConversation.members?.length || 0}
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1 mb-4">
              {updatedConversation.groupName || t("group_members.no_name")}
            </p>

            {/* Search Bar */}
            <div className="relative group px-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <span className="material-symbols-outlined text-[18px]">
                  search
                </span>
              </div>
              <input
                type="text"
                placeholder={t("Tìm kiếm thành viên...") || "Search members..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800/80 border border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-gray-800 rounded-xl py-2 pl-10 pr-4 text-xs font-medium transition-all outline-none"
              />
            </div>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-2">
            {filteredMembers?.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full bg-center bg-cover ring-2 ring-white dark:ring-gray-800 shadow-sm"
                      style={{
                        backgroundImage: `url("${getAvatarUrl(member.avatar)}")`,
                      }}
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${member.isOnline ? "bg-green-500" : "bg-gray-400"}`}
                    />
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                      {member.displayName || member.userName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {updatedConversation.createdBy === member.id && (
                        <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 text-[10px] font-bold rounded flex items-center gap-1 border border-amber-100 dark:border-amber-900/40">
                          👑 {t("group_members.admin")}
                        </span>
                      )}
                      {member.id === user?.id && (
                        <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400">
                          {t("group_members.you")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {(isGroupAdmin || canRemoveMembers || canManagePermissions) &&
                  member.id !== user?.id && (
                    <div className="flex gap-1.5 ml-2">
                      {canManagePermissions && (
                        <button
                          onClick={() => setSelectedUserForPermissions(member)}
                          disabled={loading}
                          title={t("group_members.manage_permissions")}
                          className="w-8 h-8 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all border border-indigo-100 dark:border-indigo-800/50"
                        >
                          <SafetyCertificateOutlined className="text-base" />
                        </button>
                      )}
                      {isGroupAdmin && (
                        <>
                          <button
                            onClick={() => setSelectedUserForAdmin(member.id)}
                            disabled={loading}
                            title={t("group_members.transfer_admin")}
                            className="w-8 h-8 flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all border border-blue-100 dark:border-blue-800/50"
                          >
                            <span className="text-sm">👑</span>
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={loading}
                            title={t("group_members.remove_member")}
                            className="w-8 h-8 flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-all border border-red-100 dark:border-red-800/50"
                          >
                            <span className="text-sm leading-none">✕</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
              </div>
            ))}
          </div>

          {/* Confirm transfer admin dialog */}
          {selectedUserForAdmin && (
            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl mb-4 border border-blue-100 dark:border-blue-900/30 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-start gap-3">
                <span className="text-xl">ℹ️</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">
                    {t("group_members.confirm_transfer_title")}
                  </p>
                  <p className="text-[11px] leading-relaxed text-blue-800/80 dark:text-blue-300/80 mb-3">
                    {t("group_members.confirm_transfer_content", {
                      name: updatedConversation.members.find(
                        (m: any) => m.id === selectedUserForAdmin,
                      )?.displayName,
                    })}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTransferAdmin(selectedUserForAdmin)}
                      disabled={loading}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all border border-blue-500"
                    >
                      {t("group_members.confirm_btn")}
                    </button>
                    <button
                      onClick={() => setSelectedUserForAdmin(null)}
                      disabled={loading}
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                    >
                      {t("group_members.cancel_btn")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
            {canAddMembers && (
              <button
                onClick={() => setShowAddMembers(true)}
                disabled={loading}
                className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 font-bold transition-all flex items-center justify-center gap-2 text-xs shadow-lg shadow-green-500/20 active:scale-[0.98]"
              >
                <span className="text-base leading-none">+</span>{" "}
                {t("group_members.add_member")}
              </button>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 font-bold transition-all text-xs border border-gray-200 dark:border-gray-700 active:scale-[0.98]"
              >
                {t("group_members.close")}
              </button>

              {isGroupAdmin && (
                <button
                  onClick={() =>
                    confirm({
                      title: t("group_members.confirm_delete_title"),
                      icon: (
                        <ExclamationCircleFilled style={{ color: "red" }} />
                      ),
                      content: t("group_members.confirm_delete_content"),
                      okText: t("group_members.confirm_btn"),
                      cancelText: t("group_members.cancel_btn"),
                      async onOk() {
                        await handleDeleteGroup();
                      },
                    })
                  }
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 font-bold transition-all text-xs border border-red-100 dark:border-red-900/30 active:scale-[0.98]"
                >
                  <span className="mr-1">🗑️</span>{" "}
                  {t("group_members.delete_group")}
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

      {/* Permissions Modal */}
      {selectedUserForPermissions && (
        <MemberPermissionsModal
          member={selectedUserForPermissions}
          isOpen={!!selectedUserForPermissions}
          onClose={() => setSelectedUserForPermissions(null)}
          onSave={handleUpdatePermissions}
          loading={loading}
        />
      )}
    </>
  );
};
