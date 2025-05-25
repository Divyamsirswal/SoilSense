"use client";
import Pusher from "pusher";
import PusherClient from "pusher-js";

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher instance
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  }
);

// Custom hooks for using Pusher in components
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useUserChannel() {
  const { data: session } = useSession();
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (session?.user?.id) {
      const userChannel = pusherClient.subscribe(`user-${session.user.id}`);
      setChannel(userChannel);

      return () => {
        pusherClient.unsubscribe(`user-${session.user.id}`);
      };
    }
  }, [session?.user?.id]);

  return channel;
}

export function useFarmChannel(farmId?: string) {
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (farmId) {
      const farmChannel = pusherClient.subscribe(`farm-${farmId}`);
      setChannel(farmChannel);

      return () => {
        pusherClient.unsubscribe(`farm-${farmId}`);
      };
    }
  }, [farmId]);

  return channel;
}

// Function to handle alert notifications
export function useAlertNotifications(onNewAlert: (alerts: any[]) => void) {
  const userChannel = useUserChannel();

  useEffect(() => {
    if (userChannel) {
      userChannel.bind("new-alerts", (data: { alerts: any[] }) => {
        onNewAlert(data.alerts);
      });

      return () => {
        userChannel.unbind("new-alerts");
      };
    }
  }, [userChannel, onNewAlert]);
}

// Function to handle soil data updates
export function useSoilDataUpdates(
  farmId: string,
  onNewData: (data: any) => void
) {
  const farmChannel = useFarmChannel(farmId);

  useEffect(() => {
    if (farmChannel) {
      farmChannel.bind("soil-data-received", (data: any) => {
        onNewData(data);
      });

      return () => {
        farmChannel.unbind("soil-data-received");
      };
    }
  }, [farmChannel, onNewData]);
}
