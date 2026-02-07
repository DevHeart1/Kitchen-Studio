// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as ExpoSplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SavedRecipesProvider } from "@/contexts/SavedRecipesContext";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { UserProfileProvider, useUserProfile } from "@/contexts/UserProfileContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import SplashScreen from "@/components/SplashScreen";
import WelcomeBackSplash from "@/components/WelcomeBackSplash";
import { trpc, trpcClient } from "@/lib/trpc";

// Prevent the splash screen from auto-hiding before asset loading is complete.
ExpoSplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function useProtectedRoute() {
  const { isAuthenticated, isLoading: authLoading, isDemoMode } = useAuth();
  const { hasCompletedOnboarding, isLoading: profileLoading } = useUserProfile();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || profileLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabs = segments[0] === "(tabs)";
    const onOnboardingScreen = segments[1] === "onboarding";
    const onAuthScreen = segments[1] === "login" || segments[1] === "sign-up";
    const onPreferencesScreen = segments[1] === "preferences" || segments[1] === "starter-pack";

    if (!isAuthenticated && !isDemoMode) {
      if (!inAuthGroup) {
        router.replace("/(auth)/onboarding");
      }
    } else if (isAuthenticated || isDemoMode) {
      if (hasCompletedOnboarding === false) {
        if (!onPreferencesScreen) {
          router.replace("/(auth)/preferences");
        }
      } else if (hasCompletedOnboarding === true) {
        if (inAuthGroup) {
          router.replace("/(tabs)");
        }
      }
    }
  }, [isAuthenticated, authLoading, profileLoading, isDemoMode, segments, hasCompletedOnboarding]);
}

function RootLayoutNav() {
  const { isLoading: authLoading, isAuthenticated, isDemoMode } = useAuth();
  const { isLoading: profileLoading, hasCompletedOnboarding, activeCookingSession } = useUserProfile();
  const [showWelcomeBack, setShowWelcomeBack] = useState(true);

  useProtectedRoute();

  if (authLoading || profileLoading) {
    return <SplashScreen />;
  }

  const isReturningUser = (isAuthenticated || isDemoMode) && hasCompletedOnboarding === true;
  const hasActiveCooking = activeCookingSession !== null;

  // Only show WelcomeBackSplash if returning user AND has an active cooking session
  if (showWelcomeBack && isReturningUser && hasActiveCooking) {
    return (
      <WelcomeBackSplash
        onContinue={() => setShowWelcomeBack(false)}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="scanner"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="recipe"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="inventory"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="manual-add"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="substitution"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="ar-cooking"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="recent-cooks"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="cook-session"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="achievements"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="shared-recipe"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="help-center"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="contact-support"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="privacy-policy"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="privacy-security"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="progression-map"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="level-up"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "fade",
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <InventoryProvider>
        <SavedRecipesProvider>
          <UserProfileProvider>{children}</UserProfileProvider>
        </SavedRecipesProvider>
      </InventoryProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    ExpoSplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <AppProviders>
            <RootLayoutNav />
          </AppProviders>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
