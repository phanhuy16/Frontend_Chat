import {
  PhoneOutlined,
  CloseOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Modal, Space } from "antd";
import React from "react";
import { getAvatarUrl } from "../../utils/helpers";

import { CallType } from "../../types";
import { CallState } from "../../types/call.type";

interface CallModalProps {
  callState: CallState;
  isIncoming: boolean;
  onAnswer: (callType: CallType) => void;
  onReject: () => void;
  onEnd: () => void;
  callerAvatar?: string;
}

const CallModal: React.FC<CallModalProps> = ({
  callState,
  isIncoming,
  onAnswer,
  onReject,
  onEnd,
  callerAvatar,
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <Modal
      title={null}
      open={
        callState.callStatus !== "idle" && callState.callStatus !== "connected"
      }
      onCancel={onReject}
      footer={null}
      closable={false}
      centered
      width={400}
      className="call-modal"
    >
      <div className="flex flex-col items-center gap-6 py-8">
        {/* Avatar */}
        <Avatar
          size={120}
          src={getAvatarUrl(callerAvatar) || undefined}
          icon={<PhoneOutlined />}
          className="bg-primary"
        />

        {/* Name */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black dark:text-white">
            {callState.remoteUserName}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {callState.callStatus === "ringing" && !isIncoming && "Đang gọi..."}
            {callState.callStatus === "ringing" && isIncoming && "Gọi tới"}
            {callState.callStatus === "connecting" && "Đang kết nối..."}
            {callState.callStatus === "connected" &&
              formatDuration(callState.duration)}
            {callState.callStatus === "rejected" && "Đã từ chối"}
            {callState.callStatus === "ended" && "Đã kết thúc"}
            {callState.callStatus === "missed" && "Cuộc gọi nhỡ"}
          </p>
        </div>

        {/* Call Type Badge */}
        {callState.callType !== null && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            {callState.callType === CallType.Video ? (
              <VideoCameraOutlined className="text-blue-600 dark:text-blue-400" />
            ) : (
              <PhoneOutlined className="text-blue-600 dark:text-blue-400" />
            )}
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {callState.callType === CallType.Video
                ? "Gọi video"
                : "Gọi thoại"}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <Space size="large" className="mt-4">
          {isIncoming && callState.callStatus === "ringing" ? (
            <>
              {/* Reject Button */}
              <Button
                type="primary"
                danger
                shape="circle"
                size="large"
                icon={<CloseOutlined />}
                onClick={onReject}
                title="Từ chối cuộc gọi"
              />
              {/* Answer Button */}
              {callState.callType !== null && (
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  icon={<PhoneOutlined />}
                  onClick={() => onAnswer(callState.callType as CallType)}
                  title="Chấp nhận cuộc gọi"
                />
              )}
            </>
          ) : callState.callStatus !== "idle" ? (
            <>
              {/* End Call Button */}
              <Button
                type="primary"
                danger
                shape="circle"
                size="large"
                icon={<CloseOutlined />}
                onClick={onEnd}
                title="Kết thúc cuộc gọi"
              />
            </>
          ) : null}
        </Space>
      </div>
    </Modal>
  );
};

export default CallModal;
