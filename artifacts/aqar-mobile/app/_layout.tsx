import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { I18nManager, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';

SplashScreen.preventAutoHideAsync();

if (Platform.OS !== 'web') {
  I18nManager.allowRTL(true);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
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

  if (!fontsLoaded && !fontError && Platform.OS !== 'web') return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={Platform.OS === 'android' ? '#0B1628' : undefined} />
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
              <Stack.Screen name="requests/[id]" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="requests/new" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="analytics/index" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="districts" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="dashboard" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="marketer/dashboard" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="services/dashboard" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="services/new" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="my-listings" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="notifications" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="about" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="legal/terms" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="legal/privacy" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="legal/usage" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="profile-edit" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="change-password" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="contact" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="admin/index" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="admin/users" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="admin/reports" options={{ headerShown: false, presentation: 'card' }} />
              <Stack.Screen name="admin/user-reports" options={{ headerShown: false, presentation: 'card' }} />
            </Stack>
          </FavoritesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
