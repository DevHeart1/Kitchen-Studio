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
  Modal,
  ScrollView,
  Platform,
} from "react-native";
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
  Volume2,
  VolumeX,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Colors from "@/constants/colors";
import { useCookingHistory } from "@/contexts/CookingHistoryContext";
import { RecentCook } from "@/types";
import { DiscoverRecipe } from "@/app/(tabs)/discover";
import { supabase } from "@/lib/supabase";

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
  // ... (Other steps omitted for brevity, assuming they exist or utilize dynamic steps)
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
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const { addSession, updateSession, inProgressSessions } = useCookingHistory();
  const [sessionId, setSessionId] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  // Audio & WebSocket Refs
  const wsRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);

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

  // Setup Audio & WebSocket
  useEffect(() => {
    let isMounted = true;

    const setupAudio = async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.error("Audio permission error:", e);
      }
    };

    const connectWebSocket = () => {
      // Connect to our Supabase Edge Function
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace('http', 'ws'); // basic replace
      const functionUrl = `${supabaseUrl}/functions/v1/cooking-assistant`;

      console.log("Connecting to AI Assistant:", functionUrl);
      const ws = new WebSocket(functionUrl);

      ws.onopen = () => {
        console.log("AI Assistant Connected");
        // Send initial context
        const contextMessage = {
          type: "setup_context",
          content: `You are accompanying the user cooking "${recipe.title}". Current step ${currentStep + 1}: ${step.instruction}. Be helpful, concise, and encouraging.`
        };
        ws.send(JSON.stringify(contextMessage));
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.serverContent?.modelTurn?.parts) {
            const parts = message.serverContent.modelTurn.parts;
            for (const part of parts) {
              if (part.inlineData && part.inlineData.mimeType.startsWith('audio')) {
                // Audio chunk received
                queueAudio(part.inlineData.data);
              }
            }
          }
        } catch (e) {
          console.error("WS Message Error:", e);
        }
      };

      ws.onerror = (e) => {
        console.log("WS Error:", e);
      };

      ws.onclose = () => {
        console.log("AI Assistant Disconnected");
      };

      wsRef.current = ws;
    };

    setupAudio();
    connectWebSocket();

    return () => {
      isMounted = false;
      if (wsRef.current) wsRef.current.close();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Update context when step changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const contextMessage = {
        type: "text_input", // Just treating as text input to update context
        content: `User moved to Step ${currentStep + 1}: ${step.instruction}. Update your guidance.`
      };
      wsRef.current.send(JSON.stringify(contextMessage));
    }
  }, [currentStep]);

  const queueAudio = async (base64Data: string) => {
    audioQueueRef.current.push(base64Data);
    if (!isPlayingRef.current) {
      playNextAudio();
    }
  };

  const playNextAudio = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const audioData = audioQueueRef.current.shift();

    try {
      // Use cast because cacheDirectory might be missing in types or nullable
      const cacheDir = (FileSystem as any).cacheDirectory;
      const fileUri = `${cacheDir}temp_audio_${Date.now()}.wav`;

      await FileSystem.writeAsStringAsync(fileUri, audioData!, {
        encoding: "base64", // Using string literal "base64" to avoid type errors
      });

      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
          playNextAudio();
        }
      });

      await sound.playAsync();
    } catch (e) {
      console.error("Audio Playback Error:", e);
      isPlayingRef.current = false;
      setIsSpeaking(false);
    }
  };

  const startRecording = async () => {
    try {
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);

      recording.setOnRecordingStatusUpdate(async (status) => {
        // Status updates...
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setIsListening(true);
      console.log("Recording started");
    } catch (e) {
      console.error("Failed to start recording", e);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsListening(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });

        // Send to Gemini
        wsRef.current.send(JSON.stringify({
          type: "user_audio_chunk",
          content: base64
        }));
        console.log("Sent audio chunk");
      }
    } catch (e) {
      console.error("Failed to stop recording", e);
    }
  };

  const toggleListening = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isListening) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

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

  const handleNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setIsTimerRunning(false);
      setShowTimer(false);
    } else {
      setShowCompletion(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (sessionId) updateSession(sessionId, { progress: 100, completedDate: new Date().toISOString() });
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
            {/* ... Header Text ... */}
          </View>

          <View style={styles.mainContent}>
            {/* AR Content */}
            <Text style={styles.instructionText}>{step.instruction}</Text>
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
                  {isSpeaking ? "AI Talking..." : isListening ? "Listening..." : "Tap to Speak"}
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
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  backgroundImage: { flex: 1, width: "100%", height: "100%" },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  uiLayer: { flex: 1, justifyContent: "space-between" },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between' },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  mainContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  instructionText: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 20, textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 10 },
  footer: { padding: 16 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voiceButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, gap: 10 },
  voiceButtonActive: { backgroundColor: Colors.primary },
  voiceButtonSpeaking: { backgroundColor: '#8b5cf6' }, // Purple when AI speaks
  voiceButtonText: { color: 'white', fontWeight: 'bold' },
  voiceButtonTextActive: { color: Colors.backgroundDark },
  nextButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  completionContainer: { flex: 1 },
  completionBackground: { flex: 1 },
  completionOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  completionContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  completionBadge: { marginBottom: 20 },
  completionTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 10 },
  homeButton: { backgroundColor: Colors.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
  homeButtonText: { fontWeight: 'bold', color: Colors.backgroundDark }
});
