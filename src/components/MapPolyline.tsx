import React, { memo } from 'react';
import { Polyline } from 'react-native-maps';
import { Coordinate } from './MapViewContainer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MapPolylineProps {
  coordinates: Coordinate[];
  strokeColor?: string;
  strokeWidth?: number;
  /** Render a dashed line instead of solid (default: true) */
  dashed?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders a route polyline on the map.
 * Memoized to prevent re-render on every driver location update.
 *
 * Future: accept multiple coordinate arrays for multi-stop navigation.
 */
const MapPolyline = memo(function MapPolyline({
  coordinates,
  strokeColor = '#EDB96D',
  strokeWidth = 5,
  dashed = true,
}: MapPolylineProps) {
  if (coordinates.length < 2) return null;

  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
      lineDashPattern={dashed ? [12, 6] : undefined}
    />
  );
});

export default MapPolyline;
