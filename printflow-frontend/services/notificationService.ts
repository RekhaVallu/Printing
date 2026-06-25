import { api } from "./api";

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type:
    | "created"
    | "accepted"
    | "printing"
    | "ready"
    | "priority_requested"
    | "priority_approved"
    | "priority_rejected"
    | "printer_status_changed";
  timestamp: string;
  read: boolean;
  meta?: Record<string, any>;
}

const mapNotification = (item: any): NotificationData => ({
  id: item.id || item._id,
  title: item.title,
  message: item.message,
  type: item.type || "created",
  timestamp: item.timestamp || item.createdAt,
  read: item.read !== undefined ? item.read : !item.isRead ? false : true,
  meta: item.meta || {},
});

export const getNotifications = async (): Promise<NotificationData[]> => {
  try {
    const response = await api.get("/notifications");
    const list = response.data?.data || [];
    return list.map(mapNotification);
  } catch (e) {
    console.error("Failed to load notifications", e);
    return [];
  }
};

export const markNotificationRead = async (id: string): Promise<NotificationData | null> => {
  try {
    const response = await api.post(`/notifications/${id}/read`);
    return mapNotification(response.data?.data || {});
  } catch (e) {
    console.error("Failed to mark notification read", e);
    return null;
  }
};

export const markAllAsRead = async (): Promise<NotificationData[]> => {
  try {
    const response = await api.patch("/notifications/read-all");
    const list = response.data?.data || [];
    return list.map(mapNotification);
  } catch (e) {
    console.error("Failed to mark notifications read", e);
    return [];
  }
};

export const clearAllNotifications = async (): Promise<void> => {
  try {
    await api.delete("/notifications");
  } catch (e) {
    console.error("Failed to clear notifications", e);
  }
};

export const broadcastNotification = async (
  title: string,
  message: string,
  meta: Record<string, any> = {}
) => {
  const response = await api.post("/notifications/broadcast", {
    title,
    message,
    meta,
  });
  return response.data;
};

export const addNotification = async (
  title: string,
  message: string,
  type: NotificationData["type"]
): Promise<NotificationData> => {
  return {
    id: `local_${Date.now()}`,
    title,
    message,
    type,
    timestamp: new Date().toISOString(),
    read: false,
  };
};
