import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ImageBackground,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  X,
  ArrowRight,
  Mic,
  BookOpen,
  Timer,
  Settings,
  CheckCircle,
  Award,
  Star,
  Home,
  Share2,
  ChefHat,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface CookingStep {
  id: number;
  title: string;
  instruction: string;
  duration: string;
  image: string;
  feedback: string;
  feedbackType: "success" | "tip" | "warning";
  timerSeconds?: number;
}

const cookingSteps: CookingStep[] = [
  {
    id: 1,
    title: "Prepare the salmon",
    instruction: "Pat the salmon fillets dry with paper towels and season both sides with salt and pepper.",
    duration: "2 min",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800",
    feedback: "Great seasoning coverage!",
    feedbackType: "success",
  },
  {
    id: 2,
    title: "Dice the onions",
    instruction: "Finely dice half an onion for the garlic butter sauce.",
    duration: "3 min",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTkawrgH9uPk7c3y-lBktmVUNsTNyva3lCDzBhaNbdtF1LrFXVDEWE3w7lfTjIvDo_7JlT6KkGuQ7UtpoWkwQuwbhv-5L53eljYdma1YbMmjZvIncwbOj70GvsQ89WJwU_XOdQl763A-T66LNbkPFlyzdPapqJYh1MWFmaRrMTsBaE8KmVNCdXQC1Oeie1esbu027P1a5cJedLi0muDP_wqYXNAb0L3dT_xEIn0C8uvTpq6-UX0w7s9ikOKww0ineEyw6taRisKw",
    feedback: "Good knife posture!",
    feedbackType: "success",
  },
  {
    id: 3,
    title: "Mince the garlic",
    instruction: "Mince 4 cloves of fresh garlic finely for maximum flavor.",
    duration: "2 min",
    image: "https://images.unsplash.com/photo-1615478503562-ec2d8aa0e24e?w=800",
    feedback: "Tip: Rock the knife gently",
    feedbackType: "tip",
  },
  {
    id: 4,
    title: "Heat the pan",
    instruction: "Heat olive oil in a large skillet over medium-high heat until shimmering.",
    duration: "1 min",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
    feedback: "Perfect temperature!",
    feedbackType: "success",
    timerSeconds: 60,
  },
  {
    id: 5,
    title: "Sear the salmon",
    instruction: "Place salmon skin-side up. Sear for 4 minutes until golden crust forms.",
    duration: "4 min",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800",
    feedback: "Don't move the fish!",
    feedbackType: "tip",
    timerSeconds: 240,
  },
  {
    id: 6,
    title: "Flip and cook",
    instruction: "Flip salmon and cook for another 3-4 minutes until cooked through.",
    duration: "4 min",
    image: "https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=800",
    feedback: "Beautiful sear achieved!",
    feedbackType: "success",
    timerSeconds: 210,
  },
  {
    id: 7,
    title: "Make garlic butter",
    instruction: "Remove salmon. Add butter, garlic, and onions. Sauté until fragrant.",
    duration: "2 min",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
    feedback: "Stir continuously!",
    feedbackType: "warning",
    timerSeconds: 120,
  },
  {
    id: 8,
    title: "Finish and plate",
    instruction: "Drizzle garlic butter over salmon. Garnish with lemon and parsley.",
    duration: "1 min",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    feedback: "Restaurant quality!",
    feedbackType: "success",
  },
];

export default function ARCookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const step = cookingSteps[currentStep];
  const progress = ((currentStep + 1) / cookingSteps.length) * 100;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  useEffect(() => {
    feedbackAnim.setValue(0);
    Animated.spring(feedbackAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [currentStep, feedbackAnim]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (currentStep < cookingSteps.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep((prev) => prev + 1);
        setIsTimerRunning(false);
        setShowTimer(false);

        const nextStep = cookingSteps[currentStep + 1];
        if (nextStep?.timerSeconds) {
          setTimerSeconds(nextStep.timerSeconds);
        }

        slideAnim.setValue(50);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      setShowCompletion(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };



  const toggleListening = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsListening(!isListening);
  };

  const handleTimerPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step.timerSeconds) {
      if (!showTimer) {
        setTimerSeconds(step.timerSeconds);
        setShowTimer(true);
      }
      setIsTimerRunning(!isTimerRunning);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const getFeedbackColor = (type: CookingStep["feedbackType"]) => {
    switch (type) {
      case "success":
        return Colors.primary;
      case "tip":
        return "#60a5fa";
      case "warning":
        return "#fbbf24";
    }
  };

  const getFeedbackIcon = (type: CookingStep["feedbackType"]) => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} color={Colors.primary} />;
      case "tip":
        return <BookOpen size={20} color="#60a5fa" />;
      case "warning":
        return <Timer size={20} color="#fbbf24" />;
    }
  };

  if (showCompletion) {
    return (
      <View style={styles.completionContainer}>
        <ImageBackground
          source={{ uri: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800" }}
          style={styles.completionBackground}
        >
          <View style={styles.completionOverlay} />
          <View style={[styles.completionContent, { paddingTop: insets.top + 40 }]}>
            <View style={styles.completionBadge}>
              <Award size={48} color={Colors.primary} />
            </View>
            <Text style={styles.completionTitle}>Dish Complete!</Text>
            <Text style={styles.completionSubtitle}>
              Garlic Butter Pan-Seared Salmon
            </Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>8</Text>
                <Text style={styles.statLabel}>Steps</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>19</Text>
                <Text style={styles.statLabel}>Minutes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={16} color={Colors.primary} fill={Colors.primary} />
                  ))}
                </View>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>

            <View style={styles.achievementCard}>
              <ChefHat size={24} color={Colors.primary} />
              <View style={styles.achievementText}>
                <Text style={styles.achievementTitle}>Achievement Unlocked!</Text>
                <Text style={styles.achievementDesc}>First Salmon Master</Text>
              </View>
            </View>

            <View style={[styles.completionButtons, { paddingBottom: insets.bottom + 20 }]}>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <Share2 size={20} color={Colors.white} />
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.homeButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.replace("/(tabs)");
                }}
              >
                <Home size={20} color={Colors.backgroundDark} />
                <Text style={styles.homeButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: step.image }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.cameraOverlay} />

        <View style={styles.uiLayer}>
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <View style={styles.glassPanel}>
              <View style={styles.headerContent}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  testID="close-ar-button"
                >
                  <X size={24} color={Colors.white} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                  <Animated.Text
                    style={[
                      styles.stepTitle,
                      {
                        opacity: fadeAnim,
                        transform: [{ translateX: slideAnim }],
                      },
                    ]}
                  >
                    {step.title}
                  </Animated.Text>
                  <Text style={styles.stepCounter}>
                    STEP {currentStep + 1} OF {cookingSteps.length}
                  </Text>
                </View>
                <View style={styles.headerSpacer} />
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      { width: `${progress}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.mainContent}>
            <Animated.View
              style={[
                styles.feedbackPanel,
                {
                  opacity: feedbackAnim,
                  transform: [
                    {
                      translateX: feedbackAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.feedbackCard,
                  { borderLeftColor: getFeedbackColor(step.feedbackType) },
                ]}
              >
                <View
                  style={[
                    styles.feedbackIcon,
                    { backgroundColor: `${getFeedbackColor(step.feedbackType)}20` },
                  ]}
                >
                  {getFeedbackIcon(step.feedbackType)}
                </View>
                <View>
                  <Text style={styles.feedbackLabel}>Technique Feedback</Text>
                  <Text
                    style={[
                      styles.feedbackText,
                      { color: getFeedbackColor(step.feedbackType) },
                    ]}
                  >
                    {step.feedback}
                  </Text>
                </View>
              </View>
            </Animated.View>

            <View style={styles.arOverlay}>
              <View style={styles.outerRing}>
                <View style={styles.innerRing}>
                  <Animated.View
                    style={[
                      styles.centerDot,
                      { transform: [{ scale: pulseAnim }] },
                    ]}
                  />
                </View>
              </View>
            </View>

            {showTimer && (
              <View style={styles.timerDisplay}>
                <Text style={styles.timerText}>{formatTime(timerSeconds)}</Text>
                <Text style={styles.timerLabel}>
                  {isTimerRunning ? "Cooking..." : "Tap to start"}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Animated.Text
              style={[
                styles.instructionText,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              {step.instruction}
            </Animated.Text>

            <View style={styles.toolBar}>
              <TouchableOpacity
                style={styles.toolButton}
                onPress={() => setShowInstructions(true)}
              >
                <BookOpen size={22} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toolButton,
                  step.timerSeconds ? styles.toolButtonActive : undefined,
                ]}
                onPress={handleTimerPress}
              >
                <Timer
                  size={22}
                  color={step.timerSeconds ? Colors.primary : Colors.white}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolButton}>
                <Settings size={22} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.voiceButton,
                  isListening && styles.voiceButtonActive,
                ]}
                onPress={toggleListening}
              >
                <Mic size={20} color={isListening ? Colors.backgroundDark : Colors.primary} />
                <Text
                  style={[
                    styles.voiceButtonText,
                    isListening && styles.voiceButtonTextActive,
                  ]}
                >
                  {isListening ? "Listening..." : "Voice"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNextStep}
                testID="next-step-button"
              >
                <Text style={styles.nextButtonText}>
                  {currentStep === cookingSteps.length - 1 ? "Finish" : "Next Step"}
                </Text>
                <ArrowRight size={20} color={Colors.backgroundDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.homeIndicator} />
          </View>
        </View>
      </ImageBackground>

      <Modal
        visible={showInstructions}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInstructions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Steps</Text>
              <TouchableOpacity onPress={() => setShowInstructions(false)}>
                <X size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.stepsList} showsVerticalScrollIndicator={false}>
              {cookingSteps.map((s, index) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.stepItem,
                    index === currentStep && styles.stepItemActive,
                    index < currentStep && styles.stepItemCompleted,
                  ]}
                  onPress={() => {
                    setCurrentStep(index);
                    setShowInstructions(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View
                    style={[
                      styles.stepNumber,
                      index === currentStep && styles.stepNumberActive,
                      index < currentStep && styles.stepNumberCompleted,
                    ]}
                  >
                    {index < currentStep ? (
                      <CheckCircle size={16} color={Colors.backgroundDark} />
                    ) : (
                      <Text
                        style={[
                          styles.stepNumberText,
                          index === currentStep && styles.stepNumberTextActive,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <View style={styles.stepInfo}>
                    <Text
                      style={[
                        styles.stepItemTitle,
                        index === currentStep && styles.stepItemTitleActive,
                      ]}
                    >
                      {s.title}
                    </Text>
                    <Text style={styles.stepItemDuration}>{s.duration}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    backgroundImage: "linear-gradient(180deg, rgba(16,34,21,0.8) 0%, rgba(16,34,21,0) 25%, rgba(16,34,21,0) 75%, rgba(16,34,21,0.9) 100%)",
  },
  uiLayer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
  },
  glassPanel: {
    backgroundColor: "rgba(16, 34, 21, 0.7)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(43, 238, 91, 0.2)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 4,
  },
  stepCounter: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "rgba(43, 238, 91, 0.8)",
    letterSpacing: 2,
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  feedbackPanel: {
    position: "absolute",
    right: 16,
    top: "20%",
    maxWidth: 260,
  },
  feedbackCard: {
    backgroundColor: "rgba(16, 34, 21, 0.85)",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...Platform.select({
      web: {
        boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.3)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  feedbackIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.white,
    marginBottom: 2,
  },
  feedbackText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  arOverlay: {
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "rgba(43, 238, 91, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  innerRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: "rgba(43, 238, 91, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  timerDisplay: {
    position: "absolute",
    bottom: "25%",
    alignItems: "center",
    backgroundColor: "rgba(16, 34, 21, 0.9)",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(43, 238, 91, 0.3)",
  },
  timerText: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: Colors.primary,
    fontVariant: ["tabular-nums"],
  },
  timerLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  instructionText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 20,
    backgroundColor: "rgba(16, 34, 21, 0.6)",
    padding: 12,
    borderRadius: 12,
  },
  toolBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  toolButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(16, 34, 21, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(43, 238, 91, 0.2)",
  },
  toolButtonActive: {
    borderColor: Colors.primary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  voiceButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(16, 34, 21, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(43, 238, 91, 0.2)",
  },
  voiceButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  voiceButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  voiceButtonTextActive: {
    color: Colors.backgroundDark,
  },
  nextButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  homeIndicator: {
    width: 128,
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 8,
  },
  completionContainer: {
    flex: 1,
  },
  completionBackground: {
    flex: 1,
  },
  completionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(16, 34, 21, 0.92)",
  },
  completionContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  completionBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(43, 238, 91, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(43, 238, 91, 0.3)",
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  ratingStars: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 4,
  },
  achievementCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(43, 238, 91, 0.1)",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(43, 238, 91, 0.2)",
    marginBottom: 32,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  completionButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: "auto",
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  homeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.backgroundDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  stepsList: {
    gap: 8,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  stepItemActive: {
    backgroundColor: "rgba(43, 238, 91, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(43, 238, 91, 0.3)",
  },
  stepItemCompleted: {
    opacity: 0.6,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberActive: {
    backgroundColor: Colors.primary,
  },
  stepNumberCompleted: {
    backgroundColor: Colors.primary,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  stepNumberTextActive: {
    color: Colors.backgroundDark,
  },
  stepInfo: {
    flex: 1,
  },
  stepItemTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.white,
    marginBottom: 2,
  },
  stepItemTitleActive: {
    color: Colors.primary,
  },
  stepItemDuration: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
  },
});
