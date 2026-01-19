import { ConversationRole, ConversationType, MessageType, StatusContact, StatusUser } from "../types/enums";

export const getStatusUserLabel = (status: StatusUser): string => {
  const labels: Record<StatusUser, string> = {
    [StatusUser.Online]: 'Online',
    [StatusUser.Offline]: 'Offline',
    [StatusUser.Away]: 'Away',
  };
  return labels[status] || 'Unknown';
};

export const getStatusUserColor = (status: StatusUser): string => {
  const colors: Record<StatusUser, string> = {
    [StatusUser.Online]: '#4CAF50',
    [StatusUser.Offline]: '#9E9E9E',
    [StatusUser.Away]: '#FFC107',
  };
  return colors[status] || '#000000';
};

export const getMessageTypeLabel = (type: MessageType): string => {
  const labels: Record<string, string> = {
    [MessageType.Text]: 'Text',
    [MessageType.Image]: 'Image',
    [MessageType.File]: 'File',
    [MessageType.Poll]: 'Poll',
  };
  return labels[type] || 'Unknown';
};

export const getConversationTypeLabel = (type: ConversationType): string => {
  const labels: Record<ConversationType, string> = {
    [ConversationType.Direct]: 'Direct Message',
    [ConversationType.Group]: 'Group Chat',
  };
  return labels[type] || 'Unknown';
};

export const getConversationRoleLabel = (role: ConversationRole): string => {
  const labels: Record<ConversationRole, string> = {
    [ConversationRole.Member]: 'Member',
    [ConversationRole.Admin]: 'Admin',
  };
  return labels[role] || 'Unknown';
};

export const getStatusContactLabel = (status: StatusContact): string => {
  const labels: Record<StatusContact, string> = {
    [StatusContact.Pending]: 'Pending',
    [StatusContact.Accepted]: 'Accepted',
    [StatusContact.Rejected]: 'Rejected',
    [StatusContact.Blocked]: 'Blocked',
  };
  return labels[status] || 'Unknown';
};