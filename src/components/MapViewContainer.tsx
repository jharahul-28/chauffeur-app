import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { DriverLocation } from '../services/locationService';
import { darkMapStyle } from '../utils/mapStyles';
import DrivingRoute, { RouteInfo } from './DrivingRoute';
import { MAP_FIT_PADDING } from '../utils/mapUtils';
import { RoutePoints } from '../utils/waypointUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Map rendering modes:
 *
 *   'pickup'      — driver en-route to customer. Routes: driver → pickup only.
 *                   Stops and destination are NOT shown (irrelevant noise).
 *
 *   'trip'        — customer is in the car. Routes: driver → stops → destination.
 *                   Pickup marker is hidden (already visited).
 *
 *   undefined     — idle/offline state. Auto-follows driver position.
 */
export type MapMode = 'pickup' | 'trip';

interface MapViewContainerProps {
  driverLocation: DriverLocation | null;
  /**
   * Structured route extracted from booking waypoints.
   * Required for both pickup and trip modes.
   */
  routePoints?: RoutePoints;
  /** Switches between routing modes. Omit for idle state. */
  mode?: MapMode;
  /** Called whenever the Directions API returns an updated route. */
  onRouteUpdate?: (info: RouteInfo) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidCoord(c: Coordinate | null | undefined): c is Coordinate {
  return (
    c != null &&
    typeof c.latitude === 'number' &&
    typeof c.longitude === 'number' &&
    isFinite(c.latitude) &&
    isFinite(c.longitude) &&
    !(c.latitude === 0 && c.longitude === 0)
  );
}

function driverCoord(loc: DriverLocation): Coordinate {
  return { latitude: loc.latitude, longitude: loc.longitude };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_REGION = {
  latitude: 19.076,
  longitude: 72.8777,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const ANIMATE_DURATION_MS = 500;
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

// ─── Component ────────────────────────────────────────────────────────────────

const MapViewContainer: React.FC<MapViewContainerProps> = ({
  driverLocation,
  routePoints,
  mode,
  onRouteUpdate,
}) => {
  const mapRef = useRef<MapView>(null);
  const hasFittedRef = useRef(false);

  const isPickupMode = mode === 'pickup';
  const isTripMode = mode === 'trip';

  const pickup = routePoints?.pickup ?? null;
  const stops = routePoints?.stops ?? [];
  const destination = routePoints?.destination ?? null;

  // ── Fit map whenever mode or key coordinates change ───────────────────────
  useEffect(() => {
    if (!driverLocation || !mapRef.current || hasFittedRef.current) return;

    if (isPickupMode && isValidCoord(pickup)) {
      mapRef.current.fitToCoordinates(
        [driverCoord(driverLocation), { latitude: pickup.latitude, longitude: pickup.longitude }],
        { edgePadding: MAP_FIT_PADDING, animated: true },
      );
      hasFittedRef.current = true;
    }

    if (isTripMode && isValidCoord(destination)) {
      const points: Coordinate[] = [
        driverCoord(driverLocation),
        ...stops.filter(isValidCoord).map((s) => ({ latitude: s.latitude, longitude: s.longitude })),
        { latitude: destination.latitude, longitude: destination.longitude },
      ];
      mapRef.current.fitToCoordinates(points, {
        edgePadding: { ...MAP_FIT_PADDING, bottom: 340 },
        animated: true,
      });
      hasFittedRef.current = true;
    }
  }, [driverLocation, isPickupMode, isTripMode, pickup, destination, stops]);

  // Reset fit flag when the route changes (new ride or mode switch)
  useEffect(() => {
    hasFittedRef.current = false;
  }, [mode, routePoints]);

  // ── Auto-follow driver in idle mode ──────────────────────────────────────
  useEffect(() => {
    if (!driverLocation || !mapRef.current || mode) return;
    mapRef.current.animateToRegion(
      {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      ANIMATE_DURATION_MS,
    );
  }, [driverLocation, mode]);

  const initialRegion = driverLocation
    ? { ...driverCoord(driverLocation), latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : DEFAULT_REGION;

  // Routing: pickup mode → driver to pickup; trip mode → driver to destination via stops
  const routeOrigin = driverLocation ? driverCoord(driverLocation) : null;
  const routeDest = isPickupMode
    ? (isValidCoord(pickup) ? { latitude: pickup.latitude, longitude: pickup.longitude } : null)
    : isTripMode
    ? (isValidCoord(destination) ? { latitude: destination.latitude, longitude: destination.longitude } : null)
    : null;

  const routeWaypoints: Coordinate[] | undefined = isTripMode && stops.length > 0
    ? stops.filter(isValidCoord).map((s) => ({ latitude: s.latitude, longitude: s.longitude }))
    : undefined;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        customMapStyle={Platform.OS === 'android' ? darkMapStyle : undefined}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        rotateEnabled
        scrollEnabled
        zoomEnabled
        pitchEnabled={false}
      >
        {/* ── Driver marker ──────────────────────────────────────────────── */}
        {driverLocation && (
          <Marker
            coordinate={driverCoord(driverLocation)}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            title="Your Location"
          >
            <View style={styles.driverMarkerOuter}>
              <View style={styles.driverMarkerInner} />
            </View>
          </Marker>
        )}

        {/* ── Pickup marker (pickup mode only) ───────────────────────────── */}
        {isPickupMode && isValidCoord(pickup) && (
          <Marker
            coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            title="Pickup"
            description={pickup.address}
          >
            <View style={styles.pickupMarkerOuter}>
              <View style={styles.pickupMarkerInner} />
            </View>
          </Marker>
        )}

        {/* ── Stop markers (trip mode only) ─────────────────────────────── */}
        {isTripMode && stops.filter(isValidCoord).map((stop, index) => (
          <Marker
            key={`stop-${stop.id}`}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            title={`Stop ${index + 1}`}
            description={stop.address}
          >
            <View style={styles.stopMarkerOuter}>
              <View style={styles.stopMarkerInner}>
                <Text style={styles.stopMarkerNumber}>{index + 1}</Text>
              </View>
            </View>
          </Marker>
        ))}

        {/* ── Destination marker (trip mode only) ────────────────────────── */}
        {isTripMode && isValidCoord(destination) && (
          <Marker
            coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            title="Destination"
            description={destination.address}
          >
            <View style={styles.destMarkerOuter}>
              <View style={styles.destMarkerInner} />
              <View style={styles.destMarkerPin} />
            </View>
          </Marker>
        )}

        {/* ── Driving route polyline ─────────────────────────────────────── */}
        {routeOrigin && routeDest && (
          <DrivingRoute
            origin={routeOrigin}
            destination={routeDest}
            waypoints={routeWaypoints}
            apiKey={GOOGLE_MAPS_API_KEY}
            onRouteUpdate={onRouteUpdate}
          />
        )}
      </MapView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  // Driver — yellow pulse
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

  // Pickup — green pulse
  pickupMarkerOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(48, 209, 88, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupMarkerInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#30D158',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  // Stop — orange numbered badge
  stopMarkerOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 159, 10, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopMarkerInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF9F0A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopMarkerNumber: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
  },

  // Destination — red pin
  destMarkerOuter: { alignItems: 'center' },
  destMarkerInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF453A',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#FF453A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  destMarkerPin: {
    width: 3,
    height: 8,
    backgroundColor: '#FF453A',
    marginTop: -1,
    borderRadius: 1.5,
  },
});

export default MapViewContainer;
