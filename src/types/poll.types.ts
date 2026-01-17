import { User } from "./user.types";

export interface PollOption {
  id: number;
  text: string;
  voteCount: number;
  isVotedByCurrentUser: boolean;
  votes: PollVote[];
}

export interface PollVote {
  userId: number;
  username: string;
  avatarUrl?: string;
}

export interface Poll {
  id: number;
  question: string;
  allowMultipleVotes: boolean;
  createdAt: string;
  endsAt?: string;
  creatorId: number;
  creatorName: string;
  conversationId: number;
  options: PollOption[];
  hasVoted: boolean;
  totalVotes: number;
}

export interface CreatePollRequest {
  question: string;
  options: string[];
  allowMultipleVotes: boolean;
  endsAt?: string;
  conversationId: number;
}
