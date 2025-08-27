import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SpeedDisplay({ speed }) {
  // Calculate speeds as numbers, fallback to undefined if invalid
  const speedKmh = typeof speed === 'number' && !isNaN(speed) ? speed * 3.6 : undefined;
  const speedKnots = typeof speed === 'number' && !isNaN(speed) ? speed * 1.94384 : undefined;

  // Threshold below which to show '--' (e.g., 5 km/h)
  const minDisplayKmh = 5;
  const minDisplayKnots = minDisplayKmh * 0.539957; // 1 km/h ≈ 0.539957 knots

  // Display logic: show value if above threshold, otherwise '--'
  const displaySpeedKmh = speedKmh !== undefined && speedKmh >= minDisplayKmh ? speedKmh.toFixed(2) : '--';
  const displaySpeedKnots = speedKnots !== undefined && speedKnots >= minDisplayKnots ? speedKnots.toFixed(2) : '--';

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
