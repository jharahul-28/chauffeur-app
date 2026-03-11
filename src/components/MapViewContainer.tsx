import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  // Future imports (uncomment as features are added):
  // Polyline,
  // LatLng,
} from 'react-native-maps';
import { DriverLocation } from '../services/locationService';
import { darkMapStyle } from '../utils/mapStyles';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Coordinate {
  latitude: number;
  longitude: number;
}

interface MapViewContainerProps {
  driverLocation: DriverLocation | null;
  // ── Future props (wire up when feature is ready) ──
  // pickupLocation?: Coordinate;
  // dropLocation?: Coordinate;
  // routeCoordinates?: Coordinate[];
  // showNavigation?: boolean;
  // onMapReady?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_REGION = {
  latitude: 19.076,  // fallback: Mumbai
  longitude: 72.8777,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const ANIMATE_DURATION_MS = 500;

// ─── Component ────────────────────────────────────────────────────────────────

const MapViewContainer: React.FC<MapViewContainerProps> = ({
  driverLocation,
  // pickupLocation,
  // dropLocation,
  // routeCoordinates,
}) => {
  const mapRef = useRef<MapView>(null);

  // Smoothly re-centre map whenever driver moves
  useEffect(() => {
    if (!driverLocation || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      ANIMATE_DURATION_MS
    );
  }, [driverLocation]);

  const initialRegion = driverLocation
    ? {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : DEFAULT_REGION;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        // Android → Google Maps (supports dark custom style + navigation APIs)
        // iOS    → Apple Maps (respects device dark/light mode automatically)
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        customMapStyle={Platform.OS === 'android' ? darkMapStyle : undefined}
        showsUserLocation={false}   // we render our own driver marker
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        rotateEnabled
        scrollEnabled
        zoomEnabled
        pitchEnabled={false}
      >
        {/* ── Driver marker ─────────────────────────────────────────────── */}
        {driverLocation && (
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            title="Your Location"
          >
            <View style={styles.driverMarkerOuter}>
              <View style={styles.driverMarkerInner} />
            </View>
          </Marker>
        )}

        {/* ── Future: Pickup marker ──────────────────────────────────────
        {pickupLocation && (
          <Marker coordinate={pickupLocation} pinColor="green" title="Pickup" />
        )}
        ────────────────────────────────────────────────────────────────── */}

        {/* ── Future: Drop marker ────────────────────────────────────────
        {dropLocation && (
          <Marker coordinate={dropLocation} pinColor="red" title="Drop" />
        )}
        ────────────────────────────────────────────────────────────────── */}

        {/* ── Future: Route polyline ─────────────────────────────────────
        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#FFC107"
            strokeWidth={4}
          />
        )}
        ────────────────────────────────────────────────────────────────── */}
      </MapView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  driverMarkerOuter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 193, 7, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverMarkerInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFC107',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});

export default MapViewContainer;
