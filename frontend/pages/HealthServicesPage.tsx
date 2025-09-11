import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

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
          <Text style={styles.cardTitle}>Find a Doctor</Text>
          <Text style={styles.cardSubtitle}>
            Search for nearby doctors by specialty and availability.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/vaccination-center')}
        >
          <Text style={styles.cardTitle}>Find a Vaccination Center</Text>
          <Text style={styles.cardSubtitle}>
            Locate vaccination centers by type, date, and location.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 24 },
  cardContainer: { width: '100%', gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6, color: '#175593' },
  cardSubtitle: { fontSize: 14, color: '#555' },
});
