import { GestureType, HandLandmarkPoint } from '@/types/ar';

const THUMB_TIP = 4;
const INDEX_TIP = 8;
const MIDDLE_TIP = 12;
const RING_TIP = 16;
const PINKY_TIP = 20;

const THUMB_MCP = 2;
const INDEX_MCP = 5;
const MIDDLE_MCP = 9;
const RING_MCP = 13;
const PINKY_MCP = 17;

const INDEX_PIP = 6;
const MIDDLE_PIP = 10;
const RING_PIP = 14;
const PINKY_PIP = 18;

const WRIST = 0;

const PINCH_THRESHOLD = 0.06;
const FINGER_EXTENDED_THRESHOLD = 0.04;
const DEBOUNCE_FRAMES = 4;

interface GestureBuffer {
  gesture: GestureType;
  count: number;
}

let gestureBuffer: GestureBuffer = { gesture: 'none', count: 0 };

function distance(a: HandLandmarkPoint, b: HandLandmarkPoint): number {
  return Math.sqrt(
    (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2
  );
}

function isFingerExtended(
  landmarks: HandLandmarkPoint[],
  tipIdx: number,
  pipIdx: number,
  mcpIdx: number
): boolean {
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];
  const tipToWrist = distance(tip, landmarks[WRIST]);
  const mcpToWrist = distance(mcp, landmarks[WRIST]);
  return tipToWrist > mcpToWrist + FINGER_EXTENDED_THRESHOLD;
}

function isThumbExtended(landmarks: HandLandmarkPoint[]): boolean {
  const thumbTip = landmarks[THUMB_TIP];
  const thumbMcp = landmarks[THUMB_MCP];
  const wrist = landmarks[WRIST];
  return distance(thumbTip, wrist) > distance(thumbMcp, wrist) * 1.2;
}

function classifyRaw(landmarks: HandLandmarkPoint[]): { gesture: GestureType; confidence: number } {
  if (landmarks.length < 21) return { gesture: 'none', confidence: 0 };

  const thumbExt = isThumbExtended(landmarks);
  const indexExt = isFingerExtended(landmarks, INDEX_TIP, INDEX_PIP, INDEX_MCP);
  const middleExt = isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP);
  const ringExt = isFingerExtended(landmarks, RING_TIP, RING_PIP, RING_MCP);
  const pinkyExt = isFingerExtended(landmarks, PINKY_TIP, PINKY_PIP, PINKY_MCP);

  const pinchDist = distance(landmarks[THUMB_TIP], landmarks[INDEX_TIP]);
  if (pinchDist < PINCH_THRESHOLD && !middleExt && !ringExt && !pinkyExt) {
    return { gesture: 'pinch', confidence: 1 - (pinchDist / PINCH_THRESHOLD) };
  }

  if (thumbExt && indexExt && middleExt && ringExt && pinkyExt) {
    return { gesture: 'open_hand', confidence: 0.9 };
  }

  if (thumbExt && !indexExt && !middleExt && !ringExt && !pinkyExt) {
    return { gesture: 'thumbs_up', confidence: 0.85 };
  }

  if (indexExt && !middleExt && !ringExt && !pinkyExt) {
    return { gesture: 'point', confidence: 0.8 };
  }

  if (!thumbExt && !indexExt && !middleExt && !ringExt && !pinkyExt) {
    return { gesture: 'fist', confidence: 0.85 };
  }

  return { gesture: 'none', confidence: 0 };
}

export function recognizeGesture(
  handLandmarks: HandLandmarkPoint[][] | null
): { gesture: GestureType; confidence: number } {
  if (!handLandmarks || handLandmarks.length === 0) {
    gestureBuffer = { gesture: 'none', count: 0 };
    return { gesture: 'none', confidence: 0 };
  }

  const primary = handLandmarks[0];
  const raw = classifyRaw(primary);

  if (raw.gesture === gestureBuffer.gesture) {
    gestureBuffer.count++;
  } else {
    gestureBuffer = { gesture: raw.gesture, count: 1 };
  }

  if (gestureBuffer.count >= DEBOUNCE_FRAMES) {
    return { gesture: gestureBuffer.gesture, confidence: raw.confidence };
  }

  return { gesture: 'none', confidence: 0 };
}

export function resetGestureBuffer(): void {
  gestureBuffer = { gesture: 'none', count: 0 };
}

export function getHandCenter(landmarks: HandLandmarkPoint[]): { x: number; y: number } | null {
  if (landmarks.length < 21) return null;
  const wrist = landmarks[WRIST];
  const middleMcp = landmarks[MIDDLE_MCP];
  return {
    x: (wrist.x + middleMcp.x) / 2,
    y: (wrist.y + middleMcp.y) / 2,
  };
}

export function getPoseArmPosition(
  poseLandmarks: { x: number; y: number; z: number; visibility: number }[] | null
): 'active' | 'crossed' | 'reaching' | 'unknown' {
  if (!poseLandmarks || poseLandmarks.length < 33) return 'unknown';

  const leftWrist = poseLandmarks[15];
  const rightWrist = poseLandmarks[16];
  const leftShoulder = poseLandmarks[11];
  const rightShoulder = poseLandmarks[12];
  const leftElbow = poseLandmarks[13];
  const rightElbow = poseLandmarks[14];

  if (leftWrist.visibility < 0.5 || rightWrist.visibility < 0.5) return 'unknown';

  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  const wristDist = Math.abs(leftWrist.x - rightWrist.x);

  if (wristDist < shoulderWidth * 0.3) return 'crossed';

  const leftReach = leftShoulder.y - leftWrist.y;
  const rightReach = rightShoulder.y - rightWrist.y;
  if (leftReach > 0.15 || rightReach > 0.15) return 'reaching';

  return 'active';
}
