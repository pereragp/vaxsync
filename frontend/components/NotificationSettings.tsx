import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const NOTIFICATION_SETTINGS_KEY = 'vaxsync_notification_settings';

export interface NotificationSettingsData {
  enabled: boolean;
  vaccineReminders: boolean;
  scheduleUpdates: boolean;
  overdueAlerts: boolean;
  soundEnabled: boolean;
}

const defaultSettings: NotificationSettingsData = {
  enabled: true,
  vaccineReminders: true,
  scheduleUpdates: true,
  overdueAlerts: true,
  soundEnabled: true,
};

interface NotificationSettingsProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationSettings({
  visible,
  onClose,
}: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettingsData>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettingsData) => {
    try {
      setSaving(true);
      await AsyncStorage.setItem(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(newSettings)
      );
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key: keyof NotificationSettingsData) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="notifications" size={24} color="white" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Notification Settings</Text>
                  <Text style={styles.headerSubtitle}>
                    Manage your notification preferences
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading settings...</Text>
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Master Toggle */}
              <View style={styles.section}>
                <View style={styles.masterToggleCard}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingLeft}>
                      <Ionicons
                        name={settings.enabled ? 'notifications' : 'notifications-off'}
                        size={24}
                        color={settings.enabled ? '#3b82f6' : '#9ca3af'}
                      />
                      <View style={styles.settingTextContainer}>
                        <Text style={[styles.settingTitle, !settings.enabled && styles.disabledText]}>
                          Enable Notifications
                        </Text>
                        <Text style={styles.settingDescription}>
                          {settings.enabled
                            ? 'All notifications are active'
                            : 'All notifications are paused'}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={settings.enabled}
                      onValueChange={() => toggleSetting('enabled')}
                      trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                      thumbColor={settings.enabled ? '#3b82f6' : '#9ca3af'}
                    />
                  </View>
                </View>
              </View>

              {/* Notification Types */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, !settings.enabled && styles.disabledText]}>
                  Notification Types
                </Text>

                <View style={styles.settingsCard}>
                  <View style={[styles.settingRow, styles.settingRowBorder]}>
                    <View style={styles.settingLeft}>
                      <Ionicons
                        name="medical"
                        size={20}
                        color={settings.enabled && settings.vaccineReminders ? '#10b981' : '#9ca3af'}
                      />
                      <View style={styles.settingTextContainer}>
                        <Text style={[styles.settingLabel, !settings.enabled && styles.disabledText]}>
                          Vaccine Reminders
                        </Text>
                        <Text style={[styles.settingSmallText, !settings.enabled && styles.disabledText]}>
                          3 days, 2 days, 1 day before
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={settings.vaccineReminders}
                      onValueChange={() => toggleSetting('vaccineReminders')}
                      disabled={!settings.enabled}
                      trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                      thumbColor={settings.vaccineReminders ? '#3b82f6' : '#9ca3af'}
                    />
                  </View>

                  <View style={[styles.settingRow, styles.settingRowBorder]}>
                    <View style={styles.settingLeft}>
                      <Ionicons
                        name="calendar"
                        size={20}
                        color={settings.enabled && settings.scheduleUpdates ? '#3b82f6' : '#9ca3af'}
                      />
                      <View style={styles.settingTextContainer}>
                        <Text style={[styles.settingLabel, !settings.enabled && styles.disabledText]}>
                          Schedule Updates
                        </Text>
                        <Text style={[styles.settingSmallText, !settings.enabled && styles.disabledText]}>
                          When schedules are created or modified
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={settings.scheduleUpdates}
                      onValueChange={() => toggleSetting('scheduleUpdates')}
                      disabled={!settings.enabled}
                      trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                      thumbColor={settings.scheduleUpdates ? '#3b82f6' : '#9ca3af'}
                    />
                  </View>

                  <View style={styles.settingRow}>
                    <View style={styles.settingLeft}>
                      <Ionicons
                        name="warning"
                        size={20}
                        color={settings.enabled && settings.overdueAlerts ? '#ef4444' : '#9ca3af'}
                      />
                      <View style={styles.settingTextContainer}>
                        <Text style={[styles.settingLabel, !settings.enabled && styles.disabledText]}>
                          Overdue Alerts
                        </Text>
                        <Text style={[styles.settingSmallText, !settings.enabled && styles.disabledText]}>
                          For missed vaccinations
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={settings.overdueAlerts}
                      onValueChange={() => toggleSetting('overdueAlerts')}
                      disabled={!settings.enabled}
                      trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                      thumbColor={settings.overdueAlerts ? '#3b82f6' : '#9ca3af'}
                    />
                  </View>
                </View>
              </View>

              {/* Notification Preferences */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, !settings.enabled && styles.disabledText]}>
                  Preferences
                </Text>

                <View style={styles.settingsCard}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingLeft}>
                      <Ionicons
                        name="volume-high"
                        size={20}
                        color={settings.enabled && settings.soundEnabled ? '#8b5cf6' : '#9ca3af'}
                      />
                      <View style={styles.settingTextContainer}>
                        <Text style={[styles.settingLabel, !settings.enabled && styles.disabledText]}>
                          Sound
                        </Text>
                        <Text style={[styles.settingSmallText, !settings.enabled && styles.disabledText]}>
                          Play sound for notifications
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={settings.soundEnabled}
                      onValueChange={() => toggleSetting('soundEnabled')}
                      disabled={!settings.enabled}
                      trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                      thumbColor={settings.soundEnabled ? '#3b82f6' : '#9ca3af'}
                    />
                  </View>
                </View>
              </View>

              {/* Info Card */}
              <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                <Text style={styles.infoText}>
                  Turning off notifications will prevent all vaccination reminders.
                  You can always turn them back on anytime.
                </Text>
              </View>

              {/* Save Status */}
              {saving && (
                <View style={styles.savingIndicator}>
                  <ActivityIndicator size="small" color="#10b981" />
                  <Text style={styles.savingText}>Saving...</Text>
                </View>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    overflow: 'hidden',
  },
  header: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  masterToggleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  settingSmallText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  disabledText: {
    color: '#9ca3af',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    marginLeft: 10,
    lineHeight: 18,
  },
  savingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    marginTop: 12,
  },
  savingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#065f46',
    fontWeight: '500',
  },
});

// Export function to get current settings
export async function getNotificationSettings(): Promise<NotificationSettingsData> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return defaultSettings;
  }
}

