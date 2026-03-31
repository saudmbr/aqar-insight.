import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { I18nManager, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';

SplashScreen.preventAutoHideAsync();

// Allow RTL layout on native devices (iOS/Android via Expo Go)
if (Platform.OS !== 'web') {
  I18nManager.allowRTL(true);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FavoritesProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="listing/[id]" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="listing/new" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="auth" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="marketers/index" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="marketers/[id]" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="services/index" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="services/[id]" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="requests/index" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="requests/new" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="analytics/index" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="my-listings" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="notifications" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="about" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="legal/terms" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="legal/privacy" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="legal/usage" options={{ headerShown: false, presentation: 'card' }} />
            </Stack>
          </FavoritesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
