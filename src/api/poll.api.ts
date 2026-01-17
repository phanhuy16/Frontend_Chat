import axiosInstance from "./axios";
import { Poll, CreatePollRequest } from "../types";

export const pollApi = {
  createPoll: async (data: CreatePollRequest): Promise<Poll> => {
    const response = await axiosInstance.post("/polls", data);
    return response.data;
  },

  vote: async (pollId: number, optionId: number): Promise<Poll> => {
    const response = await axiosInstance.post(`/polls/${pollId}/vote`, optionId, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  },

  removeVote: async (pollId: number, optionId: number): Promise<Poll> => {
    const response = await axiosInstance.post(`/polls/${pollId}/vote/remove`, optionId, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  },

  getPoll: async (pollId: number): Promise<Poll> => {
    const response = await axiosInstance.get(`/polls/${pollId}`);
    return response.data;
  }
};
