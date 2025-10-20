import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import notificationService, { PushNotificationToken } from '../services/notificationService';

interface NotificationState {
  notification: Notifications.Notification | null;
  isLoading: boolean;
  error: string | null;
  expoPushToken: string | null;
}

interface NotificationHookReturn extends NotificationState {
  registerForPushNotifications: () => Promise<void>;
  sendLocalNotification: (title: string, body: string, data?: any) => Promise<void>;
  scheduleNotification: (
    title: string,
    body: string,
    trigger: Date | { seconds?: number; repeats?: boolean },
    data?: any
  ) => Promise<string>;
  cancelNotification: (notificationId: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  clearBadgeCount: () => Promise<void>;
  dismissAllNotifications: () => Promise<void>;
}

export function useNotifications(): NotificationHookReturn {
  const [state, setState] = useState<NotificationState>({
    notification: null,
    isLoading: false,
    error: null,
    expoPushToken: null,
  });

  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        setState((prev) => ({ ...prev, notification }));
      }
    );

    // Listener for when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        const notification = response.notification;
        setState((prev) => ({ ...prev, notification }));
        
        // Handle notification tap - you can navigate to specific screens based on data
        const data = notification.request.content.data;
        if (data) {
          handleNotificationTap(data);
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const handleNotificationTap = (data: any) => {
    // Handle navigation based on notification data
    console.log('Notification tapped with data:', data);
    
    // Example: Navigate to specific screens based on notification type
    // if (data.screen === 'schedule') {
    //   navigation.navigate('schedule');
    // } else if (data.screen === 'vaccines') {
    //   navigation.navigate('vaccines');
    // }
  };

  const registerForPushNotifications = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const tokenData: PushNotificationToken | null = 
        await notificationService.registerForPushNotifications();
      
      if (tokenData) {
        setState((prev) => ({
          ...prev,
          expoPushToken: tokenData.token,
          isLoading: false,
        }));
        
        // TODO: Send token to your backend
        // await sendTokenToBackend(tokenData.token);
      } else {
        // Silently fail - don't show error to users if push notifications aren't available
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    } catch (error: any) {
      // Silently fail - don't disturb users with push notification errors
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  const sendLocalNotification = async (
    title: string,
    body: string,
    data?: any
  ) => {
    try {
      await notificationService.sendLocalNotification(title, body, data);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to send notification',
      }));
    }
  };

  const scheduleNotification = async (
    title: string,
    body: string,
    trigger: Date | { seconds?: number; repeats?: boolean },
    data?: any
  ): Promise<string> => {
    try {
      const notificationId = await notificationService.scheduleNotification({
        title,
        body,
        trigger,
        data,
      });
      return notificationId;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to schedule notification',
      }));
      throw error;
    }
  };

  const cancelNotification = async (notificationId: string) => {
    try {
      await notificationService.cancelNotification(notificationId);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to cancel notification',
      }));
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await notificationService.cancelAllNotifications();
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to cancel all notifications',
      }));
    }
  };

  const clearBadgeCount = async () => {
    try {
      await notificationService.clearBadgeCount();
    } catch (error: any) {
      console.error('Failed to clear badge count:', error);
    }
  };

  const dismissAllNotifications = async () => {
    try {
      await notificationService.dismissAllNotifications();
    } catch (error: any) {
      console.error('Failed to dismiss notifications:', error);
    }
  };

  return {
    ...state,
    registerForPushNotifications,
    sendLocalNotification,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    clearBadgeCount,
    dismissAllNotifications,
  };
}

