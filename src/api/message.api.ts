import { AddReactionRequest, EditMessageRequest, Message, SendMessageRequest } from "../types/message.types";
import axiosInstance from "./axios";

export const messageApi = {
  sendMessage: (data: SendMessageRequest): Promise<Message> =>
    axiosInstance.post('/messages', data).then((res) => res.data),

  getConversationMessages: (conversationId: number,
    pageNumber: number = 1,
    pageSize: number = 50): Promise<Message[]> =>
    axiosInstance.get(`/messages/conversation/${conversationId}`, {
      params: { pageNumber, pageSize },
    }).then((res) => res.data),

  editMessage: (messageId: number, data: EditMessageRequest): Promise<Message> =>
    axiosInstance.put(`/messages/${messageId}`, data).then((res) => res.data),

  deleteMessage: (messageId: number): Promise<any> =>
    axiosInstance.delete(`/messages/${messageId}`).then((res) => res.data),

  addReaction: (messageId: number, data: AddReactionRequest): Promise<any> =>
    axiosInstance.post(`/messages/${messageId}/reactions`, data).then((res) => res.data),

  removeReaction: (reactionId: number): Promise<any> =>
    axiosInstance.delete(`/messages/reactions/${reactionId}`).then((res) => res.data),
}