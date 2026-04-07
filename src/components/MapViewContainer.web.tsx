import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { DriverLocation } from '../services/locationService';

// Web fallback — react-native-maps is not supported on web.
// The native MapViewContainer.tsx is used on iOS/Android.

export interface Coordinate {
  latitude: number;
  longitude: number;
}

interface MapViewContainerProps {
  driverLocation: DriverLocation | null;
  pickupLocation?: Coordinate;
  routeCoordinates?: Coordinate[];
}

const MapViewContainer: React.FC<MapViewContainerProps> = ({ driverLocation, pickupLocation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Map preview not available on web</Text>
      {driverLocation && (
        <Text style={styles.coords}>
          Driver: {driverLocation.latitude.toFixed(5)}, {driverLocation.longitude.toFixed(5)}
        </Text>
      )}
      {pickupLocation && (
        <Text style={styles.coords}>
          Pickup: {pickupLocation.latitude.toFixed(5)}, {pickupLocation.longitude.toFixed(5)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#8E8E93',
    fontSize: 15,
  },
  coords: {
    color: '#FFC107',
    fontSize: 13,
    marginTop: 8,
  },
});

export default MapViewContainer;
