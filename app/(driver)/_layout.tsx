import { Stack } from 'expo-router';
import PermissionGate from '@/src/components/PermissionGate';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';

/**
 * Driver layout — wraps all authenticated driver screens with PermissionGate.
 * Any screen in this stack is only rendered when location permission + GPS
 * are both active. If revoked mid-session, the gate immediately blocks.
 */
export default function DriverLayout() {
  return (
    <ErrorBoundary fallbackTitle="Driver app error">
      <PermissionGate>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen
            name="driver-home"
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name="hourly-ride"
            options={{ gestureEnabled: false }}
          />
        </Stack>
      </PermissionGate>
    </ErrorBoundary>
  );
}
