import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SpeedDisplay({ speed }) {
  const thresholdKmh = 0.5; // Minimum speed to display km/h
  const speedKmh = speed != null && !isNaN(speed) ? (speed * 3.6).toFixed(2) : 'N/A';
  const displaySpeedKmh = speedKmh >= thresholdKmh ? speedKmh.toFixed(2) : '0.00';
  // speed is in m/s, convert to knots (1 m/s = 1.94384 knots)
  const thresholdKnots = 0.5; // Minimum speed to display knots
  const speedKnots = speed != null && !isNaN(speed) ? (speed * 1.94384).toFixed(2) : 'N/A';
  const displaySpeedKnots = speedKnots >= thresholdKnots ? speedKnots.toFixed(2) : '0.00';

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
