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

// Simple in-memory cache: Map<key, {ts: number, data: object}>
const CACHE = new Map();
const CACHE_MAX_SIZE = 100; // Limit cache to 100 entries
const DEFAULT_CACHE_TTL_MS = 4 * 60 * 1000; // 4 minutes

function setCacheWithLimit(key, value) {
  if (CACHE.size >= CACHE_MAX_SIZE) {
    // Remove the oldest entry (first inserted)
    const oldestKey = CACHE.keys().next().value;
    if (oldestKey !== undefined) {
      CACHE.delete(oldestKey);
    }
  }
  CACHE.set(key, value);
}

function cacheKey(lat, lon) {
  // round to 4 decimals so tiny GPS jitter doesn't bust cache
  const r = (v) => (Math.round((v ?? 0) * 10000) / 10000).toFixed(4);
  return `${r(lat)}|${r(lon)}`;
}

export default function WindWidget({ lat, lon, apiKey, useDummy = false, cacheTtlMs = DEFAULT_CACHE_TTL_MS }) {
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
        sourcedFromCache: false,
      });
      return;
    }

    // If required inputs are missing, clear state and do nothing (don't show an error)
    if (lat == null || lon == null || !apiKey) {
      setLoading(false);
      setError(null);
      setWind(null);
      return;
    }

    let mounted = true;
    const key = cacheKey(lat, lon);

    // use cached value if fresh
    const cached = CACHE.get(key);
    if (cached && Date.now() - cached.ts < cacheTtlMs) {
      setWind({ ...cached.data, sourcedFromCache: true });
      return;
    }

    let intervalId = null;
    const DEBOUNCE_MS = 2000; // wait 2s for location stabilization
    let debounceTimer = null;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      let prepared = null;
      let json = null;
      // Validate lat/lon before constructing the URL
      const isValidCoord = (v, min, max) => typeof v === 'number' && isFinite(v) && v >= min && v <= max;
      if (!isValidCoord(lat, -90, 90) || !isValidCoord(lon, -180, 180)) {
        setError('Invalid latitude or longitude');
        setLoading(false);
        return;
      }
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const res = await fetch(url);

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) throw new Error('Invalid or unauthorized API key');
          throw new Error(`HTTP ${res.status}`);
        }

        json = await res.json();

        // Validate expected shapes (safe access)
        const windObj = json && typeof json === 'object' ? json.wind : null;
        const mainObj = json && typeof json === 'object' ? json.main : null;
        const weatherArr = Array.isArray(json?.weather) ? json.weather : null;

        if (!windObj || typeof windObj !== 'object' || typeof windObj.speed !== 'number') {
          if (!mainObj && !weatherArr) {
            throw new Error('No usable weather data in response');
          }
        }

        const fromDeg = typeof windObj?.deg === 'number' ? windObj.deg : 0;
        const toDeg = (fromDeg + 180) % 360;

        prepared = {
          speed: typeof windObj?.speed === 'number' ? windObj.speed : null,
          degFrom: fromDeg,
          degTo: toDeg,
          weather: weatherArr && weatherArr.length > 0 ? weatherArr[0] : null,
          temp: typeof mainObj?.temp === 'number' ? mainObj.temp : null,
        };

        if (!mounted) return;
        setWind({ ...prepared, sourcedFromCache: false });
      } catch (e) {
        if (mounted) setError(e.message);
      } finally {
        // Only cache if we got a valid response from the API
        if (json && prepared) {
          setCacheWithLimit(key, { ts: Date.now(), data: prepared });
        }
        if (mounted) setLoading(false);
      }
    };

    // debounce the initial fetch to avoid rapid calls when lat/lon change quickly
    debounceTimer = setTimeout(() => {
      fetchWeather();
      // periodic refresh after initial fetch
      intervalId = setInterval(fetchWeather, cacheTtlMs);
    }, DEBOUNCE_MS);

    return () => {
      mounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [lat, lon, apiKey, useDummy, cacheTtlMs]);

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
            <Text style={[styles.arrow, { transform: [{ rotate: `${wind.degTo ?? 0}deg` }] }]}>↑</Text>
            <Text style={styles.speed}>{typeof wind.speed === 'number' ? wind.speed.toFixed(1) + ' m/s' : '—'}</Text>
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