/**
 * Notification Test Panel
 * 
 * Temporary component for testing vaccine notifications
 * Add this to SchedulePage to test notifications easily
 * 
 * Usage:
 * import NotificationTestPanel from '../components/NotificationTestPanel';
 * 
 * // Inside your render:
 * <NotificationTestPanel schedules={schedules} />
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import notificationService from '../services/notificationService';
import * as VaccineNotifications from '../services/vaccineNotificationService';
import { VaccineSchedule } from '../api/scheduleApi';

interface Props {
  schedules: VaccineSchedule[];
}

export default function NotificationTestPanel({ schedules }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<string>('');

  const testImmediateNotification = async () => {
    try {
      await notificationService.sendLocalNotification(
        'Test Notification',
        'This is a test notification sent immediately!',
        { type: 'test' }
      );
      setStatus('✅ Immediate notification sent!');
    } catch (error: any) {
      setStatus('❌ Error: ' + error.message);
    }
  };

  const testScheduledNotification = async () => {
    try {
      // Schedule for 10 seconds from now
      const id = await notificationService.scheduleNotification({
        title: 'Scheduled Test',
        body: 'This notification was scheduled 10 seconds ago',
        trigger: { seconds: 10 },
        data: { type: 'test' },
      });
      setStatus(`✅ Notification scheduled! ID: ${id.substring(0, 8)}...`);
    } catch (error: any) {
      setStatus('❌ Error: ' + error.message);
    }
  };

  const testOverdueCheck = async () => {
    try {
      await VaccineNotifications.checkOverdueDoses(schedules);
      setStatus('✅ Overdue check completed! Check notifications.');
    } catch (error: any) {
      setStatus('❌ Error: ' + error.message);
    }
  };

  const showScheduledNotifications = async () => {
    try {
      const scheduled = await notificationService.getAllScheduledNotifications();
      const storedIds = await VaccineNotifications.getAllScheduledNotificationIds();
      
      console.log('=== SCHEDULED NOTIFICATIONS ===');
      console.log('Expo Notifications:', scheduled.length);
      console.log('Stored IDs:', JSON.stringify(storedIds, null, 2));
      
      setStatus(`✅ Found ${scheduled.length} scheduled. Check console for details.`);
    } catch (error: any) {
      setStatus('❌ Error: ' + error.message);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await notificationService.cancelAllNotifications();
      setStatus('✅ All notifications cancelled!');
    } catch (error: any) {
      setStatus('❌ Error: ' + error.message);
    }
  };

  const createTestSchedule = async () => {
    if (schedules.length === 0) {
      setStatus('❌ No schedules found. Create one first.');
      return;
    }

    try {
      const testSchedule = schedules[0];
      await VaccineNotifications.scheduleVaccineScheduleNotifications(testSchedule);
      setStatus('✅ Test notifications scheduled for first schedule!');
    } catch (error: any) {
      setStatus('❌ Error: ' + error.message);
    }
  };

  if (!isExpanded) {
    return (
      <TouchableOpacity
        style={styles.collapsedButton}
        onPress={() => setIsExpanded(true)}
      >
        <Ionicons name="flask" size={20} color="white" />
        <Text style={styles.collapsedText}>Test Notifications</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="flask" size={24} color="#3b82f6" />
          <Text style={styles.title}>Notification Test Panel</Text>
        </View>
        <TouchableOpacity onPress={() => setIsExpanded(false)}>
          <Ionicons name="close-circle" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {status ? (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Quick Tests</Text>

        <TouchableOpacity
          style={[styles.button, styles.buttonBlue]}
          onPress={testImmediateNotification}
        >
          <Ionicons name="flash" size={18} color="white" />
          <Text style={styles.buttonText}>Send Immediate Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonPurple]}
          onPress={testScheduledNotification}
        >
          <Ionicons name="timer" size={18} color="white" />
          <Text style={styles.buttonText}>Schedule Notification (10s)</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Vaccine Notifications</Text>

        <TouchableOpacity
          style={[styles.button, styles.buttonGreen]}
          onPress={createTestSchedule}
        >
          <Ionicons name="calendar" size={18} color="white" />
          <Text style={styles.buttonText}>Schedule First Vaccine</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonOrange]}
          onPress={testOverdueCheck}
        >
          <Ionicons name="warning" size={18} color="white" />
          <Text style={styles.buttonText}>Check Overdue Doses</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Debug</Text>

        <TouchableOpacity
          style={[styles.button, styles.buttonGray]}
          onPress={showScheduledNotifications}
        >
          <Ionicons name="list" size={18} color="white" />
          <Text style={styles.buttonText}>Show Scheduled (Console)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonRed]}
          onPress={cancelAllNotifications}
        >
          <Ionicons name="trash" size={18} color="white" />
          <Text style={styles.buttonText}>Cancel All Notifications</Text>
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            💡 Tip: Check your console logs for detailed information
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  collapsedButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  collapsedText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    maxHeight: 500,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
  },
  statusContainer: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#1f2937',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonBlue: {
    backgroundColor: '#3b82f6',
  },
  buttonPurple: {
    backgroundColor: '#8b5cf6',
  },
  buttonGreen: {
    backgroundColor: '#10b981',
  },
  buttonOrange: {
    backgroundColor: '#f59e0b',
  },
  buttonGray: {
    backgroundColor: '#6b7280',
  },
  buttonRed: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  info: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#3b82f6',
  },
});

