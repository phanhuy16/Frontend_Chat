// src/components/Call/CallHistory.tsx
import React, { useEffect, useState } from "react";
import { Table, Button, Space, Tag, Empty } from "antd";
import { CallHistoryDto } from "../../types/call.type";
import { CallType, CallStatus } from "../../types/enums";
import callApi from "../../api/call.api";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

const CallHistory: React.FC = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallHistoryDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCallHistory();
  }, [user?.id]);

  const loadCallHistory = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const history = await callApi.getCallHistory(user.id);
      setCalls(history);
    } catch (err) {
      console.error("Error loading call history:", err);
      toast.error("Lỗi khi tải lịch sử cuộc gọi");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Tên",
      dataIndex: "contactName",
      key: "contactName",
      render: (text: string, record: CallHistoryDto) => {
        const contact =
          record.initiator?.id === user?.id
            ? record.receiver
            : record.initiator;
        return contact?.displayName || "Unknown";
      },
    },
    {
      title: "Loại",
      dataIndex: "callType",
      key: "callType",
      render: (callType: CallType) => (
        <Tag color={callType === CallType.Video ? "blue" : "green"}>
          {callType === CallType.Video ? "📹 Video" : "☎️ Âm thanh"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: CallStatus) => {
        const statusMap: Record<CallStatus, { color: string; text: string }> = {
          [CallStatus.Completed]: { color: "green", text: "Hoàn thành" },
          [CallStatus.Missed]: { color: "red", text: "Bị bỏ lỡ" },
          [CallStatus.Rejected]: { color: "orange", text: "Đã từ chối" },
          [CallStatus.Pending]: { color: "blue", text: "Chưa trả lời" },
          [CallStatus.Answered]: { color: "green", text: "Đã trả lời" },
          [CallStatus.Ended]: { color: "gray", text: "Kết thúc" },
        };

        const { color, text } = statusMap[status] || {
          color: "gray",
          text: "Unknown",
        };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Thời lượng",
      dataIndex: "durationInSeconds",
      key: "durationInSeconds",
      render: (duration: number) => {
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;
        return `${mins}m ${secs}s`;
      },
    },
    {
      title: "Thời gian",
      dataIndex: "startedAt",
      key: "startedAt",
      render: (date: string) => new Date(date).toLocaleString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "action",
      render: (text: string, record: CallHistoryDto) => (
        <Space>
          <Button type="primary" size="small">
            Gọi lại
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Lịch sử cuộc gọi</h2>

      {calls.length === 0 ? (
        <Empty description="Không có lịch sử cuộc gọi" />
      ) : (
        <Table
          columns={columns}
          dataSource={calls}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} cuộc gọi`,
          }}
        />
      )}
    </div>
  );
};

export default CallHistory;
