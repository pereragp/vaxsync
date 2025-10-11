import * as Notifications from 'expo-notifications';

export enum NotificationType {
  VACCINE_REMINDER = 'vaccine_reminder',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  HEALTH_ALERT = 'health_alert',
  SCHEDULE_UPDATE = 'schedule_update',
  DEPENDENT_REMINDER = 'dependent_reminder',
  DOCUMENT_EXPIRY = 'document_expiry',
  GENERAL = 'general',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface NotificationPayload {
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  data?: {
    screen?: string;
    params?: Record<string, any>;
    vaccineId?: string;
    appointmentId?: string;
    scheduleId?: string;
    dependentId?: string;
    [key: string]: any;
  };
}

export interface VaccineReminderData {
  type: NotificationType.VACCINE_REMINDER;
  vaccineName: string;
  dueDate: string;
  vaccineId: string;
  dependentId?: string;
  dependentName?: string;
}

export interface AppointmentReminderData {
  type: NotificationType.APPOINTMENT_REMINDER;
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName?: string;
  location?: string;
}

export interface HealthAlertData {
  type: NotificationType.HEALTH_ALERT;
  alertMessage: string;
  severity: 'info' | 'warning' | 'critical';
  actionRequired?: boolean;
}

export interface ScheduleUpdateData {
  type: NotificationType.SCHEDULE_UPDATE;
  scheduleId: string;
  updateType: 'created' | 'updated' | 'cancelled' | 'reminder';
  vaccineName?: string;
  scheduledDate?: string;
}

export interface NotificationScheduleOptions {
  // Schedule for specific date and time
  date?: Date;
  
  // Schedule after certain seconds
  seconds?: number;
  
  // Repeat settings
  repeats?: boolean;
  
  // Daily at specific time (24-hour format)
  dailyAtTime?: {
    hour: number; // 0-23
    minute: number; // 0-59
  };
  
  // Weekly on specific day
  weeklyOnDay?: {
    weekday: number; // 1 = Sunday, 7 = Saturday
    hour: number;
    minute: number;
  };
  
  // Monthly on specific day
  monthlyOnDay?: {
    day: number; // 1-31
    hour: number;
    minute: number;
  };
}

export interface ScheduledNotification {
  id: string;
  payload: NotificationPayload;
  scheduleOptions: NotificationScheduleOptions;
  createdAt: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  vaccineReminders: boolean;
  appointmentReminders: boolean;
  healthAlerts: boolean;
  scheduleUpdates: boolean;
  dependentReminders: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string; // "08:00"
  reminderLeadTime: number; // hours before event
}

export type NotificationResponse = Notifications.NotificationResponse;
export type NotificationRequest = Notifications.NotificationRequest;
export type Notification = Notifications.Notification;

