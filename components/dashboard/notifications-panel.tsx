"use client";

import {
  AlertTriangle,
  BellRing,
  Check,
  CheckCircle,
  Info,
  Zap,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  message: string;
  severity: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsPanelProps {
  notifications: Notification[];
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  const [activeNotifications, setActiveNotifications] = useState(notifications);

  if (!activeNotifications || activeNotifications.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
          <BellRing className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium mb-1">No notifications</h3>
        <p className="text-xs text-muted-foreground">
          You're all caught up! No new alerts to display.
        </p>
      </div>
    );
  }

  const markAllAsRead = () => {
    setActiveNotifications((prevNotifications) =>
      prevNotifications.map((notification) => ({
        ...notification,
        isRead: true,
      }))
    );
    // In a real app, this would also update the database
  };

  const getNotificationIcon = (type: string, severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "INFO":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        if (type === "DEVICE_STATUS")
          return <Zap className="h-4 w-4 text-primary" />;
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "border-l-4 border-destructive bg-destructive/5";
      case "WARNING":
        return "border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/10";
      case "INFO":
        return "border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10";
      default:
        return "border-l-4 border-primary bg-primary/5";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Badge variant="outline" className="rounded-full">
          {activeNotifications.filter((n) => !n.isRead).length} unread
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={markAllAsRead}
          className="h-8 px-2 text-xs"
        >
          <Check className="mr-1 h-3 w-3" />
          Mark all as read
        </Button>
      </div>

      <ScrollArea className="h-[180px]">
        <div className="space-y-2">
          {activeNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-md ${getNotificationColor(
                notification.severity
              )} ${notification.isRead ? "opacity-60" : ""}`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {getNotificationIcon(
                    notification.type,
                    notification.severity
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{notification.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-xs"
                        onClick={() => {
                          setActiveNotifications((prevNotifications) =>
                            prevNotifications.map((n) =>
                              n.id === notification.id
                                ? { ...n, isRead: true }
                                : n
                            )
                          );
                          // In a real app, this would also update the database
                        }}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
