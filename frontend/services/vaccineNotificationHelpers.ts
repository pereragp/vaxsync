/**
 * Helper functions for sending instant notification updates
 */

import notificationService from './notificationService';
import { getNotificationSettings } from '../components/NotificationSettings';
import { VaccineSchedule } from '../api/scheduleApi';
import { NotificationType } from '../types/notifications';

/**
 * Send notification when a schedule is created
 */
export async function sendScheduleCreatedNotification(
  schedule: VaccineSchedule,
  dependentName?: string
): Promise<void> {
  try {
    // Check if notifications are enabled
    const settings = await getNotificationSettings();
    if (!settings.enabled || !settings.scheduleUpdates) {
      console.log('⏸️  Schedule update notifications are disabled');
      return;
    }

    const baseTitle = dependentName
      ? `${dependentName}'s Vaccination Schedule`
      : 'Vaccination Schedule';

    const totalDoses = schedule.totalDoses;
    const firstDoseDate = new Date(schedule.doses[0]?.dateScheduled).toLocaleDateString();

    await notificationService.sendLocalNotification(
      `${baseTitle} Created`,
      `New schedule for ${schedule.vaccineName} created with ${totalDoses} dose${totalDoses > 1 ? 's' : ''}. First dose: ${firstDoseDate}`,
      {
        type: NotificationType.SCHEDULE_UPDATE,
        screen: 'schedule',
        scheduleId: schedule._id,
        vaccineName: schedule.vaccineName,
        updateType: 'created',
      },
      'default'
    );

    console.log('✅ Schedule created notification sent');
  } catch (error) {
    console.error('Error sending schedule created notification:', error);
  }
}

/**
 * Send notification when a schedule is updated
 */
export async function sendScheduleUpdatedNotification(
  schedule: VaccineSchedule,
  dependentName?: string
): Promise<void> {
  try {
    // Check if notifications are enabled
    const settings = await getNotificationSettings();
    if (!settings.enabled || !settings.scheduleUpdates) {
      console.log('⏸️  Schedule update notifications are disabled');
      return;
    }

    const baseTitle = dependentName
      ? `${dependentName}'s Vaccination Schedule`
      : 'Vaccination Schedule';

    await notificationService.sendLocalNotification(
      `${baseTitle} Updated`,
      `Your ${schedule.vaccineName} schedule has been updated. Check the new dates.`,
      {
        type: NotificationType.SCHEDULE_UPDATE,
        screen: 'schedule',
        scheduleId: schedule._id,
        vaccineName: schedule.vaccineName,
        updateType: 'updated',
      },
      'default'
    );

    console.log('✅ Schedule updated notification sent');
  } catch (error) {
    console.error('Error sending schedule updated notification:', error);
  }
}

/**
 * Send notification when a schedule is deleted/cancelled
 */
export async function sendScheduleCancelledNotification(
  vaccineName: string,
  dependentName?: string
): Promise<void> {
  try {
    // Check if notifications are enabled
    const settings = await getNotificationSettings();
    if (!settings.enabled || !settings.scheduleUpdates) {
      console.log('⏸️  Schedule update notifications are disabled');
      return;
    }

    const baseTitle = dependentName
      ? `${dependentName}'s Vaccination Schedule`
      : 'Vaccination Schedule';

    await notificationService.sendLocalNotification(
      `${baseTitle} Cancelled`,
      `Your ${vaccineName} schedule has been cancelled.`,
      {
        type: NotificationType.SCHEDULE_UPDATE,
        screen: 'schedule',
        vaccineName,
        updateType: 'cancelled',
      },
      'default'
    );

    console.log('✅ Schedule cancelled notification sent');
  } catch (error) {
    console.error('Error sending schedule cancelled notification:', error);
  }
}

/**
 * Send notification when a dose is completed
 */
export async function sendDoseCompletedNotification(
  schedule: VaccineSchedule,
  doseNumber: number,
  dependentName?: string
): Promise<void> {
  try {
    // Check if notifications are enabled
    const settings = await getNotificationSettings();
    if (!settings.enabled || !settings.scheduleUpdates) {
      console.log('⏸️  Schedule update notifications are disabled');
      return;
    }

    const baseTitle = dependentName
      ? `${dependentName}'s ${schedule.vaccineName}`
      : schedule.vaccineName;

    const doseInfo = schedule.totalDoses > 1
      ? ` (Dose ${doseNumber}/${schedule.totalDoses})`
      : '';

    const remainingDoses = schedule.doses.filter(
      d => d.status === 'scheduled' && d.doseNumber > doseNumber
    ).length;

    let message: string;
    if (remainingDoses === 0) {
      message = `All doses completed! Your vaccination schedule is complete. 🎉`;
    } else if (remainingDoses === 1) {
      message = `Great! You have 1 more dose remaining in your schedule.`;
    } else {
      message = `Great! You have ${remainingDoses} more doses remaining in your schedule.`;
    }

    await notificationService.sendLocalNotification(
      `${baseTitle} Completed${doseInfo}`,
      message,
      {
        type: NotificationType.SCHEDULE_UPDATE,
        screen: 'schedule',
        scheduleId: schedule._id,
        vaccineName: schedule.vaccineName,
        doseNumber,
        updateType: 'dose_completed',
      },
      'default'
    );

    console.log('✅ Dose completed notification sent');
  } catch (error) {
    console.error('Error sending dose completed notification:', error);
  }
}

