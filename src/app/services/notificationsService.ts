import { axiosClient } from "../api/axiosClient";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "DANGER" | "CRITICAL";
  read: boolean;
  createdAt: string;
}

export class NotificationsService {
  static async getNotifications(): Promise<NotificationItem[]> {
    const res = await axiosClient.get("/notifications");
    return res.data.data.notifications;
  }

  static async markAsRead(id: string): Promise<NotificationItem> {
    const res = await axiosClient.put(`/notifications/${id}/read`);
    return res.data.data.notification;
  }

  static async markAllAsRead(): Promise<void> {
    await axiosClient.put("/notifications/read-all");
  }

  static async deleteNotification(id: string): Promise<void> {
    await axiosClient.delete(`/notifications/${id}`);
  }
}
