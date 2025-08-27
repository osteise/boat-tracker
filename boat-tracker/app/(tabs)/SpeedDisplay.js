import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SpeedDisplay({ speed }) {
  const thresholdKmh = 0.5; // Minimum speed to display km/h
  const thresholdKnots = 0.5; // Minimum speed to display knots

  // Calculate speeds as numbers, fallback to 0 if invalid
  const speedKmh = typeof speed === 'number' && !isNaN(speed) ? speed * 3.6 : undefined;
  const speedKnots = typeof speed === 'number' && !isNaN(speed) ? speed * 1.94384 : undefined;

  // Display logic with safe fallback
  const displaySpeedKmh =
    speedKmh !== undefined && speedKmh >= thresholdKmh
      ? speedKmh.toFixed(2)
      : speedKmh !== undefined
        ? speedKmh.toFixed(2)
        : '--';

  const displaySpeedKnots =
    speedKnots !== undefined && speedKnots >= thresholdKnots
      ? speedKnots.toFixed(2)
      : speedKnots !== undefined
        ? speedKnots.toFixed(2)
        : '--';

  return (
    <View style={styles.container}>
      <Text style={styles.value}>{displaySpeedKnots} kn</Text>
      <Text style={styles.value}>{displaySpeedKmh} km/h</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  value: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
});
