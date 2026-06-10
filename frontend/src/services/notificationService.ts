import api from "@/services/api";
import { getAccessToken } from "@/services/tokenService";

import type {
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  NotificationListResponse,
} from "@/types/notification";

const getAuthHeaders = () => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("Access token is missing.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
};

export const getMyNotifications =
  async (): Promise<NotificationListResponse> => {
    const response = await api.get<NotificationListResponse>(
      "notifications/",
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  };

export const markNotificationRead = async (
  notificationId: number
): Promise<MarkNotificationReadResponse> => {
  const response = await api.post<MarkNotificationReadResponse>(
    `notifications/${notificationId}/read/`,
    {},
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

export const markAllNotificationsRead =
  async (): Promise<MarkAllNotificationsReadResponse> => {
    const response = await api.post<MarkAllNotificationsReadResponse>(
      "notifications/read-all/",
      {},
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  };

export const getNotificationWebSocketUrl = (
  accessToken: string
): string => {
  return `ws://127.0.0.1:8000/ws/notifications/?token=${accessToken}`;
};