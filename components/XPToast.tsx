import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { Zap, Trophy, Flame, Star } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGamification, XPToastData } from "@/contexts/GamificationContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TOAST_DURATION = 2500;

export default function XPToastManager() {
    const { toastQueue, dismissToast } = useGamification();

    if (toastQueue.length === 0) return null;

    // Show only the first toast at a time
    return <SingleToast toast={toastQueue[0]} onDismiss={dismissToast} />;
}

function SingleToast({ toast, onDismiss }: { toast: XPToastData; onDismiss: (id: string) => void }) {
    const translateY = useRef(new Animated.Value(-120)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Slide in
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                friction: 8,
                tension: 60,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                friction: 6,
                tension: 80,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto-dismiss
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -120,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start(() => onDismiss(toast.id));
        }, TOAST_DURATION);

        return () => clearTimeout(timer);
    }, [toast.id]);

    const getIcon = () => {
        switch (toast.type) {
            case "xp":
                return <Zap size={18} color="#FFD700" />;
            case "badge":
                return <Trophy size={18} color="#FFD700" />;
            case "streak":
                return <Flame size={18} color="#FF6B35" />;
            case "levelup":
                return <Star size={18} color="#FFD700" fill="#FFD700" />;
            default:
                return <Zap size={18} color="#FFD700" />;
        }
    };

    const getBgColor = () => {
        switch (toast.type) {
            case "badge":
                return "rgba(168, 85, 247, 0.95)";
            case "levelup":
                return "rgba(43, 238, 91, 0.95)";
            case "streak":
                return "rgba(255, 107, 53, 0.95)";
            default:
                return "rgba(30, 30, 30, 0.95)";
        }
    };

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                {
                    transform: [{ translateY }, { scale }],
                    opacity,
                    backgroundColor: getBgColor(),
                },
            ]}
            pointerEvents="none"
        >
            <View style={styles.iconContainer}>{getIcon()}</View>
            <View style={styles.textContainer}>
                <Text style={styles.message}>{toast.message}</Text>
                {toast.badgeName && (
                    <Text style={styles.badgeName}>{toast.badgeName}</Text>
                )}
            </View>
            {toast.xpAmount && (
                <View style={styles.xpBadge}>
                    <Text style={styles.xpText}>+{toast.xpAmount} XP</Text>
                </View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    toastContainer: {
        position: "absolute",
        top: 60,
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        width: SCREEN_WIDTH - 48,
        maxWidth: 380,
        zIndex: 9999,
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    message: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.white,
    },
    badgeName: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.8)",
        marginTop: 2,
    },
    xpBadge: {
        backgroundColor: "rgba(255, 215, 0, 0.25)",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(255, 215, 0, 0.4)",
    },
    xpText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#FFD700",
    },
});
