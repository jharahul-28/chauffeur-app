import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useIsLoading } from '../state/useLoaderStore';

/**
 * Renders a full-screen semi-transparent overlay with an ActivityIndicator
 * whenever any API call is in-flight. Place once at the root layout.
 *
 * Extensibility: replace the ActivityIndicator with a skeleton loader or a
 * custom lottie animation by swapping the inner content only.
 */
export default function GlobalLoader() {
  const isLoading = useIsLoading();

  if (!isLoading) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <ActivityIndicator size="large" color="#EDB96D" />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    zIndex: 9999,
  },
});
