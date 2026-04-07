// Dynamic Expo config — supports process.env for build-time variables.
// This file takes precedence over app.json for any conflicting keys.
// Expo CLI automatically loads .env when running `expo start` or `eas build`.

/** @type {import('@expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: 'chauffeur-app',
    slug: 'chauffeur-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'chauffeurapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.velvetexperience.chauffeur',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Chauffeur needs your location to show your position on the map.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Chauffeur needs your location in the background to keep tracking your position while on a trip.',
      },
    },
    android: {
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_ANDROID_API_KEY',
        },
      },
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.velvetexperience.chauffeur',
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Chauffeur needs your location to show your position on the map.',
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '7548041f-502d-44e2-b89f-78b4dd4459b1',
      },
    },
  },
};
