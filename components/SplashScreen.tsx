import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ImageBackground,
} from "react-native";
import { UtensilsCrossed } from "lucide-react-native";
import Colors from "@/constants/colors";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <Animated.View style={[styles.content, { opacity: fadeValue }]}>
          <View style={styles.logoSection}>
            <Animated.View
              style={[
                styles.logoContainer,
                { transform: [{ scale: pulseValue }, { rotate: "-6deg" }] },
              ]}
            >
              <UtensilsCrossed size={56} color={Colors.backgroundDark} strokeWidth={2.5} />
            </Animated.View>

            <Text style={styles.title}>Kitchen Studio</Text>
            <Text style={styles.tagline}>Cook Live, Cook Smart</Text>
          </View>

          <View style={styles.loaderSection}>
            <Animated.View
              style={[styles.loader, { transform: [{ rotate: spin }] }]}
            />
            <Text style={styles.loadingText}>INITIALIZING KITCHEN</Text>
          </View>
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(16, 34, 21, 0.85)",
  },
  glowTop: {
    position: "absolute",
    top: -height * 0.1,
    right: -width * 0.2,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(43, 238, 91, 0.15)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -height * 0.1,
    left: -width * 0.2,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(16, 50, 35, 0.4)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    width: 128,
    height: 128,
    backgroundColor: Colors.primary,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: "800" as const,
    color: Colors.white,
    letterSpacing: -1,
    textAlign: "center",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 20,
    color: "rgba(203, 213, 225, 0.9)",
    fontWeight: "500" as const,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  loaderSection: {
    paddingBottom: 64,
    alignItems: "center",
    gap: 16,
  },
  loader: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: "rgba(43, 238, 91, 0.2)",
    borderBottomColor: Colors.primary,
  },
  loadingText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "rgba(43, 238, 91, 0.8)",
    letterSpacing: 3,
  },
});
