export type GestureType =
  | 'open_hand'
  | 'pinch'
  | 'fist'
  | 'thumbs_up'
  | 'point'
  | 'none';

export type ARCookingPhase =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'cooking'
  | 'paused'
  | 'step_transitioning'
  | 'complete';

export interface HandLandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface PoseLandmarkPoint {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface HandDetectionResult {
  landmarks: HandLandmarkPoint[][];
  handedness: string[];
}

export interface PoseDetectionResult {
  landmarks: PoseLandmarkPoint[];
}

export interface DetectionFrame {
  hands: HandDetectionResult | null;
  pose: PoseDetectionResult | null;
  gesture: GestureType;
  gestureConfidence: number;
  timestamp: number;
}

export interface TimelineStep {
  id: number;
  title: string;
  text: string;
  duration: number;
  ingredient?: string;
  amount?: number;
  unit?: string;
  highlight?: string;
  image?: string;
  autoAdvance?: boolean;
}

export interface IngredientOverlay {
  name: string;
  quantity: number;
  unit: string;
  status: 'enough' | 'low' | 'missing' | 'substitute';
  color: string;
}

export interface ARSessionStats {
  totalCookTime: number;
  ingredientsUsed: { name: string; amount: number; unit: string }[];
  ingredientsRemaining: { name: string; amount: number; unit: string }[];
  stepsCompleted: number;
  totalSteps: number;
  xpEarned: number;
}

export type AREvent =
  | { type: 'INIT' }
  | { type: 'LOADED' }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'STEP_COMPLETE' }
  | { type: 'RECIPE_COMPLETE' }
  | { type: 'GESTURE'; gesture: GestureType; confidence: number }
  | { type: 'VOICE_COMMAND'; command: string }
  | { type: 'TIMER_DONE' }
  | { type: 'EXIT' };
