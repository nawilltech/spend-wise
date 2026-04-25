import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@store/auth.store';
import { authApi } from '@services/api/auth';

export default function RootLayout() {
  const { isAuthenticated, setUser, clearAuth } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      authApi.me().then(setUser).catch(clearAuth);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )}
      </Stack>
    </GestureHandlerRootView>
  );
}
