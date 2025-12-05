import axiosInstance from "./axios";

const blockApi = {
  blockUser: (blockerId: number, blockedUserId: number): Promise<any> =>
    axiosInstance.post(`/blocks`, { blockerId, blockedUserId }).then((res) => res.data),

  unblockUser: (blockerId: number, blockedUserId: number): Promise<any> =>
    axiosInstance.delete(`/blocks/${blockerId}/${blockedUserId}`).then((res) => res.data),

  isUserBlocked: (blockerId: number, blockedUserId: number): Promise<boolean> =>
    axiosInstance.get(`/blocks/check/${blockerId}/${blockedUserId}`).then((res) => res.data),

  getBlockedUsers: (userId: number): Promise<any[]> =>
    axiosInstance.get(`/blocks/user/${userId}`).then((res) => res.data),
};

export default blockApi;