import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSavedRecipes } from '@/contexts/SavedRecipesContext';
import { useARSession } from '@/hooks/useARSession';
import CameraFeed from '@/components/ar/CameraFeed';
import AROverlayLayer from '@/components/ar/AROverlayLayer';
import ARCompletionPanel from '@/components/ar/ARCompletionPanel';

export default function ARCookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, recipeData } = useLocalSearchParams<{
    id: string;
    recipeData: string;
  }>();
  const { savedRecipes } = useSavedRecipes();

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
    savedRecipes.find((r) => r.id === id) || passedRecipe || savedRecipes[0];

  const recipeIngredients = useMemo(() => {
    if (!recipe?.ingredients) return [];
    return recipe.ingredients.map((ing: any) => ({
      name: ing.name || ing,
      amount: ing.amount || '1',
      unit: ing.unit || '',
    }));
  }, [recipe]);

  const recipeInstructions = useMemo(() => {
    if (!recipe?.instructions) return [{ step: 1, text: 'Follow the recipe', time: 0 }];
    return recipe.instructions;
  }, [recipe]);

  const {
    phase,
    currentStep,
    currentStepIndex,
    totalSteps,
    elapsed,
    progress,
    lastGesture,
    gestureConfidence,
    ingredientOverlays,
    sessionStats,
    isListening,
    isSpeaking,
    handleFrame,
    handleMediaPipeReady,
    handleInit,
    handleStart,
    handlePause,
    handleResume,
    handleNext,
    handlePrev,
    handleToggleMic,
    handleExit,
  } = useARSession({
    recipeId: recipe?.id || 'unknown',
    recipeTitle: recipe?.title || 'Recipe',
    recipeImage:
      recipe?.videoThumbnail ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    recipeIngredients,
    recipeInstructions,
  });

  useEffect(() => {
    handleInit();
  }, [handleInit]);

  const onClose = () => {
    hapticFeedback();
    handleExit();
    router.back();
  };

  const onNext = () => {
    hapticFeedback();
    handleNext();
  };

  const onPrev = () => {
    hapticFeedback();
    handlePrev();
  };

  const onPause = () => {
    hapticFeedback();
    handlePause();
  };

  const onResume = () => {
    hapticFeedback();
    handleResume();
  };

  const onStart = () => {
    hapticFeedback();
    handleStart();
  };

  const onGoHome = () => {
    hapticFeedback();
    router.replace('/(tabs)');
  };

  const onShare = () => {
    hapticFeedback();
  };

  const onRestart = () => {
    hapticFeedback();
    router.replace({
      pathname: '/ar-cooking',
      params: { id: recipe?.id, recipeData: recipeData || '' },
    });
  };

  if (phase === 'complete') {
    return (
      <ARCompletionPanel
        recipeTitle={recipe?.title || 'Recipe'}
        stats={sessionStats}
        onGoHome={onGoHome}
        onShare={onShare}
        onRestart={onRestart}
        insets={insets}
      />
    );
  }

  return (
    <View style={styles.container}>
      <CameraFeed
        isActive={phase !== 'idle'}
        onFrame={handleFrame}
        onMediaPipeReady={handleMediaPipeReady}
        showDebug={false}
      />

      <View style={styles.darkOverlay} />

      <AROverlayLayer
        phase={phase}
        currentStep={currentStep}
        stepIndex={currentStepIndex}
        totalSteps={totalSteps}
        elapsed={elapsed}
        progress={progress}
        gesture={lastGesture}
        gestureConfidence={gestureConfidence}
        ingredients={ingredientOverlays}
        isListening={isListening}
        isSpeaking={isSpeaking}
        onClose={onClose}
        onNext={onNext}
        onPrev={onPrev}
        onPause={onPause}
        onResume={onResume}
        onStart={onStart}
        onToggleMic={handleToggleMic}
        insets={insets}
      />
    </View>
  );
}

function hapticFeedback() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
    pointerEvents: 'none',
  },
});
