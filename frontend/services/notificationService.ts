import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import notification settings helper
let getNotificationSettings: any = null;

// Lazy load to avoid circular dependency
const loadSettings = async () => {
  if (!getNotificationSettings) {
    const module = await import('../components/NotificationSettings');
    getNotificationSettings = module.getNotificationSettings;
  }
  return getNotificationSettings;
};

// Configure how notifications should be handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => {
    try {
      const getSettings = await loadSettings();
      const settings = await getSettings();
      
      return {
        shouldShowAlert: true,
        shouldPlaySound: settings.soundEnabled,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    } catch (error) {
      console.error('Error loading notification settings:', error);
      // Fallback to default behavior
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    }
  },
});

export interface PushNotificationToken {
  token: string;
  type: 'expo' | 'fcm' | 'apns';
}

export interface NotificationData {
  [key: string]: any;
}

export interface ScheduledNotificationInput {
  title: string;
  body: string;
  data?: NotificationData;
  trigger: 
    | Date 
    | { 
        seconds?: number;
        repeats?: boolean;
        hour?: number;
        minute?: number;
        weekday?: number;
        day?: number;
        month?: number;
      };
}

class NotificationService {
  private static instance: NotificationService;
  private token: string | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Request notification permissions and get push notification token
   */
  async registerForPushNotifications(): Promise<PushNotificationToken | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push notification permission');
        return null;
      }

      // Get the Expo push token with project ID for production
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '283dab38-62ae-40ce-98a1-180c9a484844',
      });

      this.token = tokenData.data;

      // Save token to AsyncStorage
      await AsyncStorage.setItem('expoPushToken', tokenData.data);

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      return {
        token: tokenData.data,
        type: 'expo',
      };
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('vaccine-reminders', {
      name: 'Vaccine Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'notification.wav',
      lightColor: '#4CAF50',
    });

    await Notifications.setNotificationChannelAsync('appointments', {
      name: 'Appointments',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'notification.wav',
      lightColor: '#2196F3',
    });

    await Notifications.setNotificationChannelAsync('health-alerts', {
      name: 'Health Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      sound: 'notification.wav',
      lightColor: '#FF5722',
    });
  }

  /**
   * Send a local notification immediately
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
    channelId: string = 'default'
  ): Promise<string> {
    try {
      // Get user sound/vibration preferences
      const getSettings = await loadSettings();
      const settings = await getSettings();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: settings.soundEnabled ? 'notification.wav' : undefined,
        },
        trigger: null, // null means send immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending local notification:', error);
      throw error;
    }
  }

  /**
   * Schedule a notification for a future time
   */
  async scheduleNotification(
    input: ScheduledNotificationInput,
    channelId: string = 'default'
  ): Promise<string> {
    try {
      let trigger: Notifications.NotificationTriggerInput;
      
      if (input.trigger instanceof Date) {
        // For Date objects, convert to seconds from now
        const secondsFromNow = Math.floor((input.trigger.getTime() - Date.now()) / 1000);
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsFromNow > 0 ? secondsFromNow : 1,
          repeats: false,
        } as Notifications.TimeIntervalTriggerInput;
      } else if ('seconds' in input.trigger) {
        // Time interval trigger
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          ...input.trigger,
        } as Notifications.TimeIntervalTriggerInput;
      } else {
        // Calendar trigger - needs type property
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          ...input.trigger,
        } as Notifications.CalendarTriggerInput;
      }

      // Get user sound/vibration preferences
      const getSettings = await loadSettings();
      const settings = await getSettings();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: input.title,
          body: input.body,
          data: input.data || {},
          sound: settings.soundEnabled ? 'notification.wav' : undefined,
          ...(Platform.OS === 'android' && { channelId }),
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Get the current push token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Clear notification badge count
   */
  async clearBadgeCount(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge count:', error);
    }
  }

  /**
   * Dismiss all notifications
   */
  async dismissAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error dismissing notifications:', error);
    }
  }
}

export default NotificationService.getInstance();

