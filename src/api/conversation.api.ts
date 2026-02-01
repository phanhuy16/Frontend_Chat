import { Conversation, CreateDirectConversationRequest, CreateGroupConversationRequest } from "../types/conversation.types";
import { AttachmentDto } from "../types/message.types";
import axiosInstance from "./axios";

export const conversationApi = {
  getConversation: (id: number): Promise<Conversation> =>
    axiosInstance.get(`/conversations/${id}`).then((res) => res.data),

  getUserConversations: (userId: number): Promise<Conversation[]> =>
    axiosInstance.get(`/conversations/user/${userId}`).then((res) => res.data),

  createDirectConversation: (data: CreateDirectConversationRequest): Promise<Conversation> =>
    axiosInstance.post(`/conversations/direct`, data).then((res) => res.data),

  createGroupConversation: (data: CreateGroupConversationRequest): Promise<Conversation> =>
    axiosInstance.post('/conversations/group', data).then((res) => res.data),

  addMember: (conversationId: number, userId: number): Promise<any> =>
    axiosInstance.post(`/conversations/${conversationId}/members/${userId}`).then((res) => res.data),

  transferAdminRights: (conversationId: number, fromUserId: number, toUserId: number
  ): Promise<any> =>
    axiosInstance.post(`/conversations/${conversationId}/transfer-admin`, { fromUserId, toUserId, }).then((res) => res.data),

  leaveConversation: (conversationId: number, userId: number): Promise<any> => axiosInstance.post(`/conversations/${conversationId}/leave`, { userId, }).then((res) => res.data),

  removeMember: (conversationId: number, userId: number): Promise<any> =>
    axiosInstance.delete(`/conversations/${conversationId}/members/${userId}`).then((res) => res.data),

  deleteGroupConversation: (conversationId: number, requestingUserId: number): Promise<any> =>
    axiosInstance.delete(`/conversations/${conversationId}/delete`, {
      data:
      {
        requestingUserId
      },
    }).then((res) => res.data),

  getConversationAttachments: (id: number): Promise<AttachmentDto[]> =>
    axiosInstance.get(`/conversations/${id}/attachments`).then((res) => res.data),

  togglePin: (conversationId: number, userId: number): Promise<{ isPinned: boolean }> =>
    axiosInstance.post(`/conversations/${conversationId}/pin/${userId}`).then((res) => res.data),

  getConversationLinks: (id: number): Promise<any[]> =>
    axiosInstance.get(`/conversations/${id}/links`).then((res) => res.data),

  updateMemberPermissions: (conversationId: number, targetUserId: number, permissions: any): Promise<any> =>
    axiosInstance.patch(`/conversations/${conversationId}/members/${targetUserId}/permissions`, permissions).then((res) => res.data),

  getUserArchivedConversations: (userId: number): Promise<Conversation[]> =>
    axiosInstance.get(`/conversations/user/${userId}/archived`).then((res) => res.data),

  toggleArchive: (conversationId: number, userId: number): Promise<{ isArchived: boolean }> =>
    axiosInstance.post(`/conversations/${conversationId}/archive/${userId}`).then((res) => res.data),

  updateGroupInfo: (conversationId: number, data: { groupName?: string; description?: string; slowMode?: number }): Promise<Conversation> =>
    axiosInstance.put(`/conversations/${conversationId}`, data).then((res) => res.data),
};