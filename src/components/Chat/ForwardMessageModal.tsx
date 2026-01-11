import React, { useState, useEffect } from "react";
import { Modal, Input, List, Avatar, Checkbox, Button } from "antd";
import { conversationApi } from "../../api/conversation.api";
import { Conversation, ConversationType } from "../../types";
import { getAvatarUrl } from "../../utils/helpers";

interface ForwardMessageModalProps {
  visible: boolean;
  onCancel: () => void;
  onForward: (targetConversationIds: number[]) => void;
  userId: number;
  loading?: boolean;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  visible,
  onCancel,
  onForward,
  userId,
  loading,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (visible) {
      loadConversations();
    }
  }, [visible]);

  const loadConversations = async () => {
    setFetching(true);
    try {
      const data = await conversationApi.getUserConversations(userId);
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setFetching(false);
    }
  };

  const getDisplayName = (c: Conversation) => {
    if (c.conversationType === ConversationType.Direct) {
      const otherMember = c.members.find((m) => m.id !== userId);
      return otherMember?.displayName || "Người dùng";
    }
    return c.groupName || "Nhóm không tên";
  };

  const getDisplayAvatar = (c: Conversation) => {
    if (c.conversationType === ConversationType.Direct) {
      const otherMember = c.members.find((m) => m.id !== userId);
      return otherMember?.avatar;
    }
    return ""; // Group avatar logic if needed
  };

  const filteredConversations = conversations.filter((c) => {
    const name = getDisplayName(c);
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleForward = () => {
    if (selectedIds.length > 0) {
      onForward(selectedIds);
      setSelectedIds([]);
    }
  };

  return (
    <Modal
      title="Chuyển tiếp tin nhắn"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="forward"
          type="primary"
          disabled={selectedIds.length === 0}
          loading={loading}
          onClick={handleForward}
        >
          Chuyển tiếp ({selectedIds.length})
        </Button>,
      ]}
      className="forward-modal"
    >
      <Input
        placeholder="Tìm kiếm cuộc trò chuyện..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
        prefix={
          <span className="material-symbols-outlined text-sm">search</span>
        }
      />
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {fetching ? (
          <div className="flex justify-center py-8">
            <span className="animate-spin material-symbols-outlined text-3xl text-primary">
              refresh
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredConversations.map((c) => {
              const name = getDisplayName(c);
              const avatar = getDisplayAvatar(c);
              const isSelected = selectedIds.includes(c.id);

              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent"
                  }`}
                  onClick={() => toggleSelect(c.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleSelect(c.id)}
                    className="pointer-events-none"
                  />
                  <Avatar
                    src={getAvatarUrl(avatar)}
                    size={40}
                    className="flex-shrink-0"
                  >
                    {name[0]?.toUpperCase()}
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-gray-900 truncate">
                      {name}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      {c.conversationType === ConversationType.Direct
                        ? "Cá nhân"
                        : "Nhóm"}
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredConversations.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                Không tìm thấy cuộc trò chuyện nào
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
