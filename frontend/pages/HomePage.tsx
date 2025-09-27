import React from 'react';
import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomePage() {
  const router = useRouter();
  return (
    <View style={{ padding: 24 }}>
      <Text style={{ 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 16, 
        color: '#0F2337' 
      }}>
        Welcome Home
      </Text>
      <Button title='Go to Login'
      onPress={()=>router.push('/login')}
      />
    </View>
  );
}
