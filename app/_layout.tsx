import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { onUnauthorized } from "@/src/services/apiClient";
import { getAccessToken } from "@/src/storage/tokenStorage";
import GlobalLoader from "@/src/components/GlobalLoader";

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
      console.warn('[RootLayout] Session expired — redirecting to login');
      router.replace('/');
    });
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <GlobalLoader />
    </GestureHandlerRootView>
  );
}
