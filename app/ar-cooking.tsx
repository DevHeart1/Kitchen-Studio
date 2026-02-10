// import * as Speech from "expo-speech"; // Removed for Gemini Audio
import { useGeminiAudio } from "@/hooks/useGeminiAudio";
import { useSavedRecipes } from "@/contexts/SavedRecipesContext";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import * as THREE from "three";
import {
  X,
  ArrowRight,
  Award,
  Volume2,
  VolumeX,
  RotateCcw,
  Check,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useCookingHistory } from "@/contexts/CookingHistoryContext";
import { useInventory } from "@/contexts/InventoryContext";

// --- Types ---
interface CookingStep {
  id: number;
  title: string;
  instruction: string;
  duration: string;
  timerSeconds?: number;
}

interface IngredientMarker3D {
  name: string;
  amount: number;
  unit: string;
  mesh: THREE.Mesh;
  consumed: boolean;
}

const defaultSteps: CookingStep[] = [
  {
    id: 1,
    title: "Prepare the salmon",
    instruction: "Pat the salmon fillets dry and season both sides.",
    duration: "2 min",
  },
];

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export default function ARCookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, recipeData } = useLocalSearchParams<{
    id: string;
    recipeData: string;
  }>();

  const { savedRecipes } = useSavedRecipes();
  // Audio Hook
  const { speak, stop: stopAudio, isSpeaking } = useGeminiAudio();

  // Permissions & Inventory
  const [permission, requestPermission] = useCameraPermissions();
  const { consumeIngredients } = useInventory();

  // Recipe Parsing
  const passedRecipe = useMemo(() => {
    if (recipeData) {
      try {
        return JSON.parse(recipeData);
      } catch {
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
  const [showCompletion, setShowCompletion] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // History & Session
  const { addSession, updateSession } = useCookingHistory();
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Steps
  const steps: CookingStep[] = useMemo(() => {
    if (recipe?.instructions?.length) {
      return recipe.instructions.map((inst: any, index: number) => ({
        id: index + 1,
        title: `Step ${inst.step || index + 1}`,
        instruction: inst.text,
        duration: inst.time ? `${Math.ceil(inst.time / 60)} min` : "2 min",
        timerSeconds: inst.time,
      }));
    }
    return defaultSteps;
  }, [recipe]);

  const step = steps[currentStep] || steps[0];

  // Ingredients for markers (limit to 6 for screen space)
  const ingredients = useMemo(() => {
    if (recipe?.ingredients?.length) {
      return recipe.ingredients.slice(0, 6).map((ing: any) => ({
        name: ing.name || ing,
        amount: ing.amount || 1,
        unit: ing.unit || "count",
      }));
    }
    return [];
  }, [recipe]);

  // Track consumed state in React for UI updates
  const [consumedIngredients, setConsumedIngredients] = useState<Set<string>>(
    new Set()
  );

  // Three.js refs (kept across renders)
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<any>(null);
  const ingredientMarkersRef = useRef<IngredientMarker3D[]>([]);
  const animFrameRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());
  const glRef = useRef<any>(null);

  // ─── Speak instruction on step change ────────────────────────────
  useEffect(() => {
    if (!isMuted && step?.instruction) {
      stopAudio();
      // Speech.speak(...) -> Gemini Audio
      speak(step.instruction);
    }
  }, [currentStep, isMuted, step, speak, stopAudio]);

  // Cleanup speech & animation on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [stopAudio]);

  // Permission check
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // ─── GLView onContextCreate ──────────────────────────────────────
  const onContextCreate = useCallback(
    async (gl: any) => {
      glRef.current = gl;

      // Renderer
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0x000000, 0); // Transparent!
      rendererRef.current = renderer;

      // Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(
        75,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
      camera.position.z = 5;
      cameraRef.current = camera;

      // Lighting
      const ambient = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambient);
      const point = new THREE.PointLight(0xffffff, 0.8, 100);
      point.position.set(5, 5, 5);
      scene.add(point);

      // ── Ingredient Markers (3D Spheres) ────────────────────────
      const markers: IngredientMarker3D[] = [];
      const maxMarkers = ingredients.length;

      for (let i = 0; i < maxMarkers; i++) {
        const ing = ingredients[i];

        // Geometry: Sphere
        const sphereGeo = new THREE.SphereGeometry(0.35, 32, 32);
        const sphereMat = new THREE.MeshPhongMaterial({
          color: new THREE.Color(Colors.primary),
          transparent: true,
          opacity: 0.8,
          emissive: new THREE.Color(Colors.primary),
          emissiveIntensity: 0.4,
          shininess: 100,
        });
        const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);

        // Position in arc at bottom of screen
        // Spread evenly across width
        const xPos = ((i - (maxMarkers - 1) / 2) * 1.2);
        const yPos = -2.0; // Lower third

        sphereMesh.position.set(xPos, yPos, 0);

        sphereMesh.userData = {
          ingredientName: ing.name,
          ingredientAmount: ing.amount,
          ingredientUnit: ing.unit,
          isIngredientMarker: true,
        };
        scene.add(sphereMesh);

        markers.push({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          mesh: sphereMesh,
          consumed: false,
        });
      }
      ingredientMarkersRef.current = markers;

      // ── Animation Loop ─────────────────────────────────────────
      const animate = () => {
        animFrameRef.current = requestAnimationFrame(animate);
        const elapsed = clockRef.current.getElapsedTime();

        // Animate markers (bob + pulse)
        markers.forEach((marker, i) => {
          if (!marker.consumed) {
            // Active state: bobbing + glowing
            marker.mesh.position.y = -2.0 + Math.sin(elapsed * 2 + i) * 0.1;
            marker.mesh.scale.setScalar(1 + Math.sin(elapsed * 3 + i) * 0.05);
            (marker.mesh.material as THREE.MeshPhongMaterial).emissiveIntensity =
              0.4 + Math.sin(elapsed * 4 + i) * 0.2;
          } else {
            // Consumed state: static + dim
            marker.mesh.position.y = -2.0;
            marker.mesh.scale.setScalar(0.8);
          }
        });

        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      animate();
    },
    [ingredients]
  );

  // ─── Handle Tap on GL Surface (Raycasting) ───────────────────────
  const handleGLTap = useCallback(
    (event: any) => {
      if (!sceneRef.current || !cameraRef.current || !glRef.current) return;

      const { locationX, locationY } = event.nativeEvent;

      // Normalize to NDC (-1 to +1)
      const x = (locationX / SCREEN_W) * 2 - 1;
      const y = -(locationY / SCREEN_H) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

      // Test against ingredient markers
      const markerMeshes = ingredientMarkersRef.current.map((m) => m.mesh);
      const intersects = raycaster.intersectObjects(markerMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const data = hit.userData;

        if (data.isIngredientMarker) {
          const markerIndex = ingredientMarkersRef.current.findIndex(
            (m) => m.name === data.ingredientName
          );
          const marker = ingredientMarkersRef.current[markerIndex];

          if (marker && !marker.consumed) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

            // Mark as consumed in Ref (for 3D loop)
            marker.consumed = true;

            // Visual update: grey out
            (marker.mesh.material as THREE.MeshPhongMaterial).color.set(0x444444);
            (marker.mesh.material as THREE.MeshPhongMaterial).emissive.set(0x000000);
            (marker.mesh.material as THREE.MeshPhongMaterial).opacity = 0.3;

            // Update React state (for UI overlay)
            setConsumedIngredients((prev) => {
              const next = new Set(prev);
              next.add(data.ingredientName);
              return next;
            });

            // Trigger actual deduction
            consumeIngredients(
              data.ingredientAmount,
              data.ingredientUnit,
              data.ingredientName
            );
          }
        }
      }
    },
    [consumeIngredients]
  );

  // ─── Update UI when marker tapped ────────────────────────────────

  // Handlers
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    stopAudio();
    router.back();
  };

  const handleNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
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

  const handlePrevStep = () => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleRepeatAudio = () => {
    if (step?.instruction) {
      stopAudio();
      speak(step.instruction);
    }
  };

  const handleFinishCooking = async () => {
    setIsConsuming(true);
    try {
      // Deduct any remaining un-tapped ingredients
      if (recipe?.ingredients) {
        for (const ing of recipe.ingredients) {
          if (!consumedIngredients.has(ing.name)) {
            await consumeIngredients(
              ing.amount || 1,
              ing.unit || "count",
              ing.name
            );
          }
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Inventory Updated",
        "All remaining ingredients have been deducted from your pantry."
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

  // ─── Render: Permission Gate ─────────────────────────────────────
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
        <Text style={styles.permissionText}>
          Camera permission is required for AR Cooking.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Render: Completion Screen ───────────────────────────────────
  if (showCompletion) {
    const consumedCount = consumedIngredients.size;
    const totalIngredients = ingredients.length;

    return (
      <View style={styles.container}>
        <View
          style={[
            styles.completionOverlay,
            { paddingTop: insets.top + 20, paddingHorizontal: 20 },
          ]}
        >
          <Award size={64} color={Colors.primary} />
          <Text style={styles.completionTitle}>Cooking Complete!</Text>

          {/* Summary Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{steps.length}</Text>
              <Text style={styles.statLabel}>Steps Done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{consumedCount}</Text>
              <Text style={styles.statLabel}>Deducted</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {Math.max(0, totalIngredients - consumedCount)}
              </Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.btn,
              {
                marginBottom: 15,
                backgroundColor: isConsuming ? "#555" : Colors.primary,
                width: "100%",
              },
            ]}
            onPress={handleFinishCooking}
            disabled={isConsuming}
          >
            <Text style={styles.btnText}>
              {isConsuming
                ? "Updating Pantry..."
                : "Finish & Deduct All Remaining"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btn,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
                width: "100%",
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

  // ─── Render: Main AR Screen ──────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Layer 1: Camera Background */}
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {/* Layer 2: Three.js GL Overlay */}
      <GLView
        style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
        onContextCreate={onContextCreate}
        onTouchEnd={handleGLTap}
      />

      {/* Layer 3: Native UI Overlays (Text Labels) */}
      <View style={[styles.uiLayer, { zIndex: 2 }]} pointerEvents="box-none">

        {/* Floating Instruction Card (Simulated 3D) */}
        <View style={[styles.instructionCard, { top: insets.top + 80 }]}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Step {step.id} of {steps.length}</Text>
          </View>
          <Text style={styles.instructionText}>{step.instruction}</Text>
        </View>

        {/* Ingredient Labels (Simulated 3D tracking via fixed layout matching spheres) */}
        <View style={styles.ingredientLabelsContainer} pointerEvents="none">
          {ingredients.map((ing: any, i: number) => {
            const isConsumed = consumedIngredients.has(ing.name);
            // Simple grid layout matching the 3D arc
            // This is an approximation. Ideally we project worldToScreen, 
            // but fixed layout works for "HUD" style AR.
            return (
              <View key={i} style={[styles.ingredientLabelItem, { opacity: isConsumed ? 0.5 : 1 }]}>
                {isConsumed && <Check size={16} color={Colors.primary} style={{ marginBottom: 4 }} />}
                <Text style={[styles.ingredientName, isConsumed && { textDecorationLine: 'line-through', color: '#888' }]}>
                  {ing.name}
                </Text>
                {!isConsumed && <Text style={styles.ingredientAmount}>{ing.amount} {ing.unit}</Text>}
              </View>
            );
          })}
        </View>

        {/* Header Controls */}
        <View
          style={[styles.header, { paddingTop: insets.top + 10 }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity style={styles.circleBtn} onPress={handleClose}>
            <X size={22} color="white" />
          </TouchableOpacity>

          <View style={styles.progressContainer} pointerEvents="none">
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${((currentStep + 1) / steps.length) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => setIsMuted(!isMuted)}
          >
            {isMuted ? (
              <VolumeX size={22} color="white" style={{ opacity: 0.5 }} />
            ) : (
              <Volume2 size={22} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Controls */}
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={[
              styles.circleBtn,
              currentStep === 0 && { opacity: 0.3 },
            ]}
            onPress={handlePrevStep}
            disabled={currentStep === 0}
          >
            <ArrowRight
              size={22}
              color="white"
              style={{ transform: [{ rotate: "180deg" }] }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleBtn}
            onPress={handleRepeatAudio}
          >
            <RotateCcw size={22} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextBtn}
            onPress={handleNextStep}
          >
            <Text style={styles.nextText}>
              {currentStep === steps.length - 1 ? "Finish" : "Next Step"}
            </Text>
            <ArrowRight size={22} color={Colors.backgroundDark} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  uiLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  header: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  instructionCard: {
    position: 'absolute',
    alignSelf: 'center',
    width: '90%',
    backgroundColor: 'rgba(10, 12, 16, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  stepBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepBadgeText: {
    color: '#0A0C10',
    fontWeight: 'bold',
    fontSize: 12,
  },
  instructionText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  ingredientLabelsContainer: {
    position: 'absolute',
    bottom: 120,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
  },
  ingredientLabelItem: {
    alignItems: 'center',
    width: 60,
  },
  ingredientName: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  ingredientAmount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    marginTop: 2,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  progressContainer: { flex: 1 },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  nextBtn: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 28,
    alignItems: "center",
    gap: 8,
  },
  nextText: {
    color: Colors.backgroundDark,
    fontWeight: "bold",
    fontSize: 16,
  },
  permissionText: {
    color: "white",
    marginBottom: 20,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 40,
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
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: { alignItems: "center" },
  statNumber: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: "bold",
  },
  statLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  btn: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: "center",
  },
  btnText: {
    color: Colors.backgroundDark,
    fontWeight: "bold",
    fontSize: 16,
  },
});
