import React, { memo, useRef, useState, useEffect } from 'react';
import MapViewDirections from 'react-native-maps-directions';
import { Coordinate } from './MapViewContainer';
import { shouldRefetchRoute } from '../utils/routeUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RouteInfo {
  /** Raw duration in seconds (divide by 60 for minutes). */
  durationSeconds: number;
  /** Raw distance in metres (divide by 1000 for km). */
  distanceMeters: number;
}

interface DrivingRouteProps {
  origin: Coordinate;
  destination: Coordinate;
  apiKey: string;
  onRouteUpdate?: (info: RouteInfo) => void;
  strokeColor?: string;
  strokeWidth?: number;
  /**
   * Minimum metres the driver must move before a new route is fetched.
   * Prevents excessive Directions API calls. Default: 40 m.
   */
  refetchThresholdMeters?: number;
  /**
   * Ordered intermediate stops between origin and destination.
   * Passed directly to the Directions API as waypoints.
   * Changes here trigger a fresh route fetch.
   */
  waypoints?: Coordinate[];
  // Future extensibility:
  // onStepUpdate?: (step: Step) => void; // turn-by-turn navigation
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders a driving-mode route polyline via the Google Directions API.
 *
 * Throttling strategy:
 *   - Tracks `lastFetchedOrigin` in a ref.
 *   - Only updates `activeOrigin` (which triggers a new API call) when the
 *     driver has moved more than `refetchThresholdMeters` from the last fetch.
 *
 * Must be rendered as a direct child of a `<MapView>`.
 */
const DrivingRoute = memo(function DrivingRoute({
  origin,
  destination,
  apiKey,
  onRouteUpdate,
  strokeColor = '#EDB96D',
  strokeWidth = 5,
  refetchThresholdMeters = 40,
  waypoints,
}: DrivingRouteProps) {
  const lastFetchedOriginRef = useRef<Coordinate | null>(null);
  const [activeOrigin, setActiveOrigin] = useState<Coordinate>(origin);

  // Gate driver-position API calls behind the distance threshold.
  // Waypoint changes always trigger a fresh fetch (handled by MapViewDirections
  // re-rendering when the `waypoints` prop reference changes).
  useEffect(() => {
    if (shouldRefetchRoute(lastFetchedOriginRef.current, origin, refetchThresholdMeters)) {
      lastFetchedOriginRef.current = { ...origin };
      setActiveOrigin({ ...origin });
    }
  }, [origin, refetchThresholdMeters]);

  return (
    <MapViewDirections
      origin={activeOrigin}
      destination={destination}
      waypoints={waypoints}
      apikey={apiKey}
      mode="DRIVING"
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
      optimizeWaypoints={false}
      onReady={(result) => {
        // result.duration → minutes, result.distance → kilometres
        onRouteUpdate?.({
          durationSeconds: result.duration * 60,
          distanceMeters: result.distance * 1000,
        });
      }}
      onError={(errorMessage) => {
        console.warn('[DrivingRoute] Directions API error:', errorMessage);
      }}
    />
  );
});

export default DrivingRoute;
