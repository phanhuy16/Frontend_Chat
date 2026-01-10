import { FriendDto, FriendRequestDto } from "../types";
import axiosInstance from "./axios";

export const friendApi = {
  // Send friend request
  sendFriendRequest: (targetUserId: number): Promise<{ message: string }> =>
    axiosInstance
      .post(`/friends/request/${targetUserId}`)
      .then((res) => res.data),

  // Accept friend request
  acceptFriendRequest: (
    requestId: number
  ): Promise<{ message: string }> =>
    axiosInstance
      .post(`/friends/accept/${requestId}`)
      .then((res) => res.data),

  // Reject friend request
  rejectFriendRequest: (requestId: number): Promise<{ message: string }> =>
    axiosInstance
      .post(`/friends/reject/${requestId}`)
      .then((res) => res.data),

  // Get pending friend requests
  getPendingRequests: (): Promise<FriendRequestDto[]> =>
    axiosInstance
      .get("/friends/requests/pending")
      .then((res) => res.data),

  // Get sent friend requests
  getSentRequests: (): Promise<FriendRequestDto[]> =>
    axiosInstance
      .get("/friends/requests/sent")
      .then((res) => res.data),

  // Get friends list
  getFriendsList: (): Promise<FriendDto[]> =>
    axiosInstance.get("/friends/list").then((res) => res.data),

  // Remove friend
  removeFriend: (friendId: number): Promise<{ message: string }> =>
    axiosInstance
      .delete(`/friends/remove/${friendId}`)
      .then((res) => res.data),

  // Check if users are friends
  checkFriendship: (friendId: number): Promise<{ isFriend: boolean }> =>
    axiosInstance
      .get(`/friends/check/${friendId}`)
      .then((res) => res.data),
};