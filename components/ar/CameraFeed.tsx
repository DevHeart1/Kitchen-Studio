import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Colors from '@/constants/colors';
import { DetectionFrame } from '@/types/ar';
import { initMediaPipe, processFrame, destroyMediaPipe } from '@/services/ar/MediaPipeService';

interface CameraFeedProps {
  onFrame?: (frame: DetectionFrame) => void;
  onMediaPipeReady?: (ready: boolean) => void;
  isActive: boolean;
  showDebug?: boolean;
}

const TARGET_FPS = 12;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

export default function CameraFeed({
  onFrame,
  onMediaPipeReady,
  isActive,
  showDebug = false,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const lastFrameTime = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const [mediaPipeStatus, setMediaPipeStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const setupCamera = useCallback(async () => {
    if (Platform.OS !== 'web') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('[CameraFeed] Camera error:', err);
      setCameraError(err.message || 'Failed to access camera');
    }
  }, []);

  const setupMediaPipe = useCallback(async () => {
    const success = await initMediaPipe();
    setMediaPipeStatus(success ? 'ready' : 'failed');
    onMediaPipeReady?.(success);
  }, [onMediaPipeReady]);

  const runDetectionLoop = useCallback(() => {
    if (!videoRef.current || !isActive) return;

    const detect = (now: number) => {
      if (!isActive) return;

      if (now - lastFrameTime.current >= FRAME_INTERVAL) {
        lastFrameTime.current = now;

        const video = videoRef.current;
        if (video && video.readyState >= 2 && mediaPipeStatus === 'ready') {
          const frame = processFrame(video, now);
          onFrame?.(frame);

          if (showDebug && canvasRef.current && video.videoWidth > 0) {
            drawDebug(canvasRef.current, frame, video.videoWidth, video.videoHeight);
          }
        }
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);
  }, [isActive, mediaPipeStatus, onFrame, showDebug]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    setupCamera();
    setupMediaPipe();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      destroyMediaPipe();
    };
  }, []);

  useEffect(() => {
    if (isActive && mediaPipeStatus === 'ready') {
      runDetectionLoop();
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, mediaPipeStatus, runDetectionLoop]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.nativeCamera}>
          <Text style={styles.nativeCameraText}>
            AR Camera requires web platform.{'\n'}Touch controls active.
          </Text>
        </View>
      </View>
    );
  }

  if (cameraError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Camera: {cameraError}</Text>
          <Text style={styles.errorSubtext}>
            Grant camera permission to enable AR mode
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {React.createElement('div', {
        ref: containerRef,
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
        },
        children: [
          React.createElement('video', {
            key: 'video',
            ref: videoRef,
            autoPlay: true,
            playsInline: true,
            muted: true,
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
            },
          }),
          showDebug &&
            React.createElement('canvas', {
              key: 'canvas',
              ref: canvasRef,
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              },
            }),
        ],
      })}

      {mediaPipeStatus === 'loading' && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingPill}>
            <Text style={styles.loadingText}>Loading AI models...</Text>
          </View>
        </View>
      )}

      {mediaPipeStatus === 'failed' && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingPill, styles.warningPill]}>
            <Text style={styles.loadingText}>
              Hand tracking unavailable. Touch mode active.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function drawDebug(
  canvas: HTMLCanvasElement,
  frame: DetectionFrame,
  videoWidth: number,
  videoHeight: number
) {
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (frame.hands?.landmarks) {
    frame.hands.landmarks.forEach((hand) => {
      hand.forEach((lm) => {
        const x = (1 - lm.x) * canvas.width;
        const y = lm.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#2bee5b';
        ctx.fill();
      });
    });
  }

  if (frame.pose?.landmarks) {
    frame.pose.landmarks.forEach((lm) => {
      if (lm.visibility > 0.5) {
        const x = (1 - lm.x) * canvas.width;
        const y = lm.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFC107';
        ctx.fill();
      }
    });
  }

  if (frame.gesture !== 'none') {
    ctx.font = '24px monospace';
    ctx.fillStyle = '#2bee5b';
    ctx.fillText(
      `Gesture: ${frame.gesture} (${(frame.gestureConfidence * 100).toFixed(0)}%)`,
      20,
      40
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  nativeCamera: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundDark,
  },
  nativeCameraText: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Colors.backgroundDark,
  },
  errorText: {
    color: Colors.red,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  loadingPill: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  warningPill: {
    borderColor: Colors.secondary,
  },
  loadingText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '500',
  },
});
