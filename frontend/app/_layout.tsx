import "../global.css";
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, LogBox } from 'react-native';
import { useEffect } from 'react';
import { Colors } from '../constants/Colors';
import { useNotifications } from '../hooks/useNotifications';

// Suppress Expo Go notification warnings (these don't affect functionality)
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'expo-notifications functionality is not fully supported',
  'reading dataString is deprecated',
  'shouldShowAlert is deprecated',
]);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { registerForPushNotifications, expoPushToken } = useNotifications();

  useEffect(() => {
    // Register for push notifications when app starts
    registerForPushNotifications();
  }, []);

  useEffect(() => {
    if (expoPushToken) {
      console.log('Expo Push Token:', expoPushToken);
      // TODO: Send this token to your backend server
      // Example: await sendTokenToBackend(expoPushToken);
    }
  }, [expoPushToken]);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            title: 'Modal',
          }}
        />
      </Stack>
    </>
  );
}
