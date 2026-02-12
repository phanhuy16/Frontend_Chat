import axiosInstance from './axios';

export interface ConversationBackgroundDto {
  backgroundUrl?: string;
  backgroundType: string;
}

export interface UpdateBackgroundRequest {
  backgroundUrl?: string;
  backgroundType: string;
}

// Get conversation background for current user
export const getConversationBackground = async (
  conversationId: number,
  userId: number
): Promise<ConversationBackgroundDto> => {
  const response = await axiosInstance.get<ConversationBackgroundDto>(
    `/conversations/${conversationId}/background/${userId}`
  );
  return response.data;
};

// Update conversation background for current user
export const updateConversationBackground = async (
  conversationId: number,
  userId: number,
  request: UpdateBackgroundRequest
): Promise<void> => {
  await axiosInstance.put(
    `/conversations/${conversationId}/background/${userId}`,
    request
  );
};

// Upload background image
export const uploadBackgroundImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosInstance.post<{ url: string }>(
    '/attachments/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.url;
};
