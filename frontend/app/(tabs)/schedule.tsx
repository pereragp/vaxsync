import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SchedulePage from '../../pages/SchedulePage';

export default function ScheduleTab() {
  return (
    <View style={styles.container}>
      <SchedulePage />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});