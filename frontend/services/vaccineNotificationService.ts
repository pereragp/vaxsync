/**
 * Service for managing vaccination schedule notifications
 * Handles scheduling reminders for vaccine doses at specific intervals:
 * - 3 days before
 * - 2 days before  
 * - 1 day before (tomorrow)
 * - On the day (today)
 * - Overdue notifications
 */

import notificationService from './notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VaccineSchedule, VaccineDose } from '../api/scheduleApi';
import { NotificationType } from '../types/notifications';
import { getNotificationSettings } from '../components/NotificationSettings';

const NOTIFICATION_IDS_KEY = 'vaccine_notification_ids';

interface DoseNotificationIds {
  scheduleId: string;
  doseNumber: number;
  notificationIds: {
    threeDaysBefore?: string;
    twoDaysBefore?: string;
    oneDayBefore?: string;
    onTheDay?: string;
  };
}

interface StoredNotifications {
  [scheduleId: string]: DoseNotificationIds[];
}

/**
 * Calculate notification times for a dose
 */
function calculateNotificationTimes(doseDate: Date) {
  const times = {
    threeDaysBefore: new Date(doseDate),
    twoDaysBefore: new Date(doseDate),
    oneDayBefore: new Date(doseDate),
    onTheDay: new Date(doseDate),
  };

  // Set notification times to 9 AM on each day
  const hour = 9;
  const minute = 0;

  times.threeDaysBefore.setDate(times.threeDaysBefore.getDate() - 3);
  times.threeDaysBefore.setHours(hour, minute, 0, 0);

  times.twoDaysBefore.setDate(times.twoDaysBefore.getDate() - 2);
  times.twoDaysBefore.setHours(hour, minute, 0, 0);

  times.oneDayBefore.setDate(times.oneDayBefore.getDate() - 1);
  times.oneDayBefore.setHours(hour, minute, 0, 0);

  times.onTheDay.setHours(hour, minute, 0, 0);

  return times;
}

/**
 * Check if a date is in the future
 */
function isFutureDate(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Check if a notification should be sent immediately
 * Returns true if the notification time is in the past or very close (within 5 minutes)
 */
function shouldSendImmediately(notificationTime: Date): boolean {
  const now = Date.now();
  const notificationTimestamp = notificationTime.getTime();
  const fiveMinutesInMs = 5 * 60 * 1000; // 5 minutes
  
  // If notification time is in the past or within the next 5 minutes, send immediately
  return notificationTimestamp <= (now + fiveMinutesInMs);
}

/**
 * Calculate days difference between notification time and dose date
 */
function getDaysUntilDose(notificationTime: Date, doseDate: Date): number {
  const diffTime = doseDate.getTime() - notificationTime.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate how many days from now until the dose date
 */
function getDaysFromNowUntilDose(doseDate: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset to start of day
  const dose = new Date(doseDate);
  dose.setHours(0, 0, 0, 0); // Reset to start of day
  const diffTime = dose.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if a notification should be sent based on current days until dose
 * Only send immediate notifications that make contextual sense
 */
function shouldSendNotificationForDaysUntil(
  notificationDaysBefore: number,
  actualDaysUntilDose: number
): boolean {
  // Only send if the notification matches or is less than actual days
  // E.g., if dose is 2 days away, only send "2 days" or "1 day" notifications
  return notificationDaysBefore <= actualDaysUntilDose;
}

/**
 * Get stored notification IDs from AsyncStorage
 */
async function getStoredNotificationIds(): Promise<StoredNotifications> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error getting stored notification IDs:', error);
    return {};
  }
}

/**
 * Save notification IDs to AsyncStorage
 */
async function saveNotificationIds(notifications: StoredNotifications): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving notification IDs:', error);
  }
}

/**
 * Schedule notifications for a single dose
 */
export async function scheduleDoseNotifications(
  schedule: VaccineSchedule,
  dose: VaccineDose,
  dependentName?: string
): Promise<DoseNotificationIds> {
  // Check if notifications are enabled
  const settings = await getNotificationSettings();
  console.log('🔔 Notification Settings:', {
    enabled: settings.enabled,
    vaccineReminders: settings.vaccineReminders,
    scheduleUpdates: settings.scheduleUpdates,
    overdueAlerts: settings.overdueAlerts,
  });

  if (!settings.enabled) {
    console.log('⏸️  Notifications are disabled by user, skipping scheduling');
    return {
      scheduleId: schedule._id,
      doseNumber: dose.doseNumber,
      notificationIds: {},
    };
  }

  const doseDate = new Date(dose.dateScheduled);
  const times = calculateNotificationTimes(doseDate);
  const now = new Date();
  
  // Calculate how many days from now until the dose
  const daysUntilDose = getDaysFromNowUntilDose(doseDate);

  const notificationIds: DoseNotificationIds = {
    scheduleId: schedule._id,
    doseNumber: dose.doseNumber,
    notificationIds: {},
  };

  const baseTitle = dependentName
    ? `${dependentName}'s ${schedule.vaccineName}`
    : schedule.vaccineName;

  const doseInfo = schedule.totalDoses > 1
    ? ` - Dose ${dose.doseNumber}/${schedule.totalDoses}`
    : '';
  
  console.log(`📅 Dose scheduled for ${doseDate.toLocaleDateString()}, ${daysUntilDose} days from now`);
  console.log(`🔔 Will schedule notifications: ${settings.vaccineReminders ? 'YES' : 'NO'}`);

  // Schedule 3 days before notification
  if (settings.vaccineReminders) {
    try {
      const notificationData = {
        title: `${baseTitle} in 3 Days${doseInfo}`,
        body: `Reminder: Your vaccination is scheduled for ${doseDate.toLocaleDateString()}. Make sure you're prepared!`,
        data: {
          type: NotificationType.VACCINE_REMINDER,
          screen: 'schedule',
          scheduleId: schedule._id,
          doseNumber: dose.doseNumber,
          vaccineName: schedule.vaccineName,
          dependentName,
          daysUntil: 3,
        },
      };

      // Check if this notification makes sense given current days until dose
      if (shouldSendImmediately(times.threeDaysBefore) && shouldSendNotificationForDaysUntil(3, daysUntilDose)) {
        console.log('🔔 Sending 3-day notification immediately (makes sense for current timeframe)');
        await notificationService.sendLocalNotification(
          notificationData.title,
          notificationData.body,
          notificationData.data,
          'vaccine-reminders'
        );
        notificationIds.notificationIds.threeDaysBefore = 'sent-immediately';
      } else if (isFutureDate(times.threeDaysBefore)) {
        // Only schedule if it's in the future
        const id = await notificationService.scheduleNotification(
          {
            ...notificationData,
            trigger: times.threeDaysBefore,
          },
          'vaccine-reminders'
        );
        notificationIds.notificationIds.threeDaysBefore = id;
        console.log('⏰ Scheduled 3-day notification for', times.threeDaysBefore.toLocaleString());
      }
    } catch (error) {
      console.error('Error scheduling 3-day notification:', error);
    }
  }

  // Schedule 2 days before notification
  if (settings.vaccineReminders) {
    try {
      const notificationData = {
        title: `${baseTitle} in 2 Days${doseInfo}`,
        body: `Your vaccination is coming up soon on ${doseDate.toLocaleDateString()}. Have you confirmed your appointment?`,
        data: {
          type: NotificationType.VACCINE_REMINDER,
          screen: 'schedule',
          scheduleId: schedule._id,
          doseNumber: dose.doseNumber,
          vaccineName: schedule.vaccineName,
          dependentName,
          daysUntil: 2,
        },
      };

      const makesSense = shouldSendNotificationForDaysUntil(2, daysUntilDose);
      
      // If dose is exactly 2 days away, send immediately
      if (makesSense && daysUntilDose === 2) {
        console.log('🔔 Sending 2-day notification immediately (dose is in 2 days!)');
        await notificationService.sendLocalNotification(
          notificationData.title,
          notificationData.body,
          notificationData.data,
          'vaccine-reminders'
        );
        notificationIds.notificationIds.twoDaysBefore = 'sent-immediately';
      } else if (isFutureDate(times.twoDaysBefore) && daysUntilDose > 2) {
        // Only schedule if dose is more than 2 days away
        const id = await notificationService.scheduleNotification(
          {
            ...notificationData,
            trigger: times.twoDaysBefore,
          },
          'vaccine-reminders'
        );
        notificationIds.notificationIds.twoDaysBefore = id;
        console.log('⏰ Scheduled 2-day notification for', times.twoDaysBefore.toLocaleString());
      } else {
        console.log('⏸️  2-day notification not needed (dose is not 2 days away)');
      }
    } catch (error) {
      console.error('Error scheduling 2-day notification:', error);
    }
  }

  // Schedule 1 day before notification (tomorrow)
  if (settings.vaccineReminders) {
    try {
      const notificationData = {
        title: `${baseTitle} Tomorrow!${doseInfo}`,
        body: `Important: Your vaccination is scheduled for tomorrow at ${doseDate.toLocaleDateString()}. Don't forget!`,
        data: {
          type: NotificationType.VACCINE_REMINDER,
          screen: 'schedule',
          scheduleId: schedule._id,
          doseNumber: dose.doseNumber,
          vaccineName: schedule.vaccineName,
          dependentName,
          daysUntil: 1,
        },
      };

      const makesSense = shouldSendNotificationForDaysUntil(1, daysUntilDose);
      
      // If dose is exactly 1 day away, send immediately
      if (makesSense && daysUntilDose === 1) {
        console.log('🔔 Sending 1-day notification immediately (dose is tomorrow!)');
        await notificationService.sendLocalNotification(
          notificationData.title,
          notificationData.body,
          notificationData.data,
          'vaccine-reminders'
        );
        notificationIds.notificationIds.oneDayBefore = 'sent-immediately';
      } else if (isFutureDate(times.oneDayBefore) && daysUntilDose > 1) {
        // Only schedule if dose is more than 1 day away
        const id = await notificationService.scheduleNotification(
          {
            ...notificationData,
            trigger: times.oneDayBefore,
          },
          'vaccine-reminders'
        );
        notificationIds.notificationIds.oneDayBefore = id;
        console.log('⏰ Scheduled 1-day notification for', times.oneDayBefore.toLocaleString());
      } else {
        console.log('⏸️  1-day notification not needed (dose is not 1 day away)');
      }
    } catch (error) {
      console.error('Error scheduling 1-day notification:', error);
    }
  }

  // Schedule on-the-day notification (today)
  if (settings.vaccineReminders) {
    try {
      const notificationData = {
        title: `${baseTitle} Today!${doseInfo}`,
        body: `Today is the day! Your vaccination is scheduled for ${doseDate.toLocaleDateString()}. Good luck!`,
        data: {
          type: NotificationType.VACCINE_REMINDER,
          screen: 'schedule',
          scheduleId: schedule._id,
          doseNumber: dose.doseNumber,
          vaccineName: schedule.vaccineName,
          dependentName,
          daysUntil: 0,
        },
      };

      const makesSense = shouldSendNotificationForDaysUntil(0, daysUntilDose);
      
      console.log(`📊 Today notification check:`, {
        daysUntilDose,
        makesSense,
        currentTime: new Date().toLocaleString()
      });

      // If the dose is TODAY (daysUntilDose === 0), send notification immediately
      if (makesSense && daysUntilDose === 0) {
        console.log('🔔 Sending same-day notification immediately (dose is today!)');
        await notificationService.sendLocalNotification(
          notificationData.title,
          notificationData.body,
          notificationData.data,
          'vaccine-reminders'
        );
        notificationIds.notificationIds.onTheDay = 'sent-immediately';
      } else {
        console.log('⚠️  Today notification not sent: dose is not today');
      }
    } catch (error) {
      console.error('Error scheduling same-day notification:', error);
    }
  }

  return notificationIds;
}

/**
 * Schedule notifications for all doses in a schedule
 */
export async function scheduleVaccineScheduleNotifications(
  schedule: VaccineSchedule,
  dependentName?: string
): Promise<void> {
  try {
    const allNotificationIds: DoseNotificationIds[] = [];

    // Schedule notifications for each dose that is scheduled (not completed/cancelled)
    for (const dose of schedule.doses) {
      if (dose.status === 'scheduled') {
        const doseNotifications = await scheduleDoseNotifications(
          schedule,
          dose,
          dependentName
        );
        allNotificationIds.push(doseNotifications);
      }
    }

    // Store the notification IDs
    const stored = await getStoredNotificationIds();
    stored[schedule._id] = allNotificationIds;
    await saveNotificationIds(stored);

    console.log(
      `Scheduled ${allNotificationIds.length} dose notifications for schedule ${schedule._id}`
    );
  } catch (error) {
    console.error('Error scheduling vaccine schedule notifications:', error);
    throw error;
  }
}

/**
 * Cancel all notifications for a specific schedule
 */
export async function cancelScheduleNotifications(scheduleId: string): Promise<void> {
  try {
    const stored = await getStoredNotificationIds();
    const scheduleNotifications = stored[scheduleId];

    if (scheduleNotifications) {
      // Cancel all notification IDs
      for (const doseNotif of scheduleNotifications) {
        const ids = doseNotif.notificationIds;
        
        // Only cancel if not sent immediately (already sent notifications can't be cancelled)
        if (ids.threeDaysBefore && ids.threeDaysBefore !== 'sent-immediately') {
          await notificationService.cancelNotification(ids.threeDaysBefore);
        }
        if (ids.twoDaysBefore && ids.twoDaysBefore !== 'sent-immediately') {
          await notificationService.cancelNotification(ids.twoDaysBefore);
        }
        if (ids.oneDayBefore && ids.oneDayBefore !== 'sent-immediately') {
          await notificationService.cancelNotification(ids.oneDayBefore);
        }
        if (ids.onTheDay && ids.onTheDay !== 'sent-immediately') {
          await notificationService.cancelNotification(ids.onTheDay);
        }
      }

      // Remove from storage
      delete stored[scheduleId];
      await saveNotificationIds(stored);

      console.log(`Cancelled all notifications for schedule ${scheduleId}`);
    }
  } catch (error) {
    console.error('Error cancelling schedule notifications:', error);
  }
}

/**
 * Cancel notifications for a specific dose
 */
export async function cancelDoseNotifications(
  scheduleId: string,
  doseNumber: number
): Promise<void> {
  try {
    const stored = await getStoredNotificationIds();
    const scheduleNotifications = stored[scheduleId];

    if (scheduleNotifications) {
      const doseNotif = scheduleNotifications.find(
        (n) => n.doseNumber === doseNumber
      );

      if (doseNotif) {
        const ids = doseNotif.notificationIds;
        
        // Only cancel if not sent immediately (already sent notifications can't be cancelled)
        if (ids.threeDaysBefore && ids.threeDaysBefore !== 'sent-immediately') {
          await notificationService.cancelNotification(ids.threeDaysBefore);
        }
        if (ids.twoDaysBefore && ids.twoDaysBefore !== 'sent-immediately') {
          await notificationService.cancelNotification(ids.twoDaysBefore);
        }
        if (ids.oneDayBefore && ids.oneDayBefore !== 'sent-immediately') {
          await notificationService.cancelNotification(ids.oneDayBefore);
        }
        if (ids.onTheDay && ids.onTheDay !== 'sent-immediately') {
          await notificationService.cancelNotification(ids.onTheDay);
        }

        // Remove this dose from storage
        stored[scheduleId] = scheduleNotifications.filter(
          (n) => n.doseNumber !== doseNumber
        );
        await saveNotificationIds(stored);

        console.log(
          `Cancelled notifications for dose ${doseNumber} of schedule ${scheduleId}`
        );
      }
    }
  } catch (error) {
    console.error('Error cancelling dose notifications:', error);
  }
}

/**
 * Reschedule notifications for an updated schedule
 */
export async function rescheduleVaccineScheduleNotifications(
  schedule: VaccineSchedule,
  dependentName?: string
): Promise<void> {
  try {
    // Cancel existing notifications
    await cancelScheduleNotifications(schedule._id);
    
    // Schedule new notifications
    await scheduleVaccineScheduleNotifications(schedule, dependentName);
    
    console.log(`Rescheduled notifications for schedule ${schedule._id}`);
  } catch (error) {
    console.error('Error rescheduling notifications:', error);
    throw error;
  }
}

/**
 * Check for overdue doses and send notifications
 * This should be called when the app opens or comes to foreground
 */
export async function checkOverdueDoses(schedules: VaccineSchedule[]): Promise<void> {
  try {
    // Check if notifications are enabled
    const settings = await getNotificationSettings();
    if (!settings.enabled || !settings.overdueAlerts) {
      console.log('⏸️  Overdue alerts are disabled by user');
      return;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day

    for (const schedule of schedules) {
      // Skip completed or cancelled schedules
      if (schedule.overallStatus === 'completed' || schedule.overallStatus === 'cancelled') {
        continue;
      }

      // Find overdue doses
      for (const dose of schedule.doses) {
        if (dose.status === 'scheduled') {
          const doseDate = new Date(dose.dateScheduled);
          doseDate.setHours(0, 0, 0, 0); // Reset to start of day
          
          // If dose is overdue (past the scheduled date, not including today)
          if (doseDate < now) {
            const daysOverdue = Math.floor(
              (now.getTime() - doseDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Get dependent name if applicable
            let dependentName: string | undefined;
            if (schedule.dependents && schedule.dependents.length > 0) {
              const dependent = schedule.dependents[0];
              dependentName = `${dependent.firstName} ${dependent.lastName}`;
            }

            const baseTitle = dependentName
              ? `${dependentName}'s ${schedule.vaccineName}`
              : schedule.vaccineName;

            const doseInfo = schedule.totalDoses > 1
              ? ` - Dose ${dose.doseNumber}/${schedule.totalDoses}`
              : '';

            // Build overdue message
            let overdueMessage: string;
            if (daysOverdue === 0) {
              // This shouldn't happen now, but just in case
              overdueMessage = `This vaccination was scheduled for ${doseDate.toLocaleDateString()}. Please reschedule it as soon as possible.`;
            } else if (daysOverdue === 1) {
              overdueMessage = `This vaccination was scheduled for ${doseDate.toLocaleDateString()} (1 day ago). Please reschedule it as soon as possible.`;
            } else {
              overdueMessage = `This vaccination was scheduled for ${doseDate.toLocaleDateString()} (${daysOverdue} days ago). Please reschedule it as soon as possible.`;
            }

            // Send immediate overdue notification
            await notificationService.sendLocalNotification(
              `${baseTitle} Overdue!${doseInfo}`,
              overdueMessage,
              {
                type: NotificationType.VACCINE_REMINDER,
                screen: 'schedule',
                scheduleId: schedule._id,
                doseNumber: dose.doseNumber,
                vaccineName: schedule.vaccineName,
                dependentName,
                daysOverdue,
                isOverdue: true,
              },
              'health-alerts'
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking overdue doses:', error);
  }
}

/**
 * Clean up notification IDs for deleted schedules
 * Call this periodically to remove stale data
 */
export async function cleanupNotificationStorage(
  activeScheduleIds: string[]
): Promise<void> {
  try {
    const stored = await getStoredNotificationIds();
    const updated: StoredNotifications = {};

    // Keep only notifications for active schedules
    for (const scheduleId of activeScheduleIds) {
      if (stored[scheduleId]) {
        updated[scheduleId] = stored[scheduleId];
      }
    }

    await saveNotificationIds(updated);
    console.log('Cleaned up notification storage');
  } catch (error) {
    console.error('Error cleaning up notification storage:', error);
  }
}

/**
 * Get all scheduled notification IDs for debugging
 */
export async function getAllScheduledNotificationIds(): Promise<StoredNotifications> {
  return await getStoredNotificationIds();
}

