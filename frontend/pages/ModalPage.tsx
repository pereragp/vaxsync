import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ModalPage() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
      }}>
        <Text style={{ fontSize: 20, fontWeight: '600', color: '#1f2937' }}>Modal</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, borderRadius: 20, backgroundColor: '#f3f4f6' }}>
          <Ionicons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 24 }}>
        <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 24, fontSize: 16 }}>
          This is a modal screen. You can customize it for various purposes like:
        </Text>
        <View style={{ gap: 16 }}>
          <View style={{ backgroundColor: '#eff6ff', padding: 16, borderRadius: 12 }}>
            <Text style={{ color: '#1e40af', fontWeight: '600', marginBottom: 8, fontSize: 16 }}>Add New Vaccine</Text>
            <Text style={{ color: '#2563eb', fontSize: 14 }}>Form to record vaccination details</Text>
          </View>
          <View style={{ backgroundColor: '#f0fdf4', padding: 16, borderRadius: 12 }}>
            <Text style={{ color: '#166534', fontWeight: '600', marginBottom: 8, fontSize: 16 }}>Schedule Appointment</Text>
            <Text style={{ color: '#16a34a', fontSize: 14 }}>Calendar picker and time selection</Text>
          </View>
          <View style={{ backgroundColor: '#faf5ff', padding: 16, borderRadius: 12 }}>
            <Text style={{ color: '#7c3aed', fontWeight: '600', marginBottom: 8, fontSize: 16 }}>Edit Profile</Text>
            <Text style={{ color: '#9333ea', fontSize: 14 }}>User information and preferences</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
