import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

export default function WindWidget({ lat, lon, apiKey, useDummy = false }) {
  const [wind, setWind] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // enable LayoutAnimation on Android
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    // If using dummy data, set a simple static wind and skip network calls
    if (useDummy) {
      setError(null);
      setLoading(false);
      setWind({
        speed: 5.2, // m/s
        degFrom: 270, // coming FROM west
        degTo: (270 + 180) % 360,
        // added weather + temp for dummy
        weather: { main: 'Clear', description: 'clear sky', icon: '01d' },
        temp: 12.3,
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
        if (json) {
          const fromDeg = json.wind?.deg ?? 0;
          const toDeg = (fromDeg + 180) % 360;
          setWind({
            speed: json.wind?.speed ?? 0,
            degFrom: fromDeg,
            degTo: toDeg,
            // new fields from OpenWeather response
            weather: Array.isArray(json.weather) && json.weather.length > 0 ? json.weather[0] : null,
            temp: json.main?.temp ?? null,
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
  }, [lat, lon, apiKey, useDummy]);

  if (!lat || !lon) {
    if (!useDummy) return null;
  }

  const onToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((s) => !s);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onToggle}
      style={[styles.container, expanded ? styles.containerExpanded : null]}
    >
      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : wind ? (
        <View style={styles.wrap}>
          <View style={styles.row}>
            <Text style={[styles.arrow, { transform: [{ rotate: `${wind.degTo}deg` }] }]}>↑</Text>
            <Text style={styles.speed}>{wind.speed.toFixed(1)} m/s</Text>
            <Text style={styles.chev}>{expanded ? '▼' : '▲'}</Text>
          </View>

          {/* weather + temp - only visible when expanded */}
          {expanded && (wind.weather || typeof wind.temp === 'number') ? (
            <View style={styles.weatherRow}>
              {wind.weather?.icon ? (
                <Image
                  source={{ uri: `https://openweathermap.org/img/wn/${wind.weather.icon}@2x.png` }}
                  style={styles.icon}
                />
              ) : null}
              <View>
                {typeof wind.temp === 'number' ? (
                  <Text style={styles.temp}>{wind.temp.toFixed(1)}°C</Text>
                ) : null}
                {wind.weather?.description ? (
                  <Text style={styles.description}>{wind.weather.description}</Text>
                ) : wind.weather?.main ? (
                  <Text style={styles.description}>{wind.weather.main}</Text>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      ) : (
        <Text style={styles.noData}>No data</Text>
      )}
    </TouchableOpacity>
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
  containerExpanded: {
    alignItems: 'flex-start',
  },
  wrap: {
    alignItems: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chev: {
    marginLeft: 8,
    fontSize: 12,
    color: '#444',
  },
  arrow: {
    fontSize: 22,
    marginRight: 8,
  },
  speed: {
    fontSize: 14,
    fontWeight: '600',
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  icon: {
    width: 44,
    height: 44,
    marginRight: 8,
  },
  temp: {
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    fontSize: 12,
    color: '#333',
  },
  error: {
    color: 'red',
    fontSize: 12,
  },
  noData: {
    fontSize: 12,
  },
});