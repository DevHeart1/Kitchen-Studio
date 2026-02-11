// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as ExpoSplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SavedRecipesProvider } from "@/contexts/SavedRecipesContext";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { UserProfileProvider, useUserProfile } from "@/contexts/UserProfileContext";
import { CookingHistoryProvider, useCookingHistory } from "@/contexts/CookingHistoryContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DialogProvider } from "@/contexts/DialogContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import SplashScreen from "@/components/SplashScreen";
import WelcomeBackSplash from "@/components/WelcomeBackSplash";
import ConfigurationError from "@/components/ConfigurationError";
import { trpc, trpcClient } from "@/lib/trpc";

// Prevent the splash screen from auto-hiding before asset loading is complete.
ExpoSplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function useProtectedRoute() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasCompletedOnboarding, isLoading: profileLoading } = useUserProfile();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || profileLoading) {
      console.log("[Navigation] Still loading...", { authLoading, profileLoading });
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const currentScreen = segments[1];
    const onOnboardingFlowScreen = currentScreen === "preferences" || currentScreen === "starter-pack";

    console.log("[Navigation] State:", {
      isAuthenticated,
      hasCompletedOnboarding,
      inAuthGroup,
      currentScreen,
      segments: segments.join('/')
    });

    // Not authenticated - allow auth screens, redirect others to onboarding
    if (!isAuthenticated) {
      if (!inAuthGroup) {
        console.log("[Navigation] Not authenticated, redirecting to onboarding");
        router.replace("/(auth)/onboarding");
      }
      return;
    }

    // Authenticated but onboarding status still loading - wait
    if (hasCompletedOnboarding === null) {
      console.log("[Navigation] Authenticated but onboarding status unknown, waiting...");
      return;
    }

    // Authenticated and onboarding completed - go to main app
    if (hasCompletedOnboarding === true) {
      if (inAuthGroup) {
        console.log("[Navigation] Onboarding complete, redirecting to tabs");
        router.replace("/(tabs)");
      }
      return;
    }

    // Authenticated but onboarding NOT completed - ensure user is on onboarding flow
    if (hasCompletedOnboarding === false) {
      if (!inAuthGroup) {
        // User somehow got to main app without completing onboarding
        console.log("[Navigation] Onboarding not complete, redirecting to preferences");
        router.replace("/(auth)/preferences");
      } else if (!onOnboardingFlowScreen && currentScreen !== "sign-up" && currentScreen !== "login") {
        // User is in auth but not on a valid screen for onboarding flow
        console.log("[Navigation] In auth but not on onboarding flow, redirecting to preferences");
        router.replace("/(auth)/preferences");
      }
      // Otherwise, let them continue on their current auth screen
    }
  }, [isAuthenticated, authLoading, profileLoading, segments, hasCompletedOnboarding]);
}

function RootLayoutNav() {
  const { isLoading: authLoading, isAuthenticated, isConfigured } = useAuth();
  const { isLoading: profileLoading, hasCompletedOnboarding } = useUserProfile();
  const { activeCookingSession } = useCookingHistory();
  const [showWelcomeBack, setShowWelcomeBack] = useState(true);

  useProtectedRoute();

  if (authLoading || profileLoading) {
    return <SplashScreen />;
  }

  if (!isConfigured) {
    return <ConfigurationError />;
  }

  const isReturningUser = isAuthenticated && hasCompletedOnboarding === true;
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
      <Stack.Screen
        name="paywall"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}

import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ShoppingListProvider } from "@/contexts/ShoppingListContext";
import { UsageProvider } from "@/contexts/UsageContext";
import { GamificationProvider } from "@/contexts/GamificationContext";
import XPToastManager from "@/components/XPToast";

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DialogProvider>
        <InventoryProvider>
          <NotificationProvider>
            <ShoppingListProvider>
              <SavedRecipesProvider>
                <UsageProvider>
                  <SubscriptionProvider>
                    <UserProfileProvider>
                      <CookingHistoryProvider>
                        <GamificationProvider>
                          {children}
                          <XPToastManager />
                        </GamificationProvider>
                      </CookingHistoryProvider>
                    </UserProfileProvider>
                  </SubscriptionProvider>
                </UsageProvider>
              </SavedRecipesProvider>
            </ShoppingListProvider>
          </NotificationProvider>

        </InventoryProvider >
      </DialogProvider >
    </AuthProvider >
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
