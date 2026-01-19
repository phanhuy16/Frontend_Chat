import axios from './axios';
import { SearchResultDto, MessageSearchResultDto, AttachmentSearchResultDto, UserSearchResultDto } from '../types/search.types';

export const searchApi = {
  // Global search across all entities
  searchAll: async (query: string, pageSize: number = 20): Promise<SearchResultDto> => {
    const response = await axios.get('/search', {
      params: { query, pageSize }
    });
    return response.data;
  },

  // Search messages only
  searchMessages: async (query: string, pageSize: number = 20): Promise<MessageSearchResultDto[]> => {
    const response = await axios.get('/search/messages', {
      params: { query, pageSize }
    });
    return response.data;
  },

  // Search files only
  searchFiles: async (query: string, pageSize: number = 20): Promise<AttachmentSearchResultDto[]> => {
    const response = await axios.get('/search/files', {
      params: { query, pageSize }
    });
    return response.data;
  },

  // Search users only
  searchUsers: async (query: string, pageSize: number = 20): Promise<UserSearchResultDto[]> => {
    const response = await axios.get('/search/users', {
      params: { query, pageSize }
    });
    return response.data;
  }
};
