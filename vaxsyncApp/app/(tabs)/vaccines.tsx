import React from 'react';
import { View, Text } from 'react-native';

export default function VaccinesPage() {
  return (
    <View style={{ padding: 24 }}>
      <Text style={{ 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 16, 
        color: '#0F2337' 
      }}>
        Vaccines
      </Text>
      <Text style={{ color: '#6B7280' }}>Your vaccines page content goes here...</Text>
    </View>
  );
}