import axiosInstance from "./axios";

const attachmentApi = {
  uploadAttachment: async (file: File, messageId: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance
      .post(`/attachments/upload?messageId=${messageId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },
};

export default attachmentApi;