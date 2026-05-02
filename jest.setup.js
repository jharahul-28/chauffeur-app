// Runs via setupFilesAfterEnv — Jest globals (expect, jest) are available here.
require('@testing-library/jest-native/extend-expect');

// ── React Native core mocks ────────────────────────────────────────────────────
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// ── Async Storage ─────────────────────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// ── Expo modules ──────────────────────────────────────────────────────────────
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestBackgroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  startLocationUpdatesAsync: jest.fn().mockResolvedValue(undefined),
  stopLocationUpdatesAsync: jest.fn().mockResolvedValue(undefined),
  hasStartedLocationUpdatesAsync: jest.fn().mockResolvedValue(false),
  Accuracy: { High: 6, Balanced: 3 },
}));

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn().mockResolvedValue(false),
}));

jest.mock('expo-constants', () => ({
  default: { expoConfig: { version: '1.0.0' } },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Link: 'Link',
  Stack: { Screen: 'Screen' },
  Tabs: { Screen: 'Screen' },
}));

jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: 'MapView',
  Marker: 'Marker',
  Polyline: 'Polyline',
}));

jest.mock('react-native-maps-directions', () => 'MapViewDirections');

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => children,
  PanGestureHandler: ({ children }) => children,
  State: {},
  Directions: {},
}));

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

// ── Silence noisy logs in tests ───────────────────────────────────────────────
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
