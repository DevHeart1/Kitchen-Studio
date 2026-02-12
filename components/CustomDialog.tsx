import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Trash2,
  XCircle,
  HelpCircle,
} from "lucide-react-native";
import colors from "@/constants/colors";

export type DialogVariant =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "destructive"
  | "confirm";

export interface DialogButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export interface DialogConfig {
  title: string;
  message: string;
  variant?: DialogVariant;
  buttons?: DialogButton[];
  dismissable?: boolean;
}

interface CustomDialogProps {
  visible: boolean;
  config: DialogConfig | null;
  onDismiss: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DIALOG_WIDTH = Math.min(SCREEN_WIDTH - 48, 340);

const variantConfig: Record<
  DialogVariant,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  info: {
    icon: Info,
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.15)",
  },
  success: {
    icon: CheckCircle,
    color: colors.green,
    bgColor: colors.greenBg,
  },
  warning: {
    icon: AlertTriangle,
    color: colors.orange,
    bgColor: colors.orangeBg,
  },
  error: {
    icon: XCircle,
    color: colors.red,
    bgColor: colors.redBg,
  },
  destructive: {
    icon: Trash2,
    color: colors.red,
    bgColor: colors.redBg,
  },
  confirm: {
    icon: HelpCircle,
    color: colors.primary,
    bgColor: "rgba(43, 238, 91, 0.15)",
  },
};

function CustomDialog({ visible, config, onDismiss }: CustomDialogProps) {
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 18,
          stiffness: 300,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropAnim, scaleAnim, opacityAnim]);

  if (!config) return null;

  const variant = config.variant ?? "info";
  const { icon: IconComponent, color, bgColor } = variantConfig[variant];
  const dismissable = config.dismissable !== false;

  const buttons: DialogButton[] =
    config.buttons && config.buttons.length > 0
      ? config.buttons
      : [{ text: "OK", style: "default" }];

  const handleButtonPress = (button: DialogButton) => {
    button.onPress?.();
    onDismiss();
  };

  const getButtonStyle = (button: DialogButton, index: number) => {
    if (button.style === "destructive") {
      return {
        bg: colors.red,
        text: "#fff",
        border: colors.red,
      };
    }
    if (button.style === "cancel") {
      return {
        bg: "transparent",
        text: "rgba(255,255,255,0.7)",
        border: "rgba(255,255,255,0.15)",
      };
    }
    if (variant === "destructive" && index === buttons.length - 1) {
      return {
        bg: colors.red,
        text: "#fff",
        border: colors.red,
      };
    }
    return {
      bg: colors.primary,
      text: colors.backgroundDark,
      border: colors.primary,
    };
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={dismissable ? onDismiss : undefined}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropAnim }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={dismissable ? onDismiss : undefined}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.dialog,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.glowTop}>
            <View style={[styles.glowInner, { backgroundColor: color }]} />
          </View>

          <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
            <IconComponent size={28} color={color} strokeWidth={2} />
          </View>

          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.message}>{config.message}</Text>

          <View
            style={[
              styles.buttonRow,
              buttons.length === 1 && styles.buttonRowSingle,
            ]}
          >
            {buttons.map((button, index) => {
              const btnStyle = getButtonStyle(button, index);
              return (
                <TouchableOpacity
                  key={index}
                  testID={`dialog-button-${index}`}
                  style={[
                    styles.button,
                    buttons.length > 1 && styles.buttonFlex,
                    {
                      backgroundColor: btnStyle.bg,
                      borderColor: btnStyle.border,
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: btnStyle.text },
                      button.style === "cancel" && styles.buttonTextCancel,
                      (button.style === "destructive" ||
                        (variant === "destructive" &&
                          index === buttons.length - 1)) &&
                        styles.buttonTextDestructive,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  dialog: {
    width: DIALOG_WIDTH,
    backgroundColor: "#1a2e21",
    borderRadius: 24,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.5,
        shadowRadius: 32,
      },
      android: {
        elevation: 24,
      },
      web: {
        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
      },
    }),
    overflow: "hidden" as const,
  },
  glowTop: {
    position: "absolute" as const,
    top: -40,
    left: 0,
    right: 0,
    alignItems: "center" as const,
  },
  glowInner: {
    width: 120,
    height: 80,
    borderRadius: 60,
    opacity: 0.15,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.white,
    textAlign: "center" as const,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center" as const,
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  buttonRow: {
    flexDirection: "row" as const,
    gap: 10,
    width: "100%" as const,
  },
  buttonRowSingle: {
    justifyContent: "center" as const,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    minWidth: 100,
  },
  buttonFlex: {
    flex: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
  buttonTextCancel: {
    fontWeight: "500" as const,
  },
  buttonTextDestructive: {
    fontWeight: "700" as const,
  },
});

export default React.memo(CustomDialog);
