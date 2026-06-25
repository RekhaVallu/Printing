import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay, interpolate } from "react-native-reanimated";
import { tokenCache } from "../utils/tokenCache";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { AuthProvider, useAppAuth } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";
import { initPostHog } from "../utils/posthog";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env",
  );
}

// -----------------------------------------------------------------------------
// NAVIGATION GUARD component to handle authentication and onboarding routes
// -----------------------------------------------------------------------------
function NavigationGuard() {
  const { isLoaded, isSignedIn } = useAuth();
  const { dbUser, isLoadingDbUser, isProfileCompleted } = useAppAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || isLoadingDbUser) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isProfileCompletion = segments[0] === "profile-completion";

    if (isSignedIn) {
      if (!isProfileCompleted) {
        if (!isProfileCompletion) {
          router.replace("/profile-completion");
        }
      } else {
        if (inAuthGroup || isProfileCompletion || !segments[0]) {
          if (dbUser?.role === "admin") {
            router.replace("/(tabs)/admin-console");
          } else if (dbUser?.role === "operator") {
            router.replace("/(tabs)/orders");
          } else {
            router.replace("/(tabs)/home");
          }
        }
      }
    } else {
      if (!inAuthGroup) {
        router.replace("/(auth)/sign-in");
      }
    }
  }, [isSignedIn, isProfileCompleted, isLoadingDbUser, isLoaded, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

// -----------------------------------------------------------------------------
// ROOT LAYOUT AND ANIMATED SPLASH SCREEN
// -----------------------------------------------------------------------------
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const [isSplashActive, setIsSplashActive] = useState(true);

  // Reanimated shared values for splash screen
  const logoScale = useSharedValue(0.3);
  const logoGlow = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const splashOpacity = useSharedValue(1);

  useEffect(() => {
    // Initialize PostHog
    initPostHog();

    // Trigger animations in sequence
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    logoGlow.value = withDelay(400, withTiming(1, { duration: 1000 }));
    textOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }));

    // Remove splash screen after 2.8 seconds
    const timer = setTimeout(() => {
      splashOpacity.value = withTiming(0, { duration: 400 }, () => {
        // Completed fade out
      });
      setTimeout(() => {
        setIsSplashActive(false);
      }, 400);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  // Splash animation styles
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(logoGlow.value, [0, 1], [0, 0.4]);
    const scale = interpolate(logoGlow.value, [0, 1], [0.9, 1.1]);
    return {
      shadowOpacity,
      transform: [{ scale }],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    };
  });

  const splashContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: splashOpacity.value,
    };
  });

  if (!fontsLoaded) {
    return null; // Keep native splash visible while loading fonts
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
          <View style={{ flex: 1, backgroundColor: "#020617" }}>
            {isSplashActive ? (
              <Animated.View
                style={[
                  {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "#020617",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 9999,
                  },
                  splashContainerStyle,
                ]}
              >
                <View style={{ alignItems: "center", justifyContent: "center" }}>
                  {/* Glow circle behind logo */}
                  <Animated.View
                    style={[
                      {
                        position: "absolute",
                        width: 140,
                        height: 140,
                        borderRadius: 70,
                        backgroundColor: "#22C55E",
                        opacity: 0.15,
                        shadowColor: "#22C55E",
                        shadowOffset: { width: 0, height: 0 },
                        shadowRadius: 40,
                      },
                      glowAnimatedStyle,
                    ]}
                  />

                  {/* Logo Container */}
                  <Animated.View
                    style={[
                      {
                        width: 100,
                        height: 100,
                        borderRadius: 24,
                        backgroundColor: "#1E293B",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1.5,
                        borderColor: "#334155",
                      },
                      logoAnimatedStyle,
                    ]}
                  >
                    <Text
                      style={{
                        fontFamily: "SpaceGrotesk_700Bold",
                        fontSize: 38,
                        color: "#22C55E",
                      }}
                    >
                      PF
                    </Text>
                  </Animated.View>
                </View>

                {/* Branding Tagline */}
                <Animated.View
                  style={[
                    { marginTop: 32, alignItems: "center" },
                    textAnimatedStyle,
                  ]}
                >
                  <Text
                    style={{
                      fontFamily: "SpaceGrotesk_600SemiBold",
                      fontSize: 28,
                      color: "#F8FAFC",
                    }}
                  >
                    PrintFlow
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#64748B",
                      marginTop: 6,
                    }}
                  >
                    Smart Campus Printing
                  </Text>
                  <ActivityIndicator
                    color="#22C55E"
                    size="small"
                    style={{ marginTop: 24 }}
                  />
                </Animated.View>
              </Animated.View>
            ) : null}

            <NavigationGuard />
          </View>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
