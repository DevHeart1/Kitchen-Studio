import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Mic,
  Volume2,
  Pause,
  Play,
  Timer,
  Hand,
  Eye,
  Zap,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { GestureType, IngredientOverlay, ARCookingPhase, TimelineStep } from '@/types/ar';

interface AROverlayLayerProps {
  phase: ARCookingPhase;
  currentStep: TimelineStep | null;
  stepIndex: number;
  totalSteps: number;
  elapsed: number;
  progress: number;
  gesture: GestureType;
  gestureConfidence: number;
  ingredients: IngredientOverlay[];
  isListening: boolean;
  isSpeaking: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onPause: () => void;
  onResume: () => void;
  onStart: () => void;
  onToggleMic: () => void;
  insets: { top: number; bottom: number };
}

export default function AROverlayLayer({
  phase,
  currentStep,
  stepIndex,
  totalSteps,
  elapsed,
  progress,
  gesture,
  gestureConfidence,
  ingredients,
  isListening,
  isSpeaking,
  onClose,
  onNext,
  onPrev,
  onPause,
  onResume,
  onStart,
  onToggleMic,
  insets,
}: AROverlayLayerProps) {
  const gestureAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const instructionSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (gesture !== 'none') {
      gestureAnim.setValue(0);
      Animated.sequence([
        Animated.timing(gestureAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.delay(800),
        Animated.timing(gestureAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [gesture]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  useEffect(() => {
    instructionSlide.setValue(0);
    Animated.spring(instructionSlide, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [stepIndex]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remaining = currentStep ? Math.max(0, currentStep.duration - elapsed) : 0;

  return (
    <View style={[styles.container]} pointerEvents="box-none">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={22} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressSegment,
                  i <= stepIndex && styles.progressSegmentActive,
                  i === stepIndex && styles.progressSegmentCurrent,
                ]}
              />
            ))}
          </View>
          <Text style={styles.stepCounter}>
            {stepIndex + 1} / {totalSteps}
          </Text>
        </View>

        {phase === 'cooking' && currentStep && (currentStep.duration || 0) > 0 && (
          <View style={styles.timerPill}>
            <Timer size={14} color={remaining < 10 ? Colors.red : Colors.primary} />
            <Text
              style={[
                styles.timerText,
                remaining < 10 && styles.timerTextUrgent,
              ]}
            >
              {formatTime(remaining)}
            </Text>
          </View>
        )}
      </View>

      {/* Gesture Indicator */}
      {gesture !== 'none' && (
        <Animated.View
          style={[
            styles.gestureIndicator,
            { opacity: gestureAnim, top: insets.top + 64 },
          ]}
        >
          <View style={styles.gesturePill}>
            <Hand size={18} color={Colors.primary} />
            <Text style={styles.gestureText}>
              {getGestureLabel(gesture)}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Ingredient Overlays */}
      {phase === 'cooking' && ingredients.length > 0 && (
        <View style={styles.ingredientBar}>
          {ingredients.slice(0, 4).map((ing, i) => (
            <View
              key={ing.name}
              style={[
                styles.ingredientChip,
                { borderColor: ing.color },
              ]}
            >
              <View style={[styles.ingredientDot, { backgroundColor: ing.color }]} />
              <Text style={styles.ingredientName} numberOfLines={1}>
                {ing.name}
              </Text>
              <Text style={[styles.ingredientAmount, { color: ing.color }]}>
                {ing.quantity} {ing.unit}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Ready Screen */}
      {phase === 'ready' && (
        <View style={styles.readyOverlay}>
          <View style={styles.readyCard}>
            <Zap size={32} color={Colors.primary} />
            <Text style={styles.readyTitle}>AR Kitchen Ready</Text>
            <Text style={styles.readySubtitle}>
              Hand tracking + pose detection active
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={onStart}>
              <Text style={styles.startButtonText}>Start Cooking</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Instruction Panel */}
      {(phase === 'cooking' || phase === 'paused') && currentStep && (
        <Animated.View
          style={[
            styles.instructionContainer,
            {
              opacity: instructionSlide,
              transform: [
                {
                  translateY: instructionSlide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.instructionCard}>
            <View style={styles.instructionHeader}>
              <Text style={styles.instructionStep}>{currentStep.title}</Text>
              {currentStep.ingredient && (
                <View style={styles.ingredientTag}>
                  <Text style={styles.ingredientTagText}>
                    {currentStep.ingredient}
                    {currentStep.amount ? ` - ${currentStep.amount} ${currentStep.unit || ''}` : ''}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.instructionText}>{currentStep.text}</Text>
          </View>
        </Animated.View>
      )}

      {/* Paused Overlay */}
      {phase === 'paused' && (
        <View style={styles.pausedOverlay}>
          <View style={styles.pausedCard}>
            <Pause size={28} color={Colors.secondary} />
            <Text style={styles.pausedText}>Paused</Text>
            <Text style={styles.pausedHint}>
              Open hand to resume or tap play
            </Text>
          </View>
        </View>
      )}

      {/* Footer Controls */}
      {(phase === 'cooking' || phase === 'paused') && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={onPrev}
            >
              <ArrowLeft size={20} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.voiceButton,
                isListening && styles.voiceButtonListening,
                isSpeaking && styles.voiceButtonSpeaking,
              ]}
              onPress={onToggleMic}
            >
              {isSpeaking ? (
                <Volume2 size={22} color={Colors.backgroundDark} />
              ) : (
                <Mic
                  size={22}
                  color={isListening ? Colors.backgroundDark : Colors.primary}
                />
              )}
              <Text
                style={[
                  styles.voiceLabel,
                  (isListening || isSpeaking) && styles.voiceLabelActive,
                ]}
              >
                {isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Voice'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlButton,
                phase === 'paused' ? styles.playButton : styles.pauseButton,
              ]}
              onPress={phase === 'paused' ? onResume : onPause}
            >
              {phase === 'paused' ? (
                <Play size={20} color={Colors.backgroundDark} />
              ) : (
                <Pause size={20} color={Colors.white} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextButton} onPress={onNext}>
              <ArrowRight size={22} color={Colors.backgroundDark} />
            </TouchableOpacity>
          </View>

          {/* Gesture Hints */}
          <View style={styles.gestureHints}>
            <Text style={styles.gestureHint}>Open hand = pause</Text>
            <Text style={styles.gestureHintDot}>-</Text>
            <Text style={styles.gestureHint}>Pinch = next</Text>
            <Text style={styles.gestureHintDot}>-</Text>
            <Text style={styles.gestureHint}>Thumbs up = done</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function getGestureLabel(gesture: GestureType): string {
  switch (gesture) {
    case 'open_hand': return 'Open Hand - Pause';
    case 'pinch': return 'Pinch - Next Step';
    case 'fist': return 'Fist Detected';
    case 'thumbs_up': return 'Thumbs Up - Complete';
    case 'point': return 'Pointing';
    default: return '';
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  progressTrack: {
    flexDirection: 'row',
    gap: 3,
    height: 4,
  },
  progressSegment: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressSegmentActive: {
    backgroundColor: Colors.primary,
  },
  progressSegmentCurrent: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  stepCounter: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timerText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerTextUrgent: {
    color: Colors.red,
  },
  gestureIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  gesturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  gestureText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  ingredientBar: {
    position: 'absolute',
    top: 120,
    left: 12,
    right: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  ingredientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ingredientName: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 80,
  },
  ingredientAmount: {
    fontSize: 11,
    fontWeight: '700',
  },
  readyOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyCard: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 32,
    borderRadius: 28,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(43,238,91,0.3)',
    maxWidth: 320,
  },
  readyTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  readySubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  startButton: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 28,
  },
  startButtonText: {
    color: Colors.backgroundDark,
    fontSize: 17,
    fontWeight: '700',
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 180,
    left: 16,
    right: 16,
  },
  instructionCard: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    // backdropFilter applied via web-only style
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  instructionStep: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ingredientTag: {
    backgroundColor: 'rgba(43,238,91,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ingredientTagText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  instructionText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  pausedOverlay: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pausedCard: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  pausedText: {
    color: Colors.secondary,
    fontSize: 24,
    fontWeight: '700',
  },
  pausedHint: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    gap: 8,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  pauseButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  playButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  voiceButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  voiceButtonListening: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  voiceButtonSpeaking: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  voiceLabel: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  voiceLabelActive: {
    color: Colors.backgroundDark,
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gestureHints: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 4,
  },
  gestureHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
  },
  gestureHintDot: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
  },
});
