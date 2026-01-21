import React, { useState } from "react";
import { Modal, Switch, Button } from "antd";
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
    <Modal
      title={
        <div className="flex items-center gap-2">
          <SafetyCertificateOutlined className="text-xl text-blue-600" />
          <span>Quản lý quyền: {member.displayName || member.userName}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          Hủy
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={() => onSave(permissions)}
          loading={loading}
          className="bg-primary hover:bg-primary-hover"
        >
          Lưu thay đổi
        </Button>,
      ]}
      width={450}
      className="dark:bg-[#1e2329]"
    >
      <div className="space-y-4 py-2">
        {permissionItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">{item.icon}</div>
              <div>
                <p className="text-sm font-semibold text-black dark:text-white">
                  {item.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            </div>
            <Switch
              checked={permissions[item.key]}
              onChange={() => handleToggle(item.key)}
              size="small"
            />
          </div>
        ))}
      </div>
    </Modal>
  );
};
