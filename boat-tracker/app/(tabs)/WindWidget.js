import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function WindWidget({ lat, lon, apiKey, useDummy = false }) {
  const [wind, setWind] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If using dummy data, set a simple static wind and skip network calls
    if (useDummy) {
      setError(null);
      setLoading(false);
      setWind({
        speed: 5.2,         // m/s
        degFrom: 270,       // coming FROM west
        degTo: (270 + 180) % 360,
      });
      return;
    }

    // require lat/lon and apiKey for real fetch
    if (lat == null || lon == null || !apiKey) {
      console.log('WindWidget: missing lat/lon or apiKey, skipping fetch', { lat, lon, apiKeyPresent: !!apiKey });
      return;
    }

    let mounted = true;
    const fetchWeather = async () => {
      console.log('WindWidget: fetching weather', { lat, lon });
      setLoading(true);
      setError(null);
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!mounted) return;
        if (json && json.wind) {
          // OpenWeather wind.deg is the direction the wind is coming FROM (meteorological).
          // To draw arrow showing where the wind is GOING, add 180deg.
          const fromDeg = json.wind.deg ?? 0;
          const toDeg = (fromDeg + 180) % 360;
          setWind({
            speed: json.wind.speed ?? 0,
            degFrom: fromDeg,
            degTo: toDeg,
          });
        } else {
          setWind(null);
        }
      } catch (e) {
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWeather();

    // optional: refresh every 5 minutes
    const id = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [lat, lon, apiKey]);

  if (!lat || !lon) {
    if (!useDummy) return null;
  }

  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>Wind</Text> */}

      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : wind ? (
        <View style={styles.row}>
          <Text
            style={[
              styles.arrow,
              { transform: [{ rotate: `${wind.degTo}deg` }] },
            ]}
          >
            ↑
          </Text>
          <Text style={styles.speed}>{wind.speed.toFixed(1)} m/s</Text>
        </View>
      ) : (
        <Text style={styles.noData}>No data</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 22,
    marginRight: 8,
  },
  speed: {
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: 'red',
    fontSize: 12,
  },
  noData: {
    fontSize: 12,
  },
});