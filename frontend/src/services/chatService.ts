import api from "@/services/api";
import { getAccessToken } from "@/services/tokenService";

import type {
  MessageListResponse,
  SendMessageData,
  SendMessageResponse,
} from "@/types/chat";

const getAuthHeaders = () => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("Access token is missing.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
};

export const getWorkspaceMessages = async (
  workspaceId: number
): Promise<MessageListResponse> => {
  const response = await api.get<MessageListResponse>(
    `chat/workspaces/${workspaceId}/messages/`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

export const sendWorkspaceMessage = async (
  workspaceId: number,
  messageData: SendMessageData
): Promise<SendMessageResponse> => {
  const response = await api.post<SendMessageResponse>(
    `chat/workspaces/${workspaceId}/messages/`,
    messageData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

export const getChatWebSocketUrl = (
  workspaceId: number,
  accessToken: string
): string => {
  return `ws://127.0.0.1:8000/ws/chat/${workspaceId}/?token=${accessToken}`;
};