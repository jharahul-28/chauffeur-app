import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { onUnauthorized } from "@/src/services/apiClient";
import { getAccessToken } from "@/src/storage/tokenStorage";
import GlobalLoader from "@/src/components/GlobalLoader";
import { AlertProvider } from "@/src/context/AlertContext";
import UpdateManager from "@/src/components/UpdateManager";
import NetworkLoggerFAB from "@/src/components/NetworkLoggerFAB";
import "@/src/services/locationTask"; // Register background task
import { startNetworkLogging } from 'react-native-network-logger';

startNetworkLogging({
  forceEnable: true, // Log even in release if we want, but for now we'll leave it
});

export default function RootLayout() {
  const router = useRouter();

  // Redirect to home if a session token already exists
  useEffect(() => {
    getAccessToken().then((token) => {
      if (token) {
        router.replace('/(driver)/(tabs)/bookings');
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      router.replace('/');
    });
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AlertProvider>
        <UpdateManager />
        <Stack screenOptions={{ headerShown: false }} />
        <GlobalLoader />
        <NetworkLoggerFAB />
      </AlertProvider>
    </GestureHandlerRootView>
  );
}
