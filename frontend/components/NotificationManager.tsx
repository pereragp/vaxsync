import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet } from 'react-native';
import { useNotifications } from '../hooks/useNotifications';
import notificationService from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationSettings } from '../types/notifications';

const SETTINGS_KEY = 'notification_settings';

const defaultSettings: NotificationSettings = {
  enabled: true,
  vaccineReminders: true,
  appointmentReminders: true,
  healthAlerts: true,
  scheduleUpdates: true,
  dependentReminders: true,
  soundEnabled: true,
  vibrationEnabled: true,
  badgeEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  reminderLeadTime: 24, // 24 hours before
};

export function NotificationManager() {
  const {
    expoPushToken,
    registerForPushNotifications,
    sendLocalNotification,
    scheduleNotification,
    cancelAllNotifications,
  } = useNotifications();

  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    loadSettings();
    updateScheduledCount();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const updateScheduledCount = async () => {
    const scheduled = await notificationService.getAllScheduledNotifications();
    setScheduledCount(scheduled.length);
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const handleTestNotification = async () => {
    await sendLocalNotification(
      'Test Notification',
      'This is a test notification from VaxSync!',
      { type: 'test' }
    );
  };

  const handleCancelAll = async () => {
    await cancelAllNotifications();
    await updateScheduledCount();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Notification Settings</Text>
        
        {expoPushToken && (
          <View style={styles.tokenContainer}>
            <Text style={styles.label}>Push Token (for backend):</Text>
            <Text style={styles.token} numberOfLines={1} ellipsizeMode="middle">
              {expoPushToken}
            </Text>
          </View>
        )}

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Enable Notifications</Text>
          <Switch
            value={settings.enabled}
            onValueChange={() => toggleSetting('enabled')}
          />
        </View>

        <Text style={styles.subtitle}>Notification Types</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Vaccine Reminders</Text>
          <Switch
            value={settings.vaccineReminders}
            onValueChange={() => toggleSetting('vaccineReminders')}
            disabled={!settings.enabled}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Appointment Reminders</Text>
          <Switch
            value={settings.appointmentReminders}
            onValueChange={() => toggleSetting('appointmentReminders')}
            disabled={!settings.enabled}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Health Alerts</Text>
          <Switch
            value={settings.healthAlerts}
            onValueChange={() => toggleSetting('healthAlerts')}
            disabled={!settings.enabled}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Schedule Updates</Text>
          <Switch
            value={settings.scheduleUpdates}
            onValueChange={() => toggleSetting('scheduleUpdates')}
            disabled={!settings.enabled}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Dependent Reminders</Text>
          <Switch
            value={settings.dependentReminders}
            onValueChange={() => toggleSetting('dependentReminders')}
            disabled={!settings.enabled}
          />
        </View>

        <Text style={styles.subtitle}>Preferences</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Sound</Text>
          <Switch
            value={settings.soundEnabled}
            onValueChange={() => toggleSetting('soundEnabled')}
            disabled={!settings.enabled}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Vibration</Text>
          <Switch
            value={settings.vibrationEnabled}
            onValueChange={() => toggleSetting('vibrationEnabled')}
            disabled={!settings.enabled}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Badge Count</Text>
          <Switch
            value={settings.badgeEnabled}
            onValueChange={() => toggleSetting('badgeEnabled')}
            disabled={!settings.enabled}
          />
        </View>

        <Text style={styles.subtitle}>Actions</Text>

        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>Scheduled Notifications: {scheduledCount}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleTestNotification}>
          <Text style={styles.buttonText}>Send Test Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleCancelAll}
        >
          <Text style={styles.buttonText}>Cancel All Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            registerForPushNotifications();
            updateScheduledCount();
          }}
        >
          <Text style={styles.buttonText}>Refresh Token</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#555',
  },
  tokenContainer: {
    backgroundColor: '#e8e8e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  token: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  statsText: {
    fontSize: 16,
    color: '#333',
  },
});

