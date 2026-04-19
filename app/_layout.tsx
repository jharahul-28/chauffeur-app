import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { onUnauthorized } from "@/src/services/apiClient";

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      console.warn('[RootLayout] Session expired — redirecting to login');
      router.replace('/');
    });
    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
