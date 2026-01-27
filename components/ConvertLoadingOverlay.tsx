import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Sparkles, Scan, ChefHat, CheckCircle } from "lucide-react-native";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");

interface ConvertLoadingOverlayProps {
  visible: boolean;
  onComplete: () => void;
}

const stages = [
  { icon: Scan, text: "Analyzing video content...", duration: 1500 },
  { icon: Sparkles, text: "Extracting ingredients with AI...", duration: 2000 },
  { icon: ChefHat, text: "Matching with your pantry...", duration: 1500 },
  { icon: CheckCircle, text: "Recipe ready!", duration: 800 },
];

export default function ConvertLoadingOverlay({
  visible,
  onComplete,
}: ConvertLoadingOverlayProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const stageOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setCurrentStage(0);
      progressAnim.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      const rotateLoop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateLoop.start();

      let totalDuration = 0;
      stages.forEach((stage, index) => {
        setTimeout(() => {
          Animated.sequence([
            Animated.timing(stageOpacity, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(stageOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
          setCurrentStage(index);
        }, totalDuration);

        const progressTarget = ((index + 1) / stages.length) * 100;
        Animated.timing(progressAnim, {
          toValue: progressTarget,
          duration: stage.duration,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();

        totalDuration += stage.duration;
      });

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          pulseLoop.stop();
          rotateLoop.stop();
          onComplete();
        });
      }, totalDuration + 300);

      return () => {
        pulseLoop.stop();
        rotateLoop.stop();
      };
    }
  }, [visible]);

  const CurrentIcon = stages[currentStage]?.icon || Scan;
  const currentText = stages[currentStage]?.text || "";

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.glowContainer}>
            <Animated.View
              style={[
                styles.glowRing,
                styles.glowRingOuter,
                { transform: [{ rotate: spin }, { scale: pulseAnim }] },
              ]}
            />
            <Animated.View
              style={[
                styles.glowRing,
                styles.glowRingMiddle,
                {
                  transform: [
                    { rotate: spin },
                    { scaleX: -1 },
                    { scale: pulseAnim },
                  ],
                },
              ]}
            />
            <View style={styles.iconContainer}>
              <Animated.View style={{ opacity: stageOpacity }}>
                <CurrentIcon
                  size={40}
                  color={Colors.primary}
                  strokeWidth={2}
                />
              </Animated.View>
            </View>
          </View>

          <Animated.Text style={[styles.statusText, { opacity: stageOpacity }]}>
            {currentText}
          </Animated.Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[styles.progressFill, { width: progressWidth }]}
              />
            </View>
            <View style={styles.stagesIndicator}>
              {stages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.stageDot,
                    index <= currentStage && styles.stageDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.particles}>
            {[...Array(6)].map((_, i) => (
              <ParticleAnimation key={i} index={i} />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function ParticleAnimation({ index }: { index: number }) {
  const animValue = useRef(new Animated.Value(0)).current;
  const angle = (index / 6) * Math.PI * 2;
  const radius = 90;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 2000 + index * 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 2000 + index * 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: Math.cos(angle) * radius + radius,
          top: Math.sin(angle) * radius + radius,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(16, 34, 21, 0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    width: width * 0.85,
  },
  glowContainer: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  glowRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },
  glowRingOuter: {
    borderColor: "rgba(43, 238, 91, 0.3)",
    borderStyle: "dashed",
  },
  glowRingMiddle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderColor: "rgba(43, 238, 91, 0.5)",
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(43, 238, 91, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(43, 238, 91, 0.3)",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.white,
    textAlign: "center",
    marginBottom: 32,
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(43, 238, 91, 0.15)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  stagesIndicator: {
    flexDirection: "row",
    gap: 8,
  },
  stageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(43, 238, 91, 0.2)",
  },
  stageDotActive: {
    backgroundColor: Colors.primary,
  },
  particles: {
    position: "absolute",
    width: 180,
    height: 180,
    top: -20,
  },
  particle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
});
