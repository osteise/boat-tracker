import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Magnetometer } from 'expo-sensors';

export default function Compass() {
  const [heading, setHeading] = useState(0);
  const [subscription, setSubscription] = useState(null);
  const rotateAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const sub = Magnetometer.addListener((data) => {
      let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
      angle = angle >= 0 ? angle : 360 + angle;
      setHeading(angle);
      rotateAnim.setValue(angle);
    });
    setSubscription(sub);
    return () => {
      sub && sub.remove();
      setSubscription(null);
    };
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.northText}>N</Text>
      <Animated.View style={[styles.arrow, { transform: [{ rotate: rotation }] }]}> 
        <Text style={styles.arrowText}>↑</Text>
      </Animated.View>
      <Text style={styles.headingText}>{heading.toFixed(0)}°</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    minWidth: 44,
  },
  arrow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  arrowText: {
    fontSize: 22,
    color: '#fff',
  },
  headingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  northText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 2,
  },
});
