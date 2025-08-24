import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={{ 
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 20,
      backgroundColor: '#fff'
    }}>
      <Text style={{ 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 16,
        color: '#0F2337'
      }}>
        Page Not Found
      </Text>
      <Text style={{ 
        fontSize: 16, 
        textAlign: 'center', 
        marginBottom: 24,
        color: '#6B7280'
      }}>
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          backgroundColor: '#175593',
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 8
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
          Go Back
        </Text>
      </TouchableOpacity>
    </View>
  );
}
