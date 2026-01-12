import { useState, useEffect, useCallback } from "react";
import { notificationApi } from "../api/notification.api";
import toast from "react-hot-toast";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    // Check initial subscription state
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription);
        });
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      setLoading(true);
      const { publicKey } = await notificationApi.getPublicKey();
      
      const registration = await navigator.serviceWorker.ready;
      
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await notificationApi.subscribe({
        endpoint: subscription.endpoint,
        keys: {
            p256dh: subscription.toJSON().keys?.p256dh || "",
            auth: subscription.toJSON().keys?.auth || ""
        }
      });

      setIsSubscribed(true);
      setPermission("granted");
      toast.success("Notifications enabled!");
    } catch (error) {
      console.error("Failed to subscribe:", error);
      toast.error("Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await notificationApi.unsubscribe(subscription.endpoint);
        await subscription.unsubscribe();
        setIsSubscribed(false);
        toast.success("Notifications disabled");
      }
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      toast.error("Failed to disable notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleSubscription = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === "granted") {
        await subscribe();
      }
    }
  };

  return {
    isSubscribed,
    loading,
    permission,
    toggleSubscription,
  };
};
