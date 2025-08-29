import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SpeedDisplay from './SpeedDisplay';
import WindWidget from './WindWidget';
import Compass from './Compass';

import Constants from 'expo-constants';

export default function HomeScreen() {
  const [location, setLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [followBoat, setFollowBoat] = useState(true);
  const mapRef = useRef(null);

  // Put your OpenWeather API key here (do NOT commit). Better: load from env/config.
  const OPENWEATHER_API_KEY = Constants.expoConfig?.extra?.OPENWEATHER_API_KEY ?? '';
  // console.log(Constants.expoConfig?.extra?.OPENWEATHER_API_KEY ? 'OPENWEATHER key loaded' : 'OPENWEATHER key MISSING');

  // save current zoom/region delta to preserve it when following 
  const [regionDelta, setRegionDelta] = useState({
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // refs to hold latest values of watch-position callback without restarting subscription
  const followRef = useRef(followBoat);
  const regionDeltaRef = useRef(regionDelta);

  useEffect(() => {
    followRef.current = followBoat;
  }, [followBoat]);

  useEffect(() => {
    regionDeltaRef.current = regionDelta;
  }, [regionDelta]);

  useEffect(() => {
    let subscription = null;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (pos) => {
          const coords = pos.coords;
          setLocation(coords);

          setRoute((prev) => [
            ...prev,
            { latitude: coords.latitude, longitude: coords.longitude },
          ]);

          // follow boat if toggled on — use latest saved delta via ref
          if (followRef.current && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: coords.latitude,
              longitude: coords.longitude,
              latitudeDelta: regionDeltaRef.current.latitudeDelta ?? 0.01,
              longitudeDelta: regionDeltaRef.current.longitudeDelta ?? 0.01,
            });
          }
        }
      );
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 58.3903,
          longitude: 13.8455,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        // update regionDelta when user zooms/pans
        onRegionChangeComplete={(region) =>
          setRegionDelta({
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta,
          })
        }
        // turn follow off when user manually pans the map
        onPanDrag={() => {
          if (followRef.current) {
            setFollowBoat(false);
          }
        }}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="You"
          />
        )}

        {route.length > 1 && (
          <Polyline
            coordinates={route}
            strokeColor="#0000FF"
            strokeWidth={4}
          <WindWidget
            lat={location.latitude}
          />
        )}

      {/* Speed overlay */}
          <SpeedDisplay speed={location.speed} />
        </View>
        <Compass />
      </View>

      {/* Floating button: only visible when follow if OFF */}
      {!followBoat && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (location && mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: regionDeltaRef.current.latitudeDelta ?? 0.01,
                longitudeDelta: regionDeltaRef.current.longitudeDelta ?? 0.01,
              });
            }
            setFollowBoat(true);
          }}
        >
          {/* <Text style={styles.fabText}>📍 Follow</Text> */}
          <Icon name="my-location" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  fabText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  speedOverlay: {
    position: 'absolute',
    top: 40,
    left: 24,
    zIndex: 10,
  },
  widgetBar: {
    position: 'absolute',
    top: 40, // or bottom: 40 for bottom placement
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.4)', 
    borderRadius: 12,
  },
});
