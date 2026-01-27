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
import { Zap, Check, Loader, CheckCheck, X, Camera, RefreshCw } from "lucide-react-native";
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

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
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
    const scanAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    scanAnimation.start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      scanAnimation.stop();
      pulseAnimation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isScanning) return;

    setIsScanning(true);
    console.log("[Scanner] Starting capture...");

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      if (!photo?.base64) {
        throw new Error("Failed to capture image");
      }

      console.log("[Scanner] Photo captured, analyzing...");
      setCapturedImage(`data:image/jpeg;base64,${photo.base64}`);
      setHasCaptured(true);

      const result = await analyzeMutation.mutateAsync({
        imageBase64: photo.base64,
        mimeType: "image/jpeg",
      });

      console.log("[Scanner] Analysis complete:", result);

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
      <View style={styles.vignetteOverlay} />

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
          <Text style={styles.scanningText}>
            {isScanning ? "ANALYZING..." : hasCaptured ? "SCAN COMPLETE" : "LIVE SCANNING"}
          </Text>
          <View style={[styles.scanningDot, isScanning && styles.scanningDotActive]} />
        </View>

        <TouchableOpacity style={styles.topButton} activeOpacity={0.7} onPress={handleClose}>
          <X size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.viewfinderContainer}>
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />

          {!hasCaptured && (
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineTranslate }] },
              ]}
            />
          )}
        </View>

        <Animated.Text
          style={[styles.scanningTitle, { transform: [{ scale: pulseAnim }] }]}
        >
          {isScanning 
            ? "Analyzing with AI..." 
            : hasCaptured 
              ? `Found ${detectedItems.length} items` 
              : "Point at your pantry"}
        </Animated.Text>

        {!hasCaptured && !isScanning && (
          <TouchableOpacity 
            style={styles.captureButton} 
            onPress={handleCapture}
            activeOpacity={0.8}
          >
            <View style={styles.captureButtonInner}>
              <Camera size={28} color={Colors.backgroundDark} />
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
              {isScanning ? "Scanning..." : detectedItems.length > 0 ? "Detected Items" : "Ready to Scan"}
            </Text>
            <Text style={styles.traySubtitle}>
              {isScanning 
                ? "AI is analyzing your pantry" 
                : detectedItems.length > 0 
                  ? `${detectedItems.length} items identified • Tap to toggle`
                  : "Capture your pantry to detect items"}
            </Text>
          </View>
          {overallConfidence > 0 && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {Math.round(overallConfidence * 100)}% CONFIDENCE
              </Text>
            </View>
          )}
        </View>

        {isScanning ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Analyzing image with Gemini AI...</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.itemsList}
          >
            {detectedItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Camera size={32} color={Colors.textSecondary} />
                <Text style={styles.emptyStateText}>
                  Tap the camera button to scan
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
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  vignetteOverlay: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    ...Platform.select({
      web: {
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
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
  scanningText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 6,
  },
  scanningDot: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 0 8px ${Colors.primary}`,
      } as any,
    }),
  },
  scanningDotActive: {
    backgroundColor: "#FFD700",
    ...Platform.select({
      ios: {
        shadowColor: "#FFD700",
      },
      web: {
        boxShadow: "0 0 8px #FFD700",
      } as any,
    }),
  },
  viewfinderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -60,
  },
  viewfinder: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: Colors.primary,
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
      },
      web: {
        boxShadow: `0 0 15px ${Colors.primary}`,
      } as any,
    }),
  },
  scanningTitle: {
    marginTop: 32,
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.white,
    textAlign: "center",
    ...Platform.select({
      ios: {
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
    }),
  },
  captureButton: {
    marginTop: 24,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.primary}4D`,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 16,
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
        background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
      } as any,
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
