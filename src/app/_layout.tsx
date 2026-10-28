import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import {
  Mulish_400Regular,
  Mulish_500Medium,
  Mulish_600SemiBold,
  Mulish_700Bold,
  Mulish_800ExtraBold,
} from '@expo-google-fonts/mulish';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider, useSession } from '@/auth/session';
import { ToastHost } from '@/components/toast-host';
import { UpgradeRequired } from '@/features/upgrade-required';
import { queryClient, subscribeAppFocus } from '@/lib/query-client';
import { colors, radius } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { state } = useSession();
  const [fontsLoaded] = useFonts({
    Mulish_400Regular,
    Mulish_500Medium,
    Mulish_600SemiBold,
    Mulish_700Bold,
    Mulish_800ExtraBold,
    JetBrainsMono_400Regular,
  });
  const ready = fontsLoaded && state.status !== 'loading';

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useEffect(subscribeAppFocus, []);

  // Rien n'est rendu avant les polices : le texte ne « saute » pas.
  if (!ready) return null;
  if (state.status === 'upgrade') return <UpgradeRequired minVersion={state.minVersion} />;

  const signedIn = state.status === 'signedIn';
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="demandes/index" />
          <Stack.Screen
            name="demandes/nouvelle"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }}
          />
          <Stack.Screen
            name="demandes/[id]"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.92],
              sheetGrabberVisible: true,
              sheetCornerRadius: radius.sheet,
              contentStyle: { backgroundColor: colors.surface },
            }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="connexion" />
        </Stack.Protected>
      </Stack>
      <ToastHost />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </SessionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
