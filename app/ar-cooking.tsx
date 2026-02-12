import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ViroARSceneNavigator } from "@viro-community/react-viro";
import { useLocalSearchParams, useRouter } from "expo-router";
import { KitchenScene } from "@/components/ar/KitchenScene";
import Colors from "@/constants/colors";
import { StatusBar } from "expo-status-bar";

export default function ARCookingScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);

  // Parse recipe data from params
  const recipe = params.recipeData ? JSON.parse(params.recipeData as string) : null;

  const handleStepComplete = () => {
    if (recipe && stepIndex < (recipe.instructions?.length || 0) - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      // Finished
      router.back();
    }
  };

  if (!recipe) {
    return null; // Handle loading/error
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <ViroARSceneNavigator
        autofocus={true}
        initialScene={{
          scene: KitchenScene,
        }}
        viroAppProps={{
          recipe: recipe,
          currentStepIndex: stepIndex,
          onStepComplete: handleStepComplete,
        }}
        style={styles.arView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  arView: {
    flex: 1,
  },
});
