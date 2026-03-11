import * as Location from 'expo-location';

export interface DriverLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}

export const requestLocationPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

export const getCurrentLocation = async (): Promise<DriverLocation | null> => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      heading: location.coords.heading ?? undefined,
      speed: location.coords.speed ?? undefined,
      accuracy: location.coords.accuracy ?? undefined,
    };
  } catch {
    return null;
  }
};

export const watchLocation = (
  callback: (location: DriverLocation) => void
): Promise<Location.LocationSubscription> => {
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 3000,    // update every 3s
      distanceInterval: 5,   // or every 5 metres
    },
    (location) => {
      callback({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: location.coords.heading ?? undefined,
        speed: location.coords.speed ?? undefined,
        accuracy: location.coords.accuracy ?? undefined,
      });
    }
  );
};
