import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth, useUser } from "@clerk/clerk-expo";
import {
  getNotifications,
  clearAllNotifications as clearAllNotificationsApi,
  markAllAsRead as markAllAsReadApi,
  markNotificationRead,
  NotificationData,
} from "../services/notificationService";
import { SOCKET_BASE_URL } from "../services/config";


type SocketContextValue = {
  socket: Socket | null;
  connected: boolean;
  notifications: NotificationData[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  simulateNotification: (eventName: string, payload?: any) => void;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  notifications: [],
  unreadCount: 0,
  refreshNotifications: async () => { },
  markAllRead: async () => { },
  clearAll: async () => { },
  markRead: async () => { },
  simulateNotification: () => { },
});

const mapEventToNotification = (eventName: string, payload: any): NotificationData => {
  const orderId = payload?.orderId || payload?.id || "unknown";
  const base = {
    id: payload?.id || `${eventName}_${Date.now()}`,
    timestamp: new Date().toISOString(),
    read: false,
    meta: payload || {},
  };

  switch (eventName) {
    case "notification_created":
      return {
        ...base,
        id: payload?.id || `${eventName}_${Date.now()}`,
        title: payload?.title || "Notification",
        message: payload?.message || "You have a new update.",
        type: "created",
      };
    case "order_created":
      return {
        ...base,
        title: payload?.title || "Order Created",
        message: payload?.message || `Order ${orderId} has been created successfully.`,
        type: "created",
      };
    case "order_accepted":
      return {
        ...base,
        title: "Order Accepted",
        message: `Order ${orderId} has been accepted and queued.`,
        type: "accepted",
      };
    case "order_printing":
      return {
        ...base,
        title: "Printing Started",
        message: `Order ${orderId} is now printing.`,
        type: "printing",
      };
    case "order_ready":
      return {
        ...base,
        title: "Ready for Pickup",
        message: `Order ${orderId} is ready for pickup.`,
        type: "ready",
      };
    case "order_collected":
      return {
        ...base,
        title: "Order Collected",
        message: `Order ${orderId} was collected.`,
        type: "ready",
      };
    case "priority_requested":
      return {
        ...base,
        title: payload?.title || "Priority Requested",
        message: payload?.message || `Priority request submitted for order ${orderId}.`,
        type: "priority_requested",
      };
    case "priority_approved":
      return {
        ...base,
        title: "Priority Approved",
        message: `Priority request approved for order ${orderId}.`,
        type: "priority_approved",
      };
    case "priority_rejected":
      return {
        ...base,
        title: "Priority Rejected",
        message: `Priority request rejected for order ${orderId}.`,
        type: "priority_rejected",
      };
    case "printer_status_changed":
      return {
        ...base,
        title: "Printer Status Changed",
        message: payload?.message || "Printer status updated.",
        type: "printer_status_changed",
      };
    default:
      return {
        ...base,
        title: eventName,
        message: payload?.message || "New update received.",
        type: "created",
      };
  }
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const userId = user?.id;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const getTokenRef = useRef(getToken);

  const refreshNotificationsCooldownRef = useRef<number>(0);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const refreshNotifications = useCallback(async (reason: string = "unknown") => {
    const now = Date.now();
    // Throttle to avoid hammering the API when network/socket reconnect fails
    if (now - refreshNotificationsCooldownRef.current < 5000) return;
    refreshNotificationsCooldownRef.current = now;

    try {
      const list = await getNotifications();
      setNotifications(list);
    } catch (e) {
      console.warn(`refreshNotifications(${reason}) failed`, e);
    }
  }, []);

  const upsertNotification = (item: NotificationData) => {
    setNotifications((prev) => {
      const filtered = prev.filter((n) => n.id !== item.id);
      return [item, ...filtered];
    });
  };

  const markAllRead = async () => {
    const updated = await markAllAsReadApi();
    setNotifications(updated);
  };

  const clearAll = async () => {
    await clearAllNotificationsApi();
    setNotifications([]);
  };

  const markRead = async (id: string) => {
    if (id.startsWith("sim_") || id.startsWith("local_")) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      return;
    }

    const updated = await markNotificationRead(id);
    if (updated) {
      setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    }
  };

  const simulateNotification = (eventName: string, payload: any = {}) => {
    const notification = mapEventToNotification(eventName, {
      id: `sim_${eventName}_${Date.now()}`,
      ...payload,
    });
    upsertNotification(notification);
  };

  useEffect(() => {
    let mounted = true;

    const connect = async () => {
      if (!isSignedIn || !userId) {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        setSocket(null);
        setConnected(false);
        setNotifications([]);
        return;
      }

      if (!SOCKET_BASE_URL || typeof SOCKET_BASE_URL !== "string") {
        console.warn("SOCKET_BASE_URL missing; skipping socket connection");
        return;
      }

      const token = await getTokenRef.current().catch((e) => {
        console.warn("getToken failed", e);
        return null;
      });

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const s = io(SOCKET_BASE_URL, {

        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        auth: {
          token,
          clerkUserId: userId,
        },
      });


      socketRef.current = s;
      setSocket(s);

      s.on("connect", () => {
        if (!mounted) return;
        setConnected(true);
      });
      s.on("disconnect", () => {
        if (!mounted) return;
        setConnected(false);
      });


      s.on("unauthorized", (d: any) => {
        console.warn("Socket unauthorized", d);
        if (!mounted) return;
        setConnected(false);
      });



      const handleEvent = (eventName: string, payload: any) => {
        try {
          const notification = mapEventToNotification(eventName, payload);
          upsertNotification(notification);
        } catch (e) {
          console.warn("Socket event handling failed", eventName, e);
        }
      };


      const events = [
        "notification_created",
        "order_created",
        "order_accepted",
        "order_printing",
        "order_ready",
        "order_collected",
        "priority_requested",
        "priority_approved",
        "priority_rejected",
        "printer_status_changed",
      ];

      events.forEach((eventName) => {
        s.on(eventName, (payload) => {
          if (!mounted) return;
          handleEvent(eventName, payload);
        });
      });


      try {
        await refreshNotifications();
      } catch (e) {
        console.warn("Failed to load notifications", e);
      }


      // Some backends emit a connected payload; never assume shape.
      s.on("connected", (d: any) => {
        try {
          if (!d) return;
        } catch {
          // ignore
        }
      });

    };

    connect();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isSignedIn, userId, refreshNotifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        notifications,
        unreadCount,
        refreshNotifications,
        markAllRead,
        clearAll,
        markRead,
        simulateNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
