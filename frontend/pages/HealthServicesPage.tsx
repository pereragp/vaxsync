import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HealthServicesPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health Services</Text>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/doctor-finder')}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="doctor" size={32} color="#175593" />
          </View>
          <Text style={styles.cardTitle}>Find a Doctor</Text>
          <Text style={styles.cardSubtitle}>
            Search for nearby doctors by specialty, availability and Book Appoinments.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/vaccination-center')}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="needle" size={32} color="#175593" />
          </View>
          <Text style={styles.cardTitle}>Find a Vaccination Center</Text>
          <Text style={styles.cardSubtitle}>
            Locate vaccination centers by type and location.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F7', 
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#175593',
    textAlign: 'center',
    marginBottom: 40,
  },
  cardContainer: {
    width: '100%',
    gap: 20, // Increased gap for better spacing
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 15,
    backgroundColor: '#E6F0F8',
    borderRadius: 50,
    padding: 15,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#175593',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
});