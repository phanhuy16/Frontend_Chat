// src/components/Call/IncomingCallModal.tsx
import React from "react";
import { Avatar, Button, Space, Modal } from "antd";
import {
  PhoneOutlined,
  CloseOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";

interface IncomingCallModalProps {
  caller: {
    id: number;
    name: string;
    avatar?: string;
  };
  callType: string;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  caller,
  callType,
  onAccept,
  onReject,
}) => {
  return (
    <Modal
      title={null}
      open={true}
      onCancel={onReject}
      footer={null}
      closable={false}
      centered
      width={400}
      className="incoming-call-modal"
    >
      <div className="flex flex-col items-center gap-6 py-8">
        {/* Avatar with animation */}
        <div className="animate-pulse">
          <Avatar
            size={120}
            src={caller.avatar || undefined}
            icon={<PhoneOutlined />}
            className="bg-blue-500"
          />
        </div>

        {/* Caller Name */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black dark:text-white">
            {caller.name}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 animate-pulse">
            {callType === "Video" ? "📹 Cuộc gọi video" : "☎️ Cuộc gọi thoại"}
          </p>
        </div>

        {/* Call Type Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          {callType === "Video" ? (
            <VideoCameraOutlined className="text-blue-600 dark:text-blue-400" />
          ) : (
            <PhoneOutlined className="text-blue-600 dark:text-blue-400" />
          )}
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {callType === "Video" ? "Gọi video" : "Gọi thoại"}
          </span>
        </div>

        {/* Action Buttons */}
        <Space size="large" className="mt-8">
          {/* Reject Button - Red */}
          <Button
            type="primary"
            danger
            shape="circle"
            size="large"
            icon={<CloseOutlined />}
            onClick={onReject}
            title="Từ chối cuộc gọi"
            className="h-16 w-16"
          />

          {/* Accept Button - Green */}
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<PhoneOutlined />}
            onClick={onAccept}
            title="Chấp nhận cuộc gọi"
            className="h-16 w-16 bg-green-500 hover:bg-green-600"
          />
        </Space>
      </div>
    </Modal>
  );
};

export default IncomingCallModal;
