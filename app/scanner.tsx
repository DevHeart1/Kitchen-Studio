import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Zap, Check, Loader, CheckCheck, X, Camera, RefreshCw, Scan } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useInventory } from "@/contexts/InventoryContext";
import { trpc } from "@/lib/trpc";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface DetectedItem {
  id: string;
  name: string;
  category: string;
  confidence: number;
  confirmed: boolean;
  estimatedQuantity?: string;
  suggestedStatus?: "good" | "low" | "expiring";
}

const PLACEHOLDER_IMAGES: Record<string, string> = {
  "Oils & Spices": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200",
  "Grains & Pasta": "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=200",
  "Proteins": "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200",
  "Dairy": "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200",
  "Produce": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200",
  "Canned Goods": "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=200",
  "Condiments": "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=200",
  "Beverages": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200",
  "Snacks": "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200",
  "Baking": "https://images.unsplash.com/photo-1486427944544-d2c6128c6804?w=200",
  "Frozen": "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=200",
  "Other": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200",
};

const ScanLineEffect = ({ isActive }: { isActive: boolean }) => {
  const scanLine1 = useRef(new Animated.Value(0)).current;
  const scanLine2 = useRef(new Animated.Value(0)).current;
  const scanLine3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) return;

    const createScanAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createScanAnimation(scanLine1, 0);
    const anim2 = createScanAnimation(scanLine2, 800);
    const anim3 = createScanAnimation(scanLine3, 1600);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [isActive, scanLine1, scanLine2, scanLine3]);

  const translateY1 = scanLine1.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, SCREEN_HEIGHT + 50],
  });

  const translateY2 = scanLine2.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, SCREEN_HEIGHT + 50],
  });

  const translateY3 = scanLine3.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, SCREEN_HEIGHT + 50],
  });

  const opacity1 = scanLine1.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, 0.8, 0.8, 0],
  });

  const opacity2 = scanLine2.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, 0.5, 0.5, 0],
  });

  const opacity3 = scanLine3.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, 0.3, 0.3, 0],
  });

  if (!isActive) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.fullScanLine,
          {
            transform: [{ translateY: translateY1 }],
            opacity: opacity1,
            height: 3,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.fullScanLine,
          styles.scanLineSecondary,
          {
            transform: [{ translateY: translateY2 }],
            opacity: opacity2,
            height: 2,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.fullScanLine,
          styles.scanLineTertiary,
          {
            transform: [{ translateY: translateY3 }],
            opacity: opacity3,
            height: 1,
          },
        ]}
      />
    </View>
  );
};

const CRTScanLines = () => {
  return (
    <View style={styles.crtContainer} pointerEvents="none">
      {Array.from({ length: Math.floor(SCREEN_HEIGHT / 4) }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.crtLine,
            { top: i * 4 },
          ]}
        />
      ))}
    </View>
  );
};

const GridOverlay = () => {
  const pulseAnim = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.25,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.15,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.gridContainer, { opacity: pulseAnim }]} pointerEvents="none">
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={`v-${i}`}
          style={[
            styles.gridLineVertical,
            { left: `${(i + 1) * 11.1}%` },
          ]}
        />
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <View
          key={`h-${i}`}
          style={[
            styles.gridLineHorizontal,
            { top: `${(i + 1) * 7.7}%` },
          ]}
        />
      ))}
    </Animated.View>
  );
};

const CornerBrackets = ({ size = 280 }: { size?: number }) => {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const cornerSize = 40;

  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, [glowAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <Animated.View
      style={[
        styles.cornersContainer,
        { width: size, height: size, transform: [{ scale: glowScale }] },
      ]}
    >
      <View style={[styles.cornerBracket, styles.cornerTL]}>
        <View style={[styles.bracketHorizontal, { width: cornerSize }]} />
        <View style={[styles.bracketVertical, { height: cornerSize }]} />
        <Animated.View style={[styles.cornerGlow, styles.glowTL, { opacity: glowOpacity }]} />
      </View>
      <View style={[styles.cornerBracket, styles.cornerTR]}>
        <View style={[styles.bracketHorizontal, { width: cornerSize }]} />
        <View style={[styles.bracketVertical, { height: cornerSize }]} />
        <Animated.View style={[styles.cornerGlow, styles.glowTR, { opacity: glowOpacity }]} />
      </View>
      <View style={[styles.cornerBracket, styles.cornerBL]}>
        <View style={[styles.bracketHorizontal, { width: cornerSize }]} />
        <View style={[styles.bracketVertical, { height: cornerSize }]} />
        <Animated.View style={[styles.cornerGlow, styles.glowBL, { opacity: glowOpacity }]} />
      </View>
      <View style={[styles.cornerBracket, styles.cornerBR]}>
        <View style={[styles.bracketHorizontal, { width: cornerSize }]} />
        <View style={[styles.bracketVertical, { height: cornerSize }]} />
        <Animated.View style={[styles.cornerGlow, styles.glowBR, { opacity: glowOpacity }]} />
      </View>

      <View style={styles.centerCrosshair}>
        <View style={styles.crosshairH} />
        <View style={styles.crosshairV} />
        <View style={styles.crosshairDot} />
      </View>
    </Animated.View>
  );
};

const DataStreamEffect = ({ isScanning }: { isScanning: boolean }) => {
  const dataStreams = useRef(
    Array.from({ length: 6 }).map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (!isScanning) return;

    const animations = dataStreams.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [isScanning, dataStreams]);

  if (!isScanning) return null;

  return (
    <View style={styles.dataStreamContainer} pointerEvents="none">
      {dataStreams.map((anim, i) => {
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 100],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 1, 0],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.dataStream,
              {
                left: 20 + i * 60,
                transform: [{ translateY }],
                opacity,
              },
            ]}
          >
            <Text style={styles.dataStreamText}>
              {Math.random().toString(16).substr(2, 4).toUpperCase()}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
};

const GlowVignette = () => {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, [glowAnim]);

  const borderOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  });

  return (
    <Animated.View
      style={[styles.glowVignette, { opacity: borderOpacity }]}
      pointerEvents="none"
    />
  );
};

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanPulse = useRef(new Animated.Value(0)).current;
  
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [overallConfidence, setOverallConfidence] = useState(0);
  const [hasCaptured, setHasCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const { addItem } = useInventory();
  const analyzeMutation = trpc.pantryScan.analyzeImage.useMutation();

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    const scanPulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scanPulse, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    scanPulseAnimation.start();

    return () => {
      pulseAnimation.stop();
      scanPulseAnimation.stop();
    };
  }, [pulseAnim, scanPulse]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isScanning) return;

    setIsScanning(true);
    console.log("[Scanner] Starting capture with Gemini 2.0 Flash...");

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      if (!photo?.base64) {
        throw new Error("Failed to capture image");
      }

      console.log("[Scanner] Photo captured, analyzing with Gemini 2.0 Flash...");
      setCapturedImage(`data:image/jpeg;base64,${photo.base64}`);
      setHasCaptured(true);

      const result = await analyzeMutation.mutateAsync({
        imageBase64: photo.base64,
        mimeType: "image/jpeg",
      });

      console.log("[Scanner] Gemini 2.0 Flash analysis complete:", result);

      const items: DetectedItem[] = result.items.map((item, index) => ({
        id: `scan-${Date.now()}-${index}`,
        name: item.name,
        category: item.category,
        confidence: item.confidence,
        confirmed: item.confidence >= 0.7,
        estimatedQuantity: item.estimatedQuantity,
        suggestedStatus: item.suggestedStatus,
      }));

      setDetectedItems(items);
      setOverallConfidence(result.overallConfidence);
    } catch (error) {
      console.error("[Scanner] Error:", error);
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, analyzeMutation]);

  const handleRetake = useCallback(() => {
    setHasCaptured(false);
    setCapturedImage(null);
    setDetectedItems([]);
    setOverallConfidence(0);
  }, []);

  const toggleItemConfirm = useCallback((itemId: string) => {
    setDetectedItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, confirmed: !item.confirmed } : item
      )
    );
  }, []);

  const handleFinishScan = useCallback(async () => {
    const confirmedItems = detectedItems.filter((item) => item.confirmed);
    
    console.log("[Scanner] Adding confirmed items to inventory:", confirmedItems.length);
    
    for (const item of confirmedItems) {
      const stockPercentage = 
        item.estimatedQuantity === "full" ? 100 :
        item.estimatedQuantity === "half" ? 50 :
        item.estimatedQuantity === "almost empty" ? 15 :
        item.estimatedQuantity === "multiple" ? 100 : 75;

      await addItem({
        name: item.name,
        image: PLACEHOLDER_IMAGES[item.category] || PLACEHOLDER_IMAGES["Other"],
        category: item.category,
        addedDate: "Added just now",
        status: item.suggestedStatus || "good",
        stockPercentage,
        expiresIn: item.suggestedStatus === "expiring" ? "Soon" : undefined,
      });
    }

    router.back();
  }, [detectedItems, addItem, router]);

  const handleClose = () => {
    router.back();
  };

  const confirmedCount = detectedItems.filter((item) => item.confirmed).length;

  const scanPulseOpacity = scanPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Camera size={64} color={Colors.primary} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan your pantry items
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {hasCaptured && capturedImage ? (
        <Image source={{ uri: capturedImage }} style={styles.cameraBackground} />
      ) : (
        <CameraView
          ref={cameraRef}
          style={styles.cameraBackground}
          facing="back"
          enableTorch={flashOn}
        />
      )}
      
      <View style={styles.overlay} />
      <CRTScanLines />
      <GridOverlay />
      <ScanLineEffect isActive={!hasCaptured} />
      <DataStreamEffect isScanning={isScanning} />
      <GlowVignette />

      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.topButton}
          onPress={() => setFlashOn(!flashOn)}
          activeOpacity={0.7}
        >
          <Zap
            size={22}
            color={flashOn ? Colors.primary : Colors.white}
            fill={flashOn ? Colors.primary : "transparent"}
          />
        </TouchableOpacity>

        <View style={styles.scanningIndicator}>
          <View style={styles.statusContainer}>
            <Animated.View style={[styles.statusDot, { opacity: scanPulseOpacity }]} />
            <Text style={styles.scanningText}>
              {isScanning ? "ANALYZING" : hasCaptured ? "COMPLETE" : "SCANNING"}
            </Text>
          </View>
          <Text style={styles.modelBadge}>GEMINI 2.0 FLASH</Text>
        </View>

        <TouchableOpacity style={styles.topButton} activeOpacity={0.7} onPress={handleClose}>
          <X size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.viewfinderContainer}>
        <CornerBrackets size={280} />

        <Animated.Text
          style={[styles.scanningTitle, { transform: [{ scale: pulseAnim }] }]}
        >
          {isScanning 
            ? "AI Processing..." 
            : hasCaptured 
              ? `${detectedItems.length} Items Detected` 
              : "Aim at Pantry"}
        </Animated.Text>

        {!hasCaptured && !isScanning && (
          <TouchableOpacity 
            style={styles.captureButton} 
            onPress={handleCapture}
            activeOpacity={0.8}
          >
            <View style={styles.captureButtonOuter}>
              <View style={styles.captureButtonInner}>
                <Scan size={28} color={Colors.backgroundDark} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {hasCaptured && !isScanning && (
          <TouchableOpacity 
            style={styles.retakeButton} 
            onPress={handleRetake}
            activeOpacity={0.8}
          >
            <RefreshCw size={18} color={Colors.white} />
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.bottomTray, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.trayHandle} />

        <View style={styles.trayHeader}>
          <View>
            <Text style={styles.trayTitle}>
              {isScanning ? "Analyzing..." : detectedItems.length > 0 ? "Detected Items" : "Ready to Scan"}
            </Text>
            <Text style={styles.traySubtitle}>
              {isScanning 
                ? "Gemini 2.0 Flash is analyzing" 
                : detectedItems.length > 0 
                  ? `${detectedItems.length} items • Tap to toggle`
                  : "Capture your pantry to begin"}
            </Text>
          </View>
          {overallConfidence > 0 && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {Math.round(overallConfidence * 100)}%
              </Text>
            </View>
          )}
        </View>

        {isScanning ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingRing}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
            <Text style={styles.loadingText}>Processing with Gemini 2.0 Flash...</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.itemsList}
          >
            {detectedItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Scan size={32} color={Colors.textSecondary} />
                <Text style={styles.emptyStateText}>
                  Tap scan to detect items
                </Text>
              </View>
            ) : (
              detectedItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.detectedItemCard,
                    {
                      borderColor: item.confirmed
                        ? `${Colors.primary}66`
                        : "rgba(255,255,255,0.1)",
                      opacity: item.confirmed ? 1 : 0.6,
                    },
                  ]}
                  onPress={() => toggleItemConfirm(item.id)}
                  activeOpacity={0.7}
                >
                  <Image 
                    source={{ uri: PLACEHOLDER_IMAGES[item.category] || PLACEHOLDER_IMAGES["Other"] }} 
                    style={styles.detectedItemImage} 
                  />
                  <View style={styles.detectedItemGradient} />
                  <View
                    style={[
                      styles.detectedItemCheck,
                      {
                        backgroundColor: item.confirmed
                          ? Colors.primary
                          : "rgba(255,255,255,0.2)",
                      },
                    ]}
                  >
                    {item.confirmed ? (
                      <Check size={12} color={Colors.backgroundDark} strokeWidth={3} />
                    ) : (
                      <Loader size={12} color={Colors.white} strokeWidth={2} />
                    )}
                  </View>
                  <View style={styles.confidenceIndicator}>
                    <Text style={styles.confidenceIndicatorText}>
                      {Math.round(item.confidence * 100)}%
                    </Text>
                  </View>
                  <Text style={styles.detectedItemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.detectedItemCategory}>{item.category}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}

        <TouchableOpacity
          style={[
            styles.finishButton,
            (detectedItems.length === 0 || confirmedCount === 0) && styles.finishButtonDisabled,
          ]}
          onPress={handleFinishScan}
          activeOpacity={0.8}
          disabled={detectedItems.length === 0 || confirmedCount === 0}
        >
          <CheckCheck size={22} color={Colors.backgroundDark} strokeWidth={2.5} />
          <Text style={styles.finishButtonText}>
            Add {confirmedCount} Items to Pantry
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  cameraBackground: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  fullScanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
      },
      web: {
        boxShadow: `0 0 30px ${Colors.primary}, 0 0 60px ${Colors.primary}40`,
      } as any,
    }),
  },
  scanLineSecondary: {
    backgroundColor: `${Colors.primary}80`,
  },
  scanLineTertiary: {
    backgroundColor: `${Colors.primary}40`,
  },
  crtContainer: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    overflow: "hidden",
  },
  crtLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  gridContainer: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  gridLineVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Colors.primary,
  },
  gridLineHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.primary,
  },
  cornersContainer: {
    position: "relative",
  },
  cornerBracket: {
    position: "absolute",
  },
  cornerTL: {
    top: 0,
    left: 0,
  },
  cornerTR: {
    top: 0,
    right: 0,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
  },
  bracketHorizontal: {
    position: "absolute",
    height: 3,
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
      web: {
        boxShadow: `0 0 12px ${Colors.primary}`,
      } as any,
    }),
  },
  bracketVertical: {
    position: "absolute",
    width: 3,
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
      web: {
        boxShadow: `0 0 12px ${Colors.primary}`,
      } as any,
    }),
  },
  cornerGlow: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
      },
      web: {
        boxShadow: `0 0 20px ${Colors.primary}, 0 0 40px ${Colors.primary}`,
      } as any,
    }),
  },
  glowTL: {
    top: -5,
    left: -5,
  },
  glowTR: {
    top: -5,
    right: -5,
  },
  glowBL: {
    bottom: -5,
    left: -5,
  },
  glowBR: {
    bottom: -5,
    right: -5,
  },
  centerCrosshair: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 30,
    height: 30,
    marginTop: -15,
    marginLeft: -15,
    alignItems: "center",
    justifyContent: "center",
  },
  crosshairH: {
    position: "absolute",
    width: 20,
    height: 1,
    backgroundColor: `${Colors.primary}60`,
  },
  crosshairV: {
    position: "absolute",
    width: 1,
    height: 20,
    backgroundColor: `${Colors.primary}60`,
  },
  crosshairDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      web: {
        boxShadow: `0 0 8px ${Colors.primary}`,
      } as any,
    }),
  },
  dataStreamContainer: {
    position: "absolute",
    top: 120,
    left: 0,
    right: 0,
    height: 100,
  },
  dataStream: {
    position: "absolute",
  },
  dataStreamText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 10,
    color: `${Colors.primary}80`,
    letterSpacing: 2,
  },
  glowVignette: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    borderWidth: 3,
    borderColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 30,
      },
      web: {
        boxShadow: `inset 0 0 100px ${Colors.primary}20`,
      } as any,
    }),
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 20,
  },
  topButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.cardGlass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  scanningIndicator: {
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      web: {
        boxShadow: `0 0 8px ${Colors.primary}`,
      } as any,
    }),
  },
  scanningText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 3,
  },
  modelBadge: {
    fontSize: 8,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    letterSpacing: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  viewfinderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -60,
  },
  scanningTitle: {
    marginTop: 32,
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.white,
    textAlign: "center",
    ...Platform.select({
      ios: {
        textShadowColor: Colors.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
      },
    }),
  },
  captureButton: {
    marginTop: 24,
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.primary}20`,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
      },
      web: {
        boxShadow: `0 0 30px ${Colors.primary}40`,
      } as any,
    }),
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  retakeButton: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  bottomTray: {
    backgroundColor: Colors.cardGlass,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.cardGlassBorder,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      web: {
        backdropFilter: "blur(12px)",
      } as any,
    }),
  },
  trayHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  trayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  trayTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  traySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  confidenceBadge: {
    backgroundColor: `${Colors.primary}33`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.primary}4D`,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 16,
  },
  loadingRing: {
    padding: 8,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: `${Colors.primary}30`,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 48,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  itemsList: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 8,
  },
  detectedItemCard: {
    width: 120,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  detectedItemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  detectedItemGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(0,0,0,0.5)",
      },
      android: {
        backgroundColor: "rgba(0,0,0,0.5)",
      },
      web: {
        backgroundColor: "rgba(0,0,0,0.5)",
      },
    }),
  },
  detectedItemCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confidenceIndicator: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceIndicatorText: {
    fontSize: 9,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  detectedItemName: {
    position: "absolute",
    bottom: 22,
    left: 10,
    right: 10,
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  detectedItemCategory: {
    position: "absolute",
    bottom: 8,
    left: 10,
    fontSize: 9,
    color: Colors.textSecondary,
  },
  finishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 8,
    height: 56,
    borderRadius: 28,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: `0 4px 20px ${Colors.primary}33`,
      } as any,
    }),
  },
  finishButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.white,
    marginTop: 24,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
});
