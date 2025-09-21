import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import VaccinesPage from '../../pages/VaccinesPage';

export default function VaccinesTab() {
  return (
    <View style={styles.container}>
      <VaccinesPage />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});