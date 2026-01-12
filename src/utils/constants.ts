import { StatusUser, MessageType, ConversationType, ConversationRole, StatusContact } from '../types/enums';

// Status User Constants
export const STATUS_USER_OPTIONS = [
  { value: StatusUser.Online, label: 'Online', color: '#4CAF50' },
  { value: StatusUser.Away, label: 'Away', color: '#FFC107' },
  { value: StatusUser.Offline, label: 'Offline', color: '#9E9E9E' },
];

// Message Type Constants
export const MESSAGE_TYPE_OPTIONS = [
  { value: MessageType.Text, label: 'Text' },
  { value: MessageType.Image, label: 'Image' },
  { value: MessageType.File, label: 'File' },
];

// Conversation Type Constants
export const CONVERSATION_TYPE_OPTIONS = [
  { value: ConversationType.Direct, label: 'Direct Message' },
  { value: ConversationType.Group, label: 'Group Chat' },
];

// Conversation Role Constants
export const CONVERSATION_ROLE_OPTIONS = [
  { value: ConversationRole.Member, label: 'Member' },
  { value: ConversationRole.Admin, label: 'Admin' },
];

// Status Contact Constants
export const STATUS_CONTACT_OPTIONS = [
  { value: StatusContact.Pending, label: 'Pending' },
  { value: StatusContact.Accepted, label: 'Accepted' },
  { value: StatusContact.Rejected, label: 'Rejected' },
  { value: StatusContact.Blocked, label: 'Blocked' },
];

// API Settings
export const API_BASE_URL = process.env.REACT_APP_API_URL;
export const REACT_APP_AVATAR_URL = process.env.REACT_APP_AVATAR_URL;
export const SIGNALR_HUB_URL_CHAT = process.env.REACT_APP_SIGNALR_URL_CHAT;
export const SIGNALR_HUB_URL_CALL = process.env.REACT_APP_SIGNALR_URL_CALL;
export const GIPHY_API_KEY = 'awE3x7wRlwlXfGX1DWwfGibR3CUZCZud';

// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const DEFAULT_PAGE_NUMBER = 1;

// Message Settings
export const MESSAGE_FETCH_LIMIT = 50;
export const TYPING_TIMEOUT = 1000; // 1 second
export const RECONNECT_INTERVALS = [0, 0, 0, 1000, 3000, 5000];

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
};