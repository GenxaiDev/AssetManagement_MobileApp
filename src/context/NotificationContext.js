import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getUnreadNotificationCount } from "../api/notification";
import { signalRService } from "../services/signalRService";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadNotificationCount();
      setUnreadCount(res?.data?.unreadCount ?? 0);
    } catch (err) {
      console.error("Unread count fetch failed:", err);
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();

    const handler = async (data) => {
      console.log("📬 ReceiveNotification:", data);
      if (data.nofUnread !== undefined) {
        setUnreadCount(data.nofUnread);
      } else {
        refreshUnreadCount();
      }
    };

    signalRService.on("ReceiveNotification", handler);
    return () => {
      signalRService.off("ReceiveNotification", handler);
    };
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, setUnreadCount, refreshUnreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
