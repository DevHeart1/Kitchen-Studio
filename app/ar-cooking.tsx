import { useRouter, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import { useSavedRecipes } from "@/contexts/SavedRecipesContext";
import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
// @ts-ignore – R3F types don't perfectly align with RN but work at runtime
import { Canvas, useFrame } from "@react-three/fiber";
// @ts-ignore
import { Float, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  X,
  ArrowRight,
  Mic,
  Award,
  Volume2,
  CheckCircle,
  BookOpen,
  Timer,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import Colors from "@/constants/colors";
import { useCookingHistory } from "@/contexts/CookingHistoryContext";
import { useInventory } from "@/contexts/InventoryContext";
import { RecentCook } from "@/types";

// --- Types ---
interface CookingStep {
  id: number;
  title: string;
  instruction: string;
  duration: string;
  image?: string;
  feedback?: string;
  timerSeconds?: number;
}

const defaultSteps: CookingStep[] = [
  {
    id: 1,
    title: "Prepare the salmon",
    instruction: "Pat the salmon fillets dry and season both sides.",
    duration: "2 min",
  },
];

// --- 3D Components ---
const FloatingInstruction = ({ text }: { text: string }) => {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state: any) => {
    if (mesh.current) {
      mesh.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      mesh.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <Html position={[0, 0.5, -3]} center transform>
        <div
          style={{
            background: "rgba(0,0,0,0.8)",
            padding: "20px",
            borderRadius: "15px",
            border: `2px solid ${Colors.primary}`,
            color: "white",
            fontFamily: "sans-serif",
            fontSize: "24px",
            width: "300px",
            textAlign: "center",
            boxShadow: "0 0 20px rgba(43, 238, 91, 0.3)",
          }}
        >
          {text}
        </div>
      </Html>
    </Float>
  );
};

const ARScene = ({ stepText }: { stepText: string }) => {
  return (
    <>
      {/* @ts-ignore */}
      <ambientLight intensity={0.5} />
      {/* @ts-ignore */}
      <pointLight position={[10, 10, 10]} />
      <FloatingInstruction text={stepText} />
    </>
  );
};

// --- Main Screen ---
export default function ARCookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, recipeData } = useLocalSearchParams<{
    id: string;
    recipeData: string;
  }>();
  const { savedRecipes } = useSavedRecipes();

  // Permissions & Inventory
  const [permission, requestPermission] = useCameraPermissions();
  const { consumeIngredients } = useInventory();

  // Recipe Parsing
  const passedRecipe = useMemo(() => {
    if (recipeData) {
      try {
        return JSON.parse(recipeData);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [recipeData]);

  const recipe =
    savedRecipes.find((r: any) => r.id === id) ||
    passedRecipe ||
    savedRecipes[0];

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // History & Session
  const { addSession, updateSession, inProgressSessions } =
    useCookingHistory();
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Steps
  const steps: CookingStep[] = useMemo(() => {
    if (recipe?.instructions?.length) {
      return recipe.instructions.map((inst: any, index: number) => ({
        id: index + 1,
        title: `Step ${inst.step}`,
        instruction: inst.text,
        duration: inst.time ? `${Math.ceil(inst.time / 60)} min` : "2 min",
        timerSeconds: inst.time,
      }));
    }
    return defaultSteps;
  }, [recipe]);

  const step = steps[currentStep] || steps[0];

  // Animation for floating label
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const floatInterpolation = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  // Speak instruction on step change
  useEffect(() => {
    if (!isMuted && step?.instruction) {
      Speech.stop();
      Speech.speak(step.instruction, {
        language: "en",
        pitch: 1.0,
        rate: 0.9,
      });
    }
  }, [currentStep, isMuted, step]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // Permission check
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Init session
  useEffect(() => {
    setIsReady(true);
  }, []);

  // --- Handlers ---
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev: number) => prev + 1);
    } else {
      setShowCompletion(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (sessionId)
        updateSession(sessionId, {
          progress: 100,
          completedDate: new Date().toISOString(),
        });
    }
  };

  const handleFinishCooking = async () => {
    setIsConsuming(true);
    try {
      if (recipe?.ingredients) {
        for (const ing of recipe.ingredients) {
          await consumeIngredients(ing.amount, ing.unit, ing.name);
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Inventory Updated",
        "Ingredients have been deducted from your pantry."
      );
    } catch (e) {
      console.error("Error deducting ingredients:", e);
      Alert.alert("Error", "Could not deduct ingredients.");
    } finally {
      setIsConsuming(false);
      router.replace("/(tabs)");
    }
  };

  const handleSkipDeduction = () => {
    router.replace("/(tabs)");
  };

  const toggleListening = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsListening(!isListening);
  };

  // --- Render ---
  if (!permission?.granted) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: "white", marginBottom: 20 }}>
          Camera permission is required for AR Cooking.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showCompletion) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.completionOverlay,
            { paddingTop: insets.top, paddingHorizontal: 20 },
          ]}
        >
          <Award size={64} color={Colors.primary} />
          <Text style={styles.completionTitle}>Cooking Complete!</Text>

          <TouchableOpacity
            style={[
              styles.btn,
              {
                marginBottom: 15,
                backgroundColor: isConsuming ? "#555" : Colors.primary,
              },
            ]}
            onPress={handleFinishCooking}
            disabled={isConsuming}
          >
            <Text style={styles.btnText}>
              {isConsuming
                ? "Updating Pantry..."
                : "Finish & Deduct Ingredients"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btn,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: "white",
              },
            ]}
            onPress={handleSkipDeduction}
          >
            <Text style={[styles.btnText, { color: "white" }]}>
              Skip Deduction
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Layer 1: Camera Background */}
      <CameraView style={StyleSheet.absoluteFill} facing="back">
        {/* Layer 2: 3D AR Overlay */}
        <View
          style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
          pointerEvents="box-none"
        >
          <Canvas>
            <Suspense fallback={null}>
              <ARScene stepText={step.instruction} />
            </Suspense>
          </Canvas>
        </View>

        {/* Layer 3: UI Controls */}
        <View style={styles.uiLayer}>
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={handleClose}
            >
              <X size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <Text style={styles.stepTitle}>
                Step {step.id} / {steps.length}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={{
                    width: `${((currentStep + 1) / steps.length) * 100}%`,
                    height: "100%",
                    backgroundColor: Colors.primary,
                  }}
                />
              </View>
            </View>
          </View>

          <View
            style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}
          >
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <Volume2
                  size={28}
                  color="white"
                  style={{ opacity: 0.5 }}
                />
              ) : (
                <Volume2 size={28} color={Colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleNextStep}
            >
              <Text style={styles.nextText}>Next Step</Text>
              <ArrowRight size={24} color={Colors.backgroundDark} />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  uiLayer: { flex: 1, justifyContent: "space-between" },
  header: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: { flex: 1, marginLeft: 15 },
  stepTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  micBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  nextBtn: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: "center",
    gap: 10,
  },
  nextText: {
    color: Colors.backgroundDark,
    fontWeight: "bold",
    fontSize: 18,
  },
  completionOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.backgroundDark,
  },
  completionTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 20,
  },
  btn: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  btnText: {
    color: Colors.backgroundDark,
    fontWeight: "bold",
    fontSize: 16,
  },
});
