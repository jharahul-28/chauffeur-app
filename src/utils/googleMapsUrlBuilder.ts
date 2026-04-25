import { Linking, Alert } from 'react-native';
import { RoutePoints } from './waypointUtils';

export interface LatLng {
  latitude: number;
  longitude: number;
}

// ─── URL Construction ─────────────────────────────────────────────────────────

const GMAPS_BASE = 'https://www.google.com/maps/dir/?api=1';

function latLng(lat: number, lng: number): string {
  return `${lat},${lng}`;
}

/**
 * Builds a Google Maps Directions deep-link from structured route points.
 *
 * Schema:
 *   https://www.google.com/maps/dir/?api=1
 *     &origin=<lat,lng>
 *     &destination=<lat,lng>
 *     [&waypoints=<lat,lng>|<lat,lng>...]    ← only when stops exist
 *     &travelmode=driving
 *
 * Returns null when pickup or destination coordinates are missing.
 *
 * Extensibility:
 *  - Pass `avoid=tolls|highways|ferries` as an extra param for routing prefs.
 *  - Replace latLng encoding with place_id when backend provides them.
 */
export function buildGoogleMapsUrl(route: RoutePoints): string | null {
  const { pickup, stops, destination } = route;

  if (!pickup || !destination) return null;

  const params = new URLSearchParams({
    api: '1',
    origin: latLng(pickup.latitude, pickup.longitude),
    destination: latLng(destination.latitude, destination.longitude),
    travelmode: 'driving',
  });

  if (stops.length > 0) {
    const waypointStr = stops
      .map((s) => latLng(s.latitude, s.longitude))
      .join('|');
    params.set('waypoints', waypointStr);
  }

  return `${GMAPS_BASE}&${params.toString()}`;
}

// ─── Launchers ────────────────────────────────────────────────────────────────

async function openUrl(url: string): Promise<void> {
  const canOpen = await Linking.canOpenURL(url).catch(() => false);
  if (!canOpen) {
    Alert.alert('Google Maps not available', 'Please install Google Maps and try again.');
    return;
  }
  await Linking.openURL(url).catch(() => {
    Alert.alert('Error', 'Failed to open Google Maps.');
  });
}

/**
 * Opens current location → next waypoint in Google Maps.
 * This is the primary navigation action — driven by the location-update API response.
 * Google Maps will use the device's current location as the origin automatically
 * when no origin is specified (omitting origin = "my location").
 */
export async function openNextWaypointInGoogleMaps(destination: LatLng): Promise<void> {
  const params = new URLSearchParams({
    api: '1',
    destination: latLng(destination.latitude, destination.longitude),
    travelmode: 'driving',
  });

  await openUrl(`${GMAPS_BASE}&${params.toString()}`);
}

/**
 * Opens the full trip route (pickup → stops → destination) in Google Maps.
 * Fallback used when no live next-waypoint is available.
 */
export async function openInGoogleMaps(route: RoutePoints): Promise<void> {
  const url = buildGoogleMapsUrl(route);

  if (!url) {
    Alert.alert('Navigation unavailable', 'Route coordinates are not available.');
    return;
  }

  await openUrl(url);
}
