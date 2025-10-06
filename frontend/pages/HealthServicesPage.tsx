import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DoctorFinder from './DoctorFinder';
import VaccinationCenter from './VaccinationCenter';

type ServiceTab = 'doctors' | 'centers';

export default function HealthServicesPage() {
  const [activeTab, setActiveTab] = useState<ServiceTab>('doctors');

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#1e40af', '#3b82f6', '#60a5fa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 pt-4 pb-6"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white text-2xl font-bold">
              Health Services
            </Text>
            <Text className="text-blue-100 text-sm mt-1">
              Find doctors and vaccination centers
            </Text>
          </View>
          <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center">
            <Ionicons name="medical" size={24} color="white" />
          </View>
        </View>

        {/* Segmented Control */}
        <View className="flex-row bg-white/20 backdrop-blur-lg rounded-2xl p-1">
          <TouchableOpacity
            onPress={() => setActiveTab('doctors')}
            className="flex-1"
          >
            {activeTab === 'doctors' ? (
              <LinearGradient
                colors={['#ffffff', '#f0f9ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Ionicons name="people" size={18} color="#1e40af" />
                <Text className="text-blue-700 font-bold ml-2 text-base">
                  Doctors
                </Text>
              </LinearGradient>
            ) : (
              <View className="py-3 items-center flex-row justify-center">
                <Ionicons name="people-outline" size={18} color="rgba(255,255,255,0.7)" />
                <Text className="text-white/70 font-semibold ml-2 text-base">
                  Doctors
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('centers')}
            className="flex-1"
          >
            {activeTab === 'centers' ? (
              <LinearGradient
                colors={['#ffffff', '#f0f9ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Ionicons name="location" size={18} color="#1e40af" />
                <Text className="text-blue-700 font-bold ml-2 text-base">
                  Centers
                </Text>
              </LinearGradient>
            ) : (
              <View className="py-3 items-center flex-row justify-center">
                <Ionicons name="location-outline" size={18} color="rgba(255,255,255,0.7)" />
                <Text className="text-white/70 font-semibold ml-2 text-base">
                  Centers
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content Area */}
      <View className="flex-1">
        {activeTab === 'doctors' ? <DoctorFinder /> : <VaccinationCenter />}
      </View>
    </SafeAreaView>
  );
}