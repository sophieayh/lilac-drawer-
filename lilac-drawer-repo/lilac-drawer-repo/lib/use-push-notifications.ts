"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isPushSupported,
  getCurrentPushSubscription,
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
} from "./push-client";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and check current status
  useEffect(() => {
    let isMounted = true;

    async function init() {
      const supported = isPushSupported();
      if (!isMounted) return;
      setIsSupported(supported);

      if (!supported) {
        setIsLoading(false);
        return;
      }

      setPermission(Notification.permission);

      // Register SW in background if supported
      await registerServiceWorker();

      const sub = await getCurrentPushSubscription();
      if (isMounted) {
        setIsSubscribed(Boolean(sub));
        setIsLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubscribe = useCallback(async () => {
    setIsLoading(true);
    const result = await subscribeToPush();
    if (result.success) {
      setIsSubscribed(true);
      setPermission("granted");
    }
    setIsLoading(false);
    return result;
  }, []);

  const handleUnsubscribe = useCallback(async () => {
    setIsLoading(true);
    const result = await unsubscribeFromPush();
    if (result.success) {
      setIsSubscribed(false);
    }
    setIsLoading(false);
    return result;
  }, []);

  const toggle = useCallback(async () => {
    if (isSubscribed) {
      return await handleUnsubscribe();
    } else {
      return await handleSubscribe();
    }
  }, [isSubscribed, handleSubscribe, handleUnsubscribe]);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe: handleSubscribe,
    unsubscribe: handleUnsubscribe,
    toggle,
  };
}
