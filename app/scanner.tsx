import React, { useEffect, useRef, useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Zap, HelpCircle, Check, Loader, CheckCheck, X } from "lucide-react-native";
import Colors from "@/constants/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface DetectedItem {
  id: string;
  name: string;
  image: string;
  confirmed: boolean;
  position: { top: string; left: string };
  size: { width: number; height: number };
  isRound?: boolean;
}

const MOCK_DETECTED_ITEMS: DetectedItem[] = [
  {
    id: "1",
    name: "Olive Oil",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCGihIrsVtJRXiaNrreWJ3lM36p0d3HqJYFX5GfaAqlOPdgqetMaggvadRosPF4KsiZcrN9Xpcn_1GSKCoLMrRZNegS43G0NSdJpcevWkvKtuWmjkozS7lRFoXkjR2UaTu3Nby-s526Ct-5mmUEuAjvYyx1hexJZ9u4p8_konOz-p-t0C65FMjWeLoN1H1CwoxoRTug4tOPB6wfuaxNCZ_2N_PuzX8UPeOkPE02YfJ-S6NccQzIoVcrtN0tlLgAu9sij7Qd1qG3Dw",
    confirmed: true,
    position: { top: "28%", left: "15%" },
    size: { width: 100, height: 140 },
  },
  {
    id: "2",
    name: "Garlic",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUuHZTd2EL84IxLzodhX6BSnuiMWOsvVrJ_PI7i0V24zTPHLL8gvOMBQ5nbl-UrrnMOvDvTOhRj40j9_Dp8ykRFnxe8nuLvdDi0xmGOpPGtTpja-6Nci0g_jGEGwj-fv9Kmm8Gj7icidipi4QGdsho4ofbJAMXdfWSE24c2AKoISz4IkBZgHBkG4PuWxXDi2RqkLBNHOIXRSHHSC0SzcGwif9tTNp3EFl9gwLTJovDGmFfkZyuzOGahIMizI0ZV_Ev90A4IrUegA",
    confirmed: true,
    position: { top: "48%", left: "42%" },
    size: { width: 70, height: 70 },
    isRound: true,
  },
  {
    id: "3",
    name: "Pasta",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyBHuo2syefoICrth20zOOkyxJGr7IdioHXX-118lN1ydGbO7e3ZPyodX6okmABO7GfEhV8_swxL0zAeoHPt21YSECsfgKSqfn_KcEABDsgS2qwQtEvVjKVowT4dB_jkoBTD0eqbxJIIV51irecbAEK3FanqFcQ2Dn9hDLHdY6wqtcS6GOnfeXVDFvDPi7Q6xM9vuTawlj6HcvCipskJhvFNrTWJ_r79kTXxoIflzGxRD9a28b9EGLfBKbjqmb8bwEwUoeGb8Zig",
    confirmed: false,
    position: { top: "38%", left: "65%" },
    size: { width: 90, height: 120 },
  },
];

const PANTRY_BG = "https://lh3.googleusercontent.com/aida-public/AB6AXuDFBjVsYo6FI2HtenEQ0CdD7FS-eF3Oag5PxJIgXbPa32CRyiVIZDnvnBhlqRp-f_yPGTwlbIV4-ugkDmG0Wu5__MhnJXabpzmoKB8-ygnCmCwVqSpFXiX38e0P6vffaE1J9Gs8zjtJ8l9ul3Vb5xPcAKXtas4oELv1CUTY-dKAAzBdllbIx_LMn2kzZngy7OM31RwT7zr_az9ePjV4uolVWuHo8ipQxZUC8tmymVyfAbj5LjW717BV1gBy-NWs6WOS17NSnGMRaQ";

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [flashOn, setFlashOn] = useState(false);

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
  }, []);

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const handleClose = () => {
    router.back();
  };

  const handleFinishScan = () => {
    router.back();
  };

  const confirmedCount = MOCK_DETECTED_ITEMS.filter((item) => item.confirmed).length;

  return (
    <View style={styles.container}>
      <Image source={{ uri: PANTRY_BG }} style={styles.cameraBackground} />
      <View style={styles.overlay} />

      {MOCK_DETECTED_ITEMS.map((item) => (
        <View
          key={item.id}
          style={[
            styles.boundingBox,
            {
              top: item.position.top,
              left: item.position.left,
              width: item.size.width,
              height: item.size.height,
              borderRadius: item.isRound ? item.size.width / 2 : 12,
              borderColor: item.confirmed ? Colors.primary : "rgba(255,255,255,0.5)",
              shadowColor: item.confirmed ? Colors.primary : "transparent",
            },
          ]}
        >
          <View
            style={[
              styles.itemLabel,
              { backgroundColor: item.confirmed ? Colors.primary : "rgba(255,255,255,0.9)" },
            ]}
          >
            {item.confirmed ? (
              <Check size={10} color={Colors.backgroundDark} strokeWidth={3} />
            ) : (
              <Loader size={10} color={Colors.backgroundDark} strokeWidth={3} />
            )}
            <Text
              style={[
                styles.itemLabelText,
                { color: Colors.backgroundDark },
              ]}
            >
              {item.name.toUpperCase()}
            </Text>
          </View>
        </View>
      ))}

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
          <Text style={styles.scanningText}>LIVE SCANNING</Text>
          <View style={styles.scanningDot} />
        </View>

        <TouchableOpacity style={styles.topButton} activeOpacity={0.7}>
          <HelpCircle size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.closeButton, { top: insets.top + 12 }]} onPress={handleClose}>
        <X size={20} color={Colors.white} />
      </TouchableOpacity>

      <View style={styles.viewfinderContainer}>
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />

          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanLineTranslate }] },
            ]}
          />
        </View>

        <Animated.Text
          style={[styles.scanningTitle, { transform: [{ scale: pulseAnim }] }]}
        >
          Scanning Pantry...
        </Animated.Text>
      </View>

      <View style={[styles.bottomTray, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.trayHandle} />

        <View style={styles.trayHeader}>
          <View>
            <Text style={styles.trayTitle}>Detected Items</Text>
            <Text style={styles.traySubtitle}>
              {MOCK_DETECTED_ITEMS.length} items identified automatically
            </Text>
          </View>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>78% CONFIDENCE</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.itemsList}
        >
          {MOCK_DETECTED_ITEMS.map((item) => (
            <View
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
            >
              <Image source={{ uri: item.image }} style={styles.detectedItemImage} />
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
              <Text style={styles.detectedItemName}>{item.name}</Text>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinishScan}
          activeOpacity={0.8}
        >
          <CheckCheck size={22} color={Colors.backgroundDark} strokeWidth={2.5} />
          <Text style={styles.finishButtonText}>Finish Scan</Text>
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
  cameraBackground: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    resizeMode: "cover",
  },
  overlay: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "rgba(0,0,0,0.2)",
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
  closeButton: {
    position: "absolute",
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
    display: "none",
  },
  scanningIndicator: {
    alignItems: "center",
  },
  scanningText: {
    fontSize: 10,
    fontWeight: "700",
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
    fontWeight: "700",
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
  boundingBox: {
    position: "absolute",
    borderWidth: 2,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
      },
    }),
  },
  itemLabel: {
    position: "absolute",
    top: -28,
    left: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  itemLabelText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
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
    fontWeight: "700",
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
    fontWeight: "700",
    color: Colors.primary,
  },
  itemsList: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 8,
  },
  detectedItemCard: {
    width: 120,
    height: 120,
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
    height: 60,
    backgroundColor: "transparent",
    backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(0,0,0,0.4)",
      },
      android: {
        backgroundColor: "rgba(0,0,0,0.4)",
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
  detectedItemName: {
    position: "absolute",
    bottom: 10,
    left: 10,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.white,
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
  finishButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.backgroundDark,
  },
});
