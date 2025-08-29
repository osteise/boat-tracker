import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SpeedDisplay({ speed }) {
  // 1 km/h ≈ 0.539957 knots
  const KMH_TO_KNOTS = 0.539957;
  const MS_TO_KNOTS = 1.94384;
  // Calculate speeds as numbers, fallback to undefined if invalid
  const speedKmh = typeof speed === 'number' && !isNaN(speed) ? speed * 3.6 : undefined;
  const speedKnots = typeof speed === 'number' && !isNaN(speed) ? speed * MS_TO_KNOTS : undefined;

  // Threshold below which to show '--' (e.g., 5 km/h)
  const minDisplayKmh = 5;
  const minDisplayKnots = minDisplayKmh * KMH_TO_KNOTS; 

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
