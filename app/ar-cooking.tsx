import { useRouter, useLocalSearchParams } from "expo-router";
import { useSavedRecipes } from "@/contexts/SavedRecipesContext";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ImageBackground,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  X,
  ArrowRight,
  Mic,
  BookOpen,
  Timer,
  CheckCircle,
  Award,
  Volume2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useCookingHistory } from "@/contexts/CookingHistoryContext";
import { useGamification } from "@/contexts/GamificationContext";
import { RecentCook } from "@/types";
import { useVoiceControl } from "@/hooks/useVoiceControl";

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
];

export default function ARCookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, recipeData } = useLocalSearchParams<{ id: string; recipeData: string }>();
  const { savedRecipes } = useSavedRecipes();

  // Parse passed recipe data if available
  const passedRecipe = useMemo(() => {
    if (recipeData) {
      try {
        return JSON.parse(recipeData);
      } catch (e) {
        console.error("Failed to parse recipeData", e);
        return null;
      }
    }
    return null;
  }, [recipeData]);

  // Find recipe by ID, or use passed data, or default to first saved recipe for testing
  const recipe = savedRecipes.find((r) => r.id === id) || passedRecipe || savedRecipes[0];

  const [currentStep, setCurrentStep] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const { addSession, updateSession, inProgressSessions } = useCookingHistory();
  const { awardXP } = useGamification();
  const [sessionId, setSessionId] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  // Transform recipe instructions to CookingStep format
  const steps: CookingStep[] = useMemo(() => {
    if (recipe?.instructions && recipe.instructions.length > 0) {
      return recipe.instructions.map((inst: any, index: number) => ({
        id: index + 1,
        title: `Step ${inst.step}`,
        instruction: inst.text,
        duration: inst.time ? `${Math.ceil(inst.time / 60)} min` : "2 min",
        image: recipe.videoThumbnail || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
        feedback: index === 0 ? "Let's get started!" : "Keep up the good work!",
        feedbackType: "success",
        timerSeconds: inst.time,
      }));
    }
    return cookingSteps;
  }, [recipe]);

  const step = steps[currentStep] || steps[0];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // -- Navigation Helpers --
  const handleNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setIsTimerRunning(false);
      setShowTimer(false);
    } else {
      setShowCompletion(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (sessionId) {
        updateSession(sessionId, { progress: 100, completedDate: new Date().toISOString() });
        // Award XP for completion
        awardXP("complete_cook");
      }
    }
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

  // -- Voice Control Logic --
  // We define this BEFORE useVoiceControl so it can be passed as a callback
  const handleVoiceCommand = (text: string) => {
    const cmd = text.toLowerCase();
    console.log("Voice Command:", cmd);

    if (cmd.includes("next") || cmd.includes("continue")) {
      handleNextStep();
    } else if (cmd.includes("back") || cmd.includes("previous")) {
      if (currentStep > 0) {
        setCurrentStep(prev => prev - 1);
        speak(`Going back to step ${currentStep}. ${steps[currentStep - 1].instruction}`);
      }
    } else if (cmd.includes("repeat") || cmd.includes("again")) {
      speak(step.instruction);
    } else if (cmd.includes("ingredient") || cmd.includes("what needs")) {
      const ingredientNames = recipe.ingredients.map((i: any) => i.name || i).join(", ");
      speak(`You need: ${ingredientNames}`);
    } else if (cmd.includes("timer") && cmd.includes("start")) {
      if (step.timerSeconds) {
        handleTimerPress();
        speak("Starting timer.");
      } else {
        speak("There is no timer for this step.");
      }
    }
  };

  const { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking } = useVoiceControl({
    onCommand: handleVoiceCommand,
  });

  // Auto-speak instructions when step changes
  useEffect(() => {
    const timer = setTimeout(() => {
      speak(`Step ${step.id}. ${step.instruction}`);
    }, 500);
    return () => clearTimeout(timer);
  }, [step.id]);

  const toggleListening = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Initialize or resume session
  useEffect(() => {
    const initSession = async () => {
      const existingSession = inProgressSessions.find(s => s.recipeId === recipe.id);

      if (existingSession) {
        setSessionId(existingSession.id);
        if (existingSession.currentStep && existingSession.currentStep > 0) {
          setCurrentStep(existingSession.currentStep - 1);
        }
      } else {
        const newId = Date.now().toString();
        const newSession: RecentCook = {
          id: newId,
          recipeId: recipe.id,
          title: recipe.title,
          image: recipe.videoThumbnail || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
          progress: 0,
          startedAt: new Date().toISOString(),
          totalSteps: steps.length,
          currentStep: 1,
        };
        await addSession(newSession);
        setSessionId(newId);
      }
    };

    initSession();
  }, []);

  // Update session progress
  useEffect(() => {
    if (sessionId) {
      updateSession(sessionId, {
        currentStep: currentStep + 1,
        progress: Math.round(((currentStep + 1) / steps.length) * 100),
      });
    }
  }, [currentStep, sessionId]);

  // Animation Effects
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== "web",
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
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [currentStep, feedbackAnim]);

  // Timer Logic
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

  const getFeedbackColor = (type: CookingStep["feedbackType"]) => {
    switch (type) {
      case "success": return Colors.primary;
      case "tip": return "#60a5fa";
      case "warning": return "#fbbf24";
    }
  };

  const getFeedbackIcon = (type: CookingStep["feedbackType"]) => {
    switch (type) {
      case "success": return <CheckCircle size={20} color={Colors.primary} />;
      case "tip": return <BookOpen size={20} color="#60a5fa" />;
      case "warning": return <Timer size={20} color="#fbbf24" />;
    }
  };

  if (!step) return <View style={styles.container}><Text>Loading...</Text></View>;

  if (showCompletion) {
    return (
      <View style={styles.completionContainer}>
        <ImageBackground source={{ uri: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800" }} style={styles.completionBackground}>
          <View style={styles.completionOverlay} />
          <View style={[styles.completionContent, { paddingTop: insets.top + 40 }]}>
            <View style={styles.completionBadge}>
              <Award size={48} color={Colors.primary} />
            </View>
            <Text style={styles.completionTitle}>Dish Complete!</Text>
            <TouchableOpacity style={styles.homeButton} onPress={() => router.replace("/(tabs)")}>
              <Text style={styles.homeButtonText}>Return/Done</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: step.image }} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.cameraOverlay} />
        <View style={styles.uiLayer}>
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            {/* Header Content */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={Colors.white} />
            </TouchableOpacity>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.stepIndicator}>Step {currentStep + 1}/{steps.length}</Text>
            </View>
          </View>

          <View style={styles.mainContent}>
            {/* Instruction Card */}
            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>{step.title}</Text>
              <Text style={styles.instructionText}>{step.instruction}</Text>
            </View>
          </View>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.actionButtons}>
              {/* Mic Button */}
              <TouchableOpacity
                style={[
                  styles.voiceButton,
                  isListening && styles.voiceButtonActive,
                  isSpeaking && styles.voiceButtonSpeaking // Specific style for speaking
                ]}
                onPress={toggleListening}
              >
                {isSpeaking ? (
                  <Volume2 size={24} color={Colors.primary} />
                ) : (
                  <Mic size={24} color={isListening ? Colors.backgroundDark : Colors.primary} />
                )}
                <Text style={[styles.voiceButtonText, (isListening || isSpeaking) && styles.voiceButtonTextActive]}>
                  {isSpeaking ? "Speaking..." : isListening ? "Listening..." : "Tap to Speak"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
                <ArrowRight size={24} color={Colors.backgroundDark} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  uiLayer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    gap: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  stepIndicator: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  mainContent: {
    padding: 20,
    gap: 20,
  },
  instructionCard: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  instructionTitle: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  instructionText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  footer: {
    paddingHorizontal: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  voiceButton: {
    flex: 1,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  voiceButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  voiceButtonSpeaking: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  voiceButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  voiceButtonTextActive: {
    color: Colors.backgroundDark,
  },
  nextButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionContainer: {
    flex: 1,
  },
  completionBackground: {
    flex: 1,
  },
  completionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  completionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  completionBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
  },
  homeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: Colors.primary,
    borderRadius: 16,
  },
  homeButtonText: {
    color: Colors.backgroundDark,
    fontSize: 18,
    fontWeight: '600',
  },
});
