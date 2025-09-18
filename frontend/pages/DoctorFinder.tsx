import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DoctorFinder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find a Doctor</Text>
      <Text style={styles.subtitle}>
        Search for nearby doctors by specialty, availability, and location.
      </Text>
      {/* TODO: Add search bar + doctor list here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#175593' },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#555' },
});
