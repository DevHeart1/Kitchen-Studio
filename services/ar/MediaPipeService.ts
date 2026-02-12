import { Platform } from 'react-native';
import { HandDetectionResult, PoseDetectionResult, DetectionFrame } from '@/types/ar';
import { recognizeGesture, resetGestureBuffer } from './GestureRecognizer';

const VISION_WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const HAND_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';
const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

let handLandmarker: any = null;
let poseLandmarker: any = null;
let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

export async function initMediaPipe(): Promise<boolean> {
  if (Platform.OS !== 'web') return false;
  if (isInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const { FilesetResolver, HandLandmarker, PoseLandmarker } = vision;

      const wasmFileset = await FilesetResolver.forVisionTasks(VISION_WASM_URL);

      handLandmarker = await HandLandmarker.createFromOptions(wasmFileset, {
        baseOptions: { modelAssetPath: HAND_MODEL_URL },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      poseLandmarker = await PoseLandmarker.createFromOptions(wasmFileset, {
        baseOptions: { modelAssetPath: POSE_MODEL_URL },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      isInitialized = true;
      console.log('[MediaPipe] Initialized hand + pose landmarkers');
      return true;
    } catch (error) {
      console.error('[MediaPipe] Init failed:', error);
      isInitialized = false;
      initPromise = null;
      return false;
    }
  })();

  return initPromise;
}

export function processFrame(
  videoElement: HTMLVideoElement,
  timestamp: number
): DetectionFrame {
  let hands: HandDetectionResult | null = null;
  let pose: PoseDetectionResult | null = null;

  if (handLandmarker) {
    try {
      const handResult = handLandmarker.detectForVideo(videoElement, timestamp);
      if (handResult.landmarks && handResult.landmarks.length > 0) {
        hands = {
          landmarks: handResult.landmarks.map((hand: any[]) =>
            hand.map((lm: any) => ({ x: lm.x, y: lm.y, z: lm.z }))
          ),
          handedness: handResult.handedness?.map(
            (h: any[]) => h[0]?.categoryName || 'Unknown'
          ) || [],
        };
      }
    } catch (e) {
      // skip frame on error
    }
  }

  if (poseLandmarker) {
    try {
      const poseResult = poseLandmarker.detectForVideo(videoElement, timestamp);
      if (poseResult.landmarks && poseResult.landmarks.length > 0) {
        pose = {
          landmarks: poseResult.landmarks[0].map((lm: any) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility ?? 0,
          })),
        };
      }
    } catch (e) {
      // skip frame on error
    }
  }

  const { gesture, confidence } = recognizeGesture(hands?.landmarks || null);

  return { hands, pose, gesture, gestureConfidence: confidence, timestamp };
}

export function destroyMediaPipe(): void {
  if (handLandmarker) {
    handLandmarker.close();
    handLandmarker = null;
  }
  if (poseLandmarker) {
    poseLandmarker.close();
    poseLandmarker = null;
  }
  isInitialized = false;
  initPromise = null;
  resetGestureBuffer();
  console.log('[MediaPipe] Destroyed');
}

export function getInitStatus(): boolean {
  return isInitialized;
}
