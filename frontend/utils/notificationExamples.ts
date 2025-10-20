/**
 * Example notification implementations for VaxSync
 * These are templates you can use to implement specific notifications
 */

import notificationService from '../services/notificationService';
import { NotificationType } from '../types/notifications';

/**
 * Example: Send a vaccine reminder notification
 */
export async function scheduleVaccineReminder(
  vaccineName: string,
  dueDate: Date,
  vaccineId: string,
  dependentName?: string
): Promise<string> {
  // Schedule for 24 hours before due date
  const reminderTime = new Date(dueDate);
  reminderTime.setHours(reminderTime.getHours() - 24);

  const title = dependentName
    ? `${dependentName}'s ${vaccineName} Due Soon`
    : `${vaccineName} Due Soon`;

  const body = `Reminder: ${vaccineName} is due on ${dueDate.toLocaleDateString()}. Don't forget to schedule your appointment!`;

  return await notificationService.scheduleNotification(
    {
      title,
      body,
      trigger: reminderTime,
      data: {
        type: NotificationType.VACCINE_REMINDER,
        screen: 'vaccines',
        vaccineId,
        dependentName,
      },
    },
    'vaccine-reminders'
  );
}

/**
 * Example: Send appointment confirmation notification
 */
export async function sendAppointmentConfirmation(
  appointmentDate: Date,
  doctorName: string,
  location: string,
  appointmentId: string
): Promise<void> {
  const title = 'Appointment Confirmed';
  const body = `Your appointment with ${doctorName} is scheduled for ${appointmentDate.toLocaleString()} at ${location}`;

  await notificationService.sendLocalNotification(
    title,
    body,
    {
      type: NotificationType.APPOINTMENT_REMINDER,
      screen: 'schedule',
      appointmentId,
    },
    'appointments'
  );
}

/**
 * Example: Schedule appointment reminder (1 hour before)
 */
export async function scheduleAppointmentReminder(
  appointmentDate: Date,
  doctorName: string,
  location: string,
  appointmentId: string
): Promise<string> {
  // Schedule for 1 hour before appointment
  const reminderTime = new Date(appointmentDate);
  reminderTime.setHours(reminderTime.getHours() - 1);

  const title = 'Upcoming Appointment';
  const body = `Your appointment with ${doctorName} is in 1 hour at ${location}`;

  return await notificationService.scheduleNotification(
    {
      title,
      body,
      trigger: reminderTime,
      data: {
        type: NotificationType.APPOINTMENT_REMINDER,
        screen: 'schedule',
        appointmentId,
      },
    },
    'appointments'
  );
}

/**
 * Example: Send health alert notification
 */
export async function sendHealthAlert(
  alertMessage: string,
  severity: 'info' | 'warning' | 'critical'
): Promise<void> {
  const titles = {
    info: 'Health Information',
    warning: 'Health Alert',
    critical: 'Urgent Health Alert',
  };

  await notificationService.sendLocalNotification(
    titles[severity],
    alertMessage,
    {
      type: NotificationType.HEALTH_ALERT,
      severity,
      screen: 'health-services',
    },
    'health-alerts'
  );
}

/**
 * Example: Send schedule update notification
 */
export async function sendScheduleUpdate(
  vaccineName: string,
  updateType: 'created' | 'updated' | 'cancelled',
  scheduleId: string
): Promise<void> {
  const messages = {
    created: `New vaccination schedule created for ${vaccineName}`,
    updated: `Your ${vaccineName} schedule has been updated`,
    cancelled: `Your ${vaccineName} appointment has been cancelled`,
  };

  await notificationService.sendLocalNotification(
    'Schedule Update',
    messages[updateType],
    {
      type: NotificationType.SCHEDULE_UPDATE,
      screen: 'schedule',
      scheduleId,
      updateType,
    }
  );
}

/**
 * Example: Schedule daily reminder for checking vaccine schedule
 */
export async function scheduleDailyHealthCheckReminder(): Promise<string> {
  return await notificationService.scheduleNotification(
    {
      title: 'Daily Health Check',
      body: 'Time to review your vaccination schedule and upcoming appointments',
      trigger: {
        hour: 9, // 9 AM daily
        minute: 0,
        repeats: true,
      },
      data: {
        type: NotificationType.GENERAL,
        screen: 'schedule',
      },
    },
    'default'
  );
}

/**
 * Example: Schedule weekly dependent reminder
 */
export async function scheduleWeeklyDependentReminder(
  dependentName: string,
  dependentId: string
): Promise<string> {
  return await notificationService.scheduleNotification(
    {
      title: 'Dependent Health Check',
      body: `Check ${dependentName}'s vaccination schedule and health records`,
      trigger: {
        weekday: 2, // Monday (1 = Sunday, 2 = Monday, etc.)
        hour: 10,
        minute: 0,
        repeats: true,
      },
      data: {
        type: NotificationType.DEPENDENT_REMINDER,
        screen: 'profile',
        dependentId,
        dependentName,
      },
    }
  );
}

/**
 * Example: Send document expiry warning
 */
export async function sendDocumentExpiryWarning(
  documentType: string,
  expiryDate: Date
): Promise<void> {
  await notificationService.sendLocalNotification(
    'Document Expiring Soon',
    `Your ${documentType} expires on ${expiryDate.toLocaleDateString()}. Please renew it soon.`,
    {
      type: NotificationType.DOCUMENT_EXPIRY,
      screen: 'profile',
      expiryDate: expiryDate.toISOString(),
    }
  );
}

/**
 * Example: Schedule vaccination due date reminder series
 * Sends reminders at 1 week, 3 days, and 1 day before
 */
export async function scheduleVaccineReminderSeries(
  vaccineName: string,
  dueDate: Date,
  vaccineId: string
): Promise<string[]> {
  const reminderIds: string[] = [];

  // 1 week before
  const oneWeekBefore = new Date(dueDate);
  oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);
  const id1 = await notificationService.scheduleNotification({
    title: `${vaccineName} Due in 1 Week`,
    body: `Reminder: ${vaccineName} is due on ${dueDate.toLocaleDateString()}`,
    trigger: oneWeekBefore,
    data: {
      type: NotificationType.VACCINE_REMINDER,
      vaccineId,
      screen: 'vaccines',
    },
  }, 'vaccine-reminders');
  reminderIds.push(id1);

  // 3 days before
  const threeDaysBefore = new Date(dueDate);
  threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
  const id2 = await notificationService.scheduleNotification({
    title: `${vaccineName} Due in 3 Days`,
    body: `Don't forget: ${vaccineName} is due on ${dueDate.toLocaleDateString()}`,
    trigger: threeDaysBefore,
    data: {
      type: NotificationType.VACCINE_REMINDER,
      vaccineId,
      screen: 'vaccines',
    },
  }, 'vaccine-reminders');
  reminderIds.push(id2);

  // 1 day before
  const oneDayBefore = new Date(dueDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  const id3 = await notificationService.scheduleNotification({
    title: `${vaccineName} Due Tomorrow`,
    body: `Important: ${vaccineName} is due tomorrow!`,
    trigger: oneDayBefore,
    data: {
      type: NotificationType.VACCINE_REMINDER,
      vaccineId,
      screen: 'vaccines',
    },
  }, 'vaccine-reminders');
  reminderIds.push(id3);

  return reminderIds;
}

/**
 * Example: Cancel all reminders for a specific vaccine
 */
export async function cancelVaccineReminders(
  notificationIds: string[]
): Promise<void> {
  for (const id of notificationIds) {
    await notificationService.cancelNotification(id);
  }
}

