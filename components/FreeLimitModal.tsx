import React, { useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Image,
    Dimensions,
    Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Crown, Sparkles, Rocket, X, View as ViewIcon } from "lucide-react-native";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

interface FreeLimitModalProps {
    visible: boolean;
    onClose: () => void;
    featureName: string;
    limit: number;
    currentUsage: number;
}

export default function FreeLimitModal({
    visible,
    onClose,
    featureName,
    limit,
    currentUsage,
}: FreeLimitModalProps) {
    const router = useRouter();

    useEffect(() => {
        if (visible && Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
    }, [visible]);

    const handleUpgrade = () => {
        onClose();
        router.push("/paywall" as any);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.container}>
                {/* Background Image with Blur */}
                <Image
                    source={{ uri: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=800&q=80" }}
                    style={styles.backgroundImage}
                    blurRadius={10}
                />
                <View style={styles.overlay} />

                <View style={styles.contentContainer}>
                    <View style={styles.modal}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>FREE LIMIT REACHED</Text>
                            <Text style={styles.headerUsage}>
                                {currentUsage}/{limit} Used
                            </Text>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <LinearGradient
                                    colors={["#FF453A", "#FF9F0A"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.progressFill, { width: "100%" }]}
                                />
                            </View>
                        </View>

                        {/* Feature Showcase */}
                        <View style={styles.showcaseContainer}>
                            <Image
                                source={{
                                    uri: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=600&q=80",
                                }}
                                style={styles.showcaseImage}
                            />
                            <LinearGradient
                                colors={["transparent", "rgba(0,0,0,0.8)"]}
                                style={styles.showcaseOverlay}
                            />

                            <View style={styles.arBadge}>
                                <ViewIcon size={14} color={Colors.primary} />
                                <Text style={styles.arBadgeText}>AR ACTIVE</Text>
                            </View>

                            <View style={styles.showcaseContent}>
                                <View style={styles.proTagRow}>
                                    <View style={styles.proTag}>
                                        <Text style={styles.proTagText}>PRO</Text>
                                    </View>
                                    <Text style={styles.showcaseTitle}>Go Unlimited</Text>
                                </View>
                                <Text style={styles.showcaseSubtitle}>
                                    Unlock professional AR guidance & magic.
                                </Text>
                            </View>
                        </View>

                        {/* Main Text */}
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>More Magic Awaits</Text>
                            <Text style={styles.description}>
                                You've reached your daily limit for{" "}
                                <Text style={styles.highlightWhite}>{featureName}</Text> conversions.
                                Unlock unlimited magic and professional AR guidance with{" "}
                                <Text style={styles.highlightPrimary}>Kitchen Studio Pro</Text>.
                            </Text>
                        </View>

                        {/* Actions */}
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={styles.upgradeButton}
                                onPress={handleUpgrade}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, "#22c55e"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.buttonGradient}
                                >
                                    <Text style={styles.buttonText}>Upgrade to Pro</Text>
                                    <Rocket size={20} color={Colors.backgroundDark} />
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.notNowButton}
                                onPress={onClose}
                            >
                                <Text style={styles.notNowText}>Not Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.8)",
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.4,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    contentContainer: {
        width: "100%",
        padding: 20,
        alignItems: "center",
    },
    modal: {
        width: "100%",
        maxWidth: 400,
        backgroundColor: "rgba(16, 34, 21, 0.85)",
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 11,
        fontWeight: "700",
        color: "rgba(255, 255, 255, 0.7)",
        letterSpacing: 1,
    },
    headerUsage: {
        fontSize: 11,
        fontWeight: "700",
        color: "#FF9F0A",
    },
    progressContainer: {
        marginBottom: 20,
    },
    progressBar: {
        height: 6,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 3,
    },
    showcaseContainer: {
        width: "100%",
        aspectRatio: 4 / 3,
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    showcaseImage: {
        width: "100%",
        height: "100%",
        opacity: 0.8,
    },
    showcaseOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    arBadge: {
        position: "absolute",
        top: 12,
        right: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    arBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#fff",
    },
    showcaseContent: {
        position: "absolute",
        bottom: 16,
        left: 16,
        right: 16,
    },
    proTagRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    proTag: {
        backgroundColor: "#FFD700",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    proTagText: {
        fontSize: 9,
        fontWeight: "800",
        color: "#000",
    },
    showcaseTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
    showcaseSubtitle: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.7)",
    },
    textContainer: {
        alignItems: "center",
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 8,
        textAlign: "center",
    },
    description: {
        fontSize: 13,
        color: "rgba(255, 255, 255, 0.6)",
        textAlign: "center",
        lineHeight: 20,
    },
    highlightWhite: {
        color: "#fff",
        fontWeight: "600",
    },
    highlightPrimary: {
        color: Colors.primary,
        fontWeight: "600",
    },
    actionsContainer: {
        gap: 12,
    },
    upgradeButton: {
        width: "100%",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
    },
    buttonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 16,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.backgroundDark,
    },
    notNowButton: {
        paddingVertical: 12,
        alignItems: "center",
    },
    notNowText: {
        fontSize: 14,
        fontWeight: "500",
        color: "rgba(255, 255, 255, 0.5)",
    },
});
