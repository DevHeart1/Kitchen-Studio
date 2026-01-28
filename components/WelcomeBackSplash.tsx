import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  Image,
} from "react-native";
import { Play, Compass } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { recentCooks } from "@/mocks/sessions";
import Colors from "@/constants/colors";

const { width, height } = Dimensions.get("window");

interface WelcomeBackSplashProps {
  onContinue: () => void;
}

export default function WelcomeBackSplash({ onContinue }: WelcomeBackSplashProps) {
  const router = useRouter();
  const { profile } = useUserProfile();
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.4)).current;
  const progressShimmer = useRef(new Animated.Value(0)).current;

  const inProgressCook = recentCooks.find((cook) => cook.progress < 100);
  const progressPercent = inProgressCook ? inProgressCook.progress : 0;

  useEffect(() => {
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.03,
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(progressShimmer, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const shimmerTranslate = progressShimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 200],
  });

  const handleResumeCook = () => {
    if (inProgressCook) {
      router.push({
        pathname: "/cook-session",
        params: { id: inProgressCook.id },
      });
    }
    onContinue();
  };

  const handleExplore = () => {
    onContinue();
  };

  const firstName = profile.name.split(" ")[0];

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
          <View style={styles.mainContent}>
            <View style={styles.avatarContainer}>
              <Animated.View
                style={[
                  styles.avatarGlow,
                  {
                    opacity: glowOpacity,
                    transform: [{ scale: pulseValue }],
                  },
                ]}
              />
              <View style={styles.avatarBorder}>
                <Image
                  source={{ uri: profile.avatar }}
                  style={styles.avatar}
                />
              </View>
            </View>

            <Text style={styles.title}>
              Welcome back,{"\n"}
              <Text style={styles.titleHighlight}>{firstName}!</Text>
            </Text>
            <Text style={styles.subtitle}>
              Ready to cook something amazing today?
            </Text>

            {inProgressCook && (
              <TouchableOpacity
                style={styles.resumeCard}
                onPress={handleResumeCook}
                activeOpacity={0.9}
              >
                <View style={styles.resumeThumbnailContainer}>
                  <Image
                    source={{ uri: inProgressCook.image }}
                    style={styles.resumeThumbnail}
                  />
                </View>

                <View style={styles.resumeInfo}>
                  <Text style={styles.resumeLabel}>RESUME COOK</Text>
                  <Text style={styles.resumeTitle} numberOfLines={1}>
                    {inProgressCook.title}
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${progressPercent}%` },
                        ]}
                      >
                        <Animated.View
                          style={[
                            styles.progressShimmer,
                            { transform: [{ translateX: shimmerTranslate }] },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.playButton}>
                  <Play size={24} color={Colors.backgroundDark} fill={Colors.backgroundDark} />
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={handleExplore}
              activeOpacity={0.8}
            >
              <Compass size={22} color={Colors.primary} />
              <Text style={styles.exploreButtonText}>Explore New Recipes</Text>
            </TouchableOpacity>
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
    backgroundColor: "rgba(16, 34, 21, 0.88)",
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
    paddingHorizontal: 24,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 380,
    alignSelf: "center",
    width: "100%",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 32,
  },
  avatarGlow: {
    position: "absolute",
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: 100,
    backgroundColor: Colors.primary,
  },
  avatarBorder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    padding: 4,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 15,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.backgroundDark,
  },
  title: {
    fontSize: 36,
    fontWeight: "800" as const,
    color: Colors.white,
    textAlign: "center",
    lineHeight: 44,
    marginBottom: 12,
  },
  titleHighlight: {
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(203, 213, 225, 0.9)",
    fontWeight: "500" as const,
    textAlign: "center",
    marginBottom: 48,
  },
  resumeCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 32,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  resumeThumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  resumeThumbnail: {
    width: "100%",
    height: "100%",
  },
  resumeInfo: {
    flex: 1,
    paddingVertical: 4,
  },
  resumeLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  resumeTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 12,
  },
  progressBarContainer: {
    width: "100%",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  progressShimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    width: 50,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  footer: {
    paddingBottom: 48,
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
  },
  exploreButton: {
    width: "100%",
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  exploreButtonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.white,
  },
});
