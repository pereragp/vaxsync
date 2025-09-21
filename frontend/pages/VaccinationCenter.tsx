import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function VaccinationCenter() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find a Vaccination Center</Text>
      <Text style={styles.subtitle}>
        Choose your vaccination type, date, and location to see nearby centers.
      </Text>
      {/* TODO: Add filters + map/list here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#175593' },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#555' },
});
