import { StyleSheet, View } from "react-native";
import { ViroARSceneNavigator } from "@viro-community/react-viro";
import { useLocalSearchParams, useRouter } from "expo-router";
import { KitchenScene } from "@/components/ar/KitchenScene";
import { useRecipe } from "@/hooks/useRecipe";
import { useARSession } from "@/hooks/useARSession";
import { useState, useEffect } from "react";

export default function ARCookingScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const router = useRouter();
  const { recipe, loading } = useRecipe(recipeId);

  // Parse ingredients and instructions for useARSession
  const recipeIngredients = recipe?.ingredients?.map((i: any) => ({
    name: i.ingredient || i.name,
    amount: i.amount?.toString() || "1",
    unit: i.unit || "pcs"
  })) || [];

  const recipeInstructions = recipe?.instructions?.map((i: any, index: number) => ({
    step: index + 1,
    text: i.step,
    time: i.timerSeconds || 0
  })) || [];

  // Initialize the AR Session Engine (State Machine + Timeline + XP)
  const session = useARSession({
    recipeId: recipeId || "unknown",
    recipeTitle: recipe?.title || "Unknown Recipe",
    recipeImage: recipe?.image || "",
    recipeIngredients,
    recipeInstructions,
  });

  if (loading || !recipe) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <ViroARSceneNavigator
        autofocus={true}
        initialScene={{
          scene: KitchenScene,
        }}
        viroAppProps={{
          recipe: recipe,
          currentStepIndex: session.currentStepIndex,
          onStepComplete: session.handleNext,
          onPanPlaced: session.handleStart, // Start the timeline when pan is placed
          session: session // Pass full session if needed for advanced features
        }}
        style={styles.f1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  f1: { flex: 1 },
  container: { flex: 1, backgroundColor: "black" },
});
