import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import { DriverLocation } from '../services/locationService';
import { darkMapStyle } from '../utils/mapStyles';
import DrivingRoute, { RouteInfo } from './DrivingRoute';
import { MAP_FIT_PADDING } from '../utils/mapUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Coordinate {
  latitude: number;
  longitude: number;
}

interface MapViewContainerProps {
  driverLocation: DriverLocation | null;
  /** Pickup marker. When provided (and no tripDestination) → route driver here. */
  pickupLocation?: Coordinate;
  /** Called whenever the Directions API returns an updated route. */
  onRouteUpdate?: (info: RouteInfo) => void;
  /**
   * When set, the map switches to trip mode:
   *   - Routes driver → waypoints → tripDestination
   *   - Shows a distinct destination marker
   *   - Fits all points in view on mount
   */
  tripDestination?: Coordinate;
  /**
   * Intermediate stops shown as markers and passed to the Directions API.
   * Only used when tripDestination is set.
   */
  tripWaypoints?: Coordinate[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidCoord(c: Coordinate | undefined | null): c is Coordinate {
  return (
    c != null &&
    typeof c.latitude === 'number' &&
    typeof c.longitude === 'number' &&
    isFinite(c.latitude) &&
    isFinite(c.longitude) &&
    !(c.latitude === 0 && c.longitude === 0)
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_REGION = {
  latitude: 19.076, // fallback: Mumbai
  longitude: 72.8777,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const ANIMATE_DURATION_MS = 500;

// ─── Component ────────────────────────────────────────────────────────────────

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const MapViewContainer: React.FC<MapViewContainerProps> = ({
  driverLocation,
  pickupLocation,
  onRouteUpdate,
  tripDestination,
  tripWaypoints,
}) => {
  const mapRef = useRef<MapView>(null);
  const hasFittedPickupRef = useRef(false);
  const hasFittedTripRef = useRef(false);

  const isTripMode = Boolean(tripDestination);

  // ── Fit map to driver + pickup (once, on pickup mode entry) ───────────────
  useEffect(() => {
    if (isTripMode || !driverLocation || !isValidCoord(pickupLocation) || hasFittedPickupRef.current || !mapRef.current) return;

    mapRef.current.fitToCoordinates(
      [
        { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
        pickupLocation,
      ],
      { edgePadding: MAP_FIT_PADDING, animated: true },
    );
    hasFittedPickupRef.current = true;
  }, [driverLocation, pickupLocation, isTripMode]);

  // ── Fit map to full trip route (once, on trip mode entry) ─────────────────
  useEffect(() => {
    if (!isTripMode || !driverLocation || !isValidCoord(tripDestination) || hasFittedTripRef.current || !mapRef.current) return;

    const allPoints: Coordinate[] = [
      { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
      ...(isValidCoord(pickupLocation) ? [pickupLocation] : []),
      ...(tripWaypoints ?? []).filter(isValidCoord),
      tripDestination,
    ];

    mapRef.current.fitToCoordinates(allPoints, {
      edgePadding: { ...MAP_FIT_PADDING, bottom: 340 },
      animated: true,
    });
    hasFittedTripRef.current = true;
  }, [isTripMode, driverLocation, tripDestination, pickupLocation, tripWaypoints]);

  // ── Reset fit flags when locations change (new ride) ─────────────────────
  useEffect(() => {
    hasFittedPickupRef.current = false;
  }, [pickupLocation]);

  useEffect(() => {
    hasFittedTripRef.current = false;
  }, [tripDestination]);

  // ── Auto-follow driver (only when no routing destination is shown) ────────
  useEffect(() => {
    if (!driverLocation || !mapRef.current || pickupLocation || tripDestination) return;
    mapRef.current.animateToRegion(
      {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      ANIMATE_DURATION_MS,
    );
  }, [driverLocation, pickupLocation, tripDestination]);

  const initialRegion = driverLocation
    ? {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : DEFAULT_REGION;

  // Routing origin is always driver; destination depends on mode
  const routeDestination = isTripMode ? tripDestination! : pickupLocation;

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

        {/* ── Pickup marker ──────────────────────────────────────────────── */}
        {isValidCoord(pickupLocation) && (
          <Marker
            coordinate={pickupLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            title="Pickup Location"
          >
            <View style={styles.pickupMarkerOuter}>
              <View style={styles.pickupMarkerInner} />
            </View>
          </Marker>
        )}

        {/* ── Stoppage markers (trip mode only) ──────────────────────────── */}
        {isTripMode &&
          tripWaypoints?.filter(isValidCoord).map((wp, index) => (
            <Marker
              key={`stop-${index}`}
              coordinate={wp}
              anchor={{ x: 0.5, y: 0.5 }}
              title={`Stop ${index + 1}`}
            >
              <View style={styles.stopMarkerOuter}>
                <View style={styles.stopMarkerInner}>
                  {/* Stop number badge */}
                </View>
              </View>
            </Marker>
          ))}

        {/* ── Destination marker (trip mode only) ────────────────────────── */}
        {isTripMode && isValidCoord(tripDestination) && (
          <Marker
            coordinate={tripDestination}
            anchor={{ x: 0.5, y: 1 }}
            title="Destination"
          >
            <View style={styles.destMarkerOuter}>
              <View style={styles.destMarkerInner} />
              <View style={styles.destMarkerPin} />
            </View>
          </Marker>
        )}

        {/* ── Driving route ───────────────────────────────────────────────── */}
        {driverLocation && isValidCoord(routeDestination) && (
          <DrivingRoute
            origin={{ latitude: driverLocation.latitude, longitude: driverLocation.longitude }}
            destination={routeDestination}
            waypoints={isTripMode ? tripWaypoints : undefined}
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
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  // Driver marker — yellow with glow
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

  // Pickup marker — green with glow
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

  // Stoppage marker — amber/orange with glow
  stopMarkerOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 159, 10, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopMarkerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF9F0A',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },

  // Destination marker — red/rose pin
  destMarkerOuter: {
    alignItems: 'center',
  },
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
