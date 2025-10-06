import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (token) {
        // User is logged in, redirect to schedule
        router.replace('/schedule');
      } else {
        // No token found, redirect to login
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      // On error, redirect to login for safety
      router.replace('/login');
    } finally {
      setIsChecking(false);
    }
  };

  // Show loading indicator while checking authentication
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#f8fafc'
    }}>
      <ActivityIndicator size="large" color="#1e40af" />
    </View>
  );
}