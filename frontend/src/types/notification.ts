export interface Notification {
  id: number;
  workspace: number | null;
  workspace_name: string | null;
  notification_type: "MESSAGE" | "NOTE" | "WORKSPACE";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  unread_count: number;
  notifications: Notification[];
}

export interface MarkNotificationReadResponse {
  message: string;
  notification: Notification;
}

export interface MarkAllNotificationsReadResponse {
  message: string;
}