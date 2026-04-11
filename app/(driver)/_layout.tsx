import { Stack } from 'expo-router';
import PermissionGate from '@/src/components/PermissionGate';

/**
 * Driver layout — wraps all authenticated driver screens with PermissionGate.
 * Any screen in this stack is only rendered when location permission + GPS
 * are both active. If revoked mid-session, the gate immediately blocks.
 */
export default function DriverLayout() {
  return (
    <PermissionGate>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      />
    </PermissionGate>
  );
}
