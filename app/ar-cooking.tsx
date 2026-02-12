import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { PerspectiveCamera, Scene, WebGLRenderer, AmbientLight, PointLight, Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
import { useMachine } from '@xstate/react';
import { router } from 'expo-router';

import { arCookingMachine } from '@/services/ar/ARStateMachine';
import { TimelineEngine, RecipeStep } from '@/services/ar/TimelineEngine';
import { ARWebView, HandGesture } from '@/components/ar/ARWebView';
import { useInventory } from '@/contexts/InventoryContext';

// Mock Recipe for Demo
const DEMO_RECIPE: RecipeStep[] = [
  {
    id: '1',
    instruction: 'Pour 2 cups of water into the pot.',
    ingredients: [{ name: 'Water', amount: 2, unit: 'cups' }],
    durationSeconds: 120
  },
  {
    id: '2',
    instruction: 'Add 1 cup of Rice.',
    ingredients: [{ name: 'Rice', amount: 1, unit: 'cup' }],
    durationSeconds: 15
  },
  {
    id: '3',
    instruction: 'Stir gently and cover.',
    ingredients: [],
    durationSeconds: 600
  }
];

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ARCookingScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [timeline] = useState(() => new TimelineEngine(DEMO_RECIPE));
  const { deductInventory } = useInventory();
  const insets = useSafeAreaInsets();

  const [state, send] = useMachine(
    arCookingMachine.provide({
      actions: {
        triggerNextStep: () => {
          if (timeline.next()) {
            send({
              type: 'NEXT_STEP',
              nextIngredients: timeline.getActiveIngredients()
            });
          } else {
            send({ type: 'FINISH_COOKING' });
          }
        },
      }
    })
  );

  const [currentInstruction, setCurrentInstruction] = useState<string>("Initializing...");
  const [activeIngredients, setActiveIngredients] = useState<string[]>([]);
  const [gesture, setGesture] = useState<string>("None");

  // Three.js Refs
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const cubeRef = useRef<Mesh | null>(null);

  useEffect(() => {
    // Timeline Listener
    const unsubscribe = timeline.subscribe((event, data) => {
      console.log(`[Timeline] ${event}`, data);

      if (event === 'STEP_START') {
        const step = data as RecipeStep;
        setCurrentInstruction(step.instruction);
        setActiveIngredients(step.ingredients.map(i => i.name));
      } else if (event === 'INVENTORY_DEDUCT') {
        // Auto-deduct for V1
        if (deductInventory) {
          deductInventory(data.name, data.amount);
        }
      } else if (event === 'RECIPE_COMPLETE') {
        setCurrentInstruction("Recipe Complete! Enjoy.");
      }
    });

    return () => unsubscribe();
  }, [timeline, deductInventory]);

  useEffect(() => {
    if (permission?.granted) {
      send({
        type: 'START_COOKING',
        recipeId: 'demo',
        totalSteps: DEMO_RECIPE.length,
        initialIngredients: DEMO_RECIPE[0].ingredients.map(i => i.name)
      });
      timeline.start();
    }
  }, [permission]);

  const onContextCreate = async (gl: any) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    const scene = new Scene();
    sceneRef.current = scene;

    const camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    const ambientLight = new AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new PointLight(0xffffff, 1);
    pointLight.position.set(2, 2, 5);
    scene.add(pointLight);

    // Floating AR Marker (Placeholder for "Ingredient")
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    cubeRef.current = cube;
    scene.add(cube);

    const render = () => {
      requestAnimationFrame(render);
      if (cubeRef.current) {
        cubeRef.current.rotation.x += 0.01;
        cubeRef.current.rotation.y += 0.01;
      }
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  };

  const handleGesture = (g: HandGesture) => {
    setGesture(g);
    send({ type: 'GESTURE_DETECTED', gesture: g as any });
  };

  if (!permission) return <View style={[styles.container, { backgroundColor: 'black' }]} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer, { paddingTop: insets.top }]}>
        <View style={styles.permissionContent}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Kitchen Studio needs camera access to display recipe steps in your environment.
          </Text>
          <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. Underlying Camera Feed */}
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {/* 2. GL Overlay Layer */}
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} pointerEvents="none" />

      {/* 3. Logic Bridge */}
      <ARWebView onGestureDetected={handleGesture} />

      {/* 4. UI Layer */}
      <View style={[styles.uiOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <View style={[styles.badge, state.matches('paused') && styles.badgePaused]}>
            <Text style={styles.badgeText}>{state.value.toString().toUpperCase()}</Text>
          </View>
        </View>

        {/* Dynamic Instruction Panel */}
        <View style={styles.instructionCard}>
          <Text style={styles.stepTitle}>STEP {timeline.getCurrentStep() ? timeline.getCurrentStep()!.id : '-'}</Text>
          <Text style={styles.instructionText}>{currentInstruction}</Text>

          {activeIngredients.length > 0 && (
            <View style={styles.ingredientsRow}>
              {activeIngredients.map(ing => (
                <View key={ing} style={styles.ingChip}>
                  <Text style={styles.ingText}>{ing}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Text style={styles.gestureText}>Detected Gesture: {gesture}</Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => send({ type: 'VOICE_COMMAND', command: 'next' })}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>Next Step (Voice Sim)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  permissionContainer: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  permissionContent: { alignItems: 'center', maxWidth: 300 },
  permissionTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 12, textAlign: 'center' },
  permissionText: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 32 },
  permissionButton: { backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30 },
  permissionButtonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },

  uiOverlay: { flex: 1, padding: 20, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#4CAF50', borderRadius: 12 },
  badgePaused: { backgroundColor: '#FF9800' },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  instructionCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: 10
  },
  stepTitle: { color: '#666', fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  instructionText: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', lineHeight: 28 },
  ingredientsRow: { flexDirection: 'row', marginTop: 16, flexWrap: 'wrap', gap: 8 },
  ingChip: { backgroundColor: '#E8F5E9', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#C8E6C9' },
  ingText: { color: '#2E7D32', fontWeight: '600', fontSize: 14 },

  controls: { alignItems: 'center', marginBottom: 20 },
  gestureText: { color: 'rgba(255,255,255,0.8)', marginBottom: 16, fontSize: 14, fontWeight: '500' },
  actionBtn: { backgroundColor: '#2196F3', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30, alignItems: 'center', elevation: 4 },
  actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
