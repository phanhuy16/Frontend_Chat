import React, { useState } from "react";
import { Modal, Switch, ConfigProvider, theme } from "antd";
import {
  ConversationMember,
  MemberPermissions,
} from "../../types/conversation.types";
import {
  SafetyCertificateOutlined,
  UserOutlined,
  DeleteOutlined,
  UserAddOutlined,
  InfoCircleOutlined,
  PushpinOutlined,
} from "@ant-design/icons";

interface MemberPermissionsModalProps {
  member: ConversationMember;
  isOpen: boolean;
  onClose: () => void;
  onSave: (permissions: MemberPermissions) => Promise<void>;
  loading: boolean;
}

export const MemberPermissionsModal: React.FC<MemberPermissionsModalProps> = ({
  member,
  isOpen,
  onClose,
  onSave,
  loading,
}) => {
  const [permissions, setPermissions] = useState<MemberPermissions>({
    canChangeGroupInfo: member.canChangeGroupInfo,
    canAddMembers: member.canAddMembers,
    canRemoveMembers: member.canRemoveMembers,
    canDeleteMessages: member.canDeleteMessages,
    canPinMessages: member.canPinMessages,
    canChangePermissions: member.canChangePermissions,
  });

  const handleToggle = (key: keyof MemberPermissions) => {
    setPermissions((prev: MemberPermissions) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const permissionItems = [
    {
      key: "canChangeGroupInfo" as keyof MemberPermissions,
      label: "Thay đổi thông tin nhóm",
      icon: <InfoCircleOutlined className="text-xl text-blue-500" />,
      description: "Cho phép thay đổi tên nhóm và ảnh đại diện",
    },
    {
      key: "canAddMembers" as keyof MemberPermissions,
      label: "Thêm thành viên",
      icon: <UserAddOutlined className="text-xl text-green-500" />,
      description: "Cho phép mời người khác vào nhóm",
    },
    {
      key: "canRemoveMembers" as keyof MemberPermissions,
      label: "Xoá thành viên",
      icon: <UserOutlined className="text-xl text-orange-500" />,
      description: "Cho phép xoá các thành viên khác khỏi nhóm",
    },
    {
      key: "canDeleteMessages" as keyof MemberPermissions,
      label: "Xoá tin nhắn của người khác",
      icon: <DeleteOutlined className="text-xl text-red-500" />,
      description: "Cho phép gỡ tin nhắn của bất kỳ ai trong nhóm",
    },
    {
      key: "canPinMessages" as keyof MemberPermissions,
      label: "Ghim tin nhắn",
      icon: <PushpinOutlined className="text-xl text-purple-500" />,
      description: "Cho phép ghim các tin nhắn quan trọng",
    },
    {
      key: "canChangePermissions" as keyof MemberPermissions,
      label: "Quản lý quyền của thành viên khác",
      icon: <SafetyCertificateOutlined className="text-xl text-indigo-500" />,
      description: "Cho phép chỉnh sửa các quyền này cho người khác",
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgElevated: "#1e1e1e",
        },
      }}
    >
      <Modal
        title={
          <div className="flex items-center gap-3 py-0.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <SafetyCertificateOutlined className="text-lg" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white leading-tight">
                Quản lý quyền
              </h3>
              <p className="text-[11px] font-medium text-slate-400">
                {member.displayName || member.userName}
              </p>
            </div>
          </div>
        }
        open={isOpen}
        onCancel={onClose}
        footer={
          <div className="flex items-center justify-end gap-2.5 mt-3 pt-3 border-t border-white/10">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/10 hover:text-white transition-all"
            >
              Hủy
            </button>
            <button
              onClick={() => onSave(permissions)}
              disabled={loading}
              className={`px-4 py-2 rounded-lg bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading && <span className="animate-spin text-xs">↻</span>}
              Lưu thay đổi
            </button>
          </div>
        }
        width={420}
        centered
        className="premium-modal dark-modal transition-all"
        styles={{
          mask: { backdropFilter: "blur(4px)" },
          content: { borderRadius: "20px", padding: "20px" },
        }}
        closeIcon={
          <span className="text-slate-400 hover:text-white transition-colors text-sm">
            ✕
          </span>
        }
      >
        <div className="space-y-2.5 py-2">
          {permissionItems.map((item) => (
            <div
              key={item.key}
              className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-white/10 transition-all duration-300 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-white leading-snug">
                    {item.label}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 max-w-[220px]">
                    {item.description}
                  </span>
                </div>
              </div>
              <Switch
                checked={permissions[item.key]}
                onChange={() => handleToggle(item.key)}
                size="small"
                className={
                  permissions[item.key] ? "bg-emerald-500" : "bg-slate-600"
                }
              />
            </div>
          ))}
        </div>
      </Modal>
    </ConfigProvider>
  );
};
