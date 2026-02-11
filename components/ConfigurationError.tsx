import React from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Linking, Platform } from "react-native";
import { TriangleAlert, Database, FileText } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");

export default function ConfigurationError() {
    const handleOpenDocs = () => {
        Linking.openURL("https://supabase.com/docs/guides/getting-started");
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.backgroundDark, "#1a2e21"]}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Database size={48} color={Colors.primary} />
                    </View>
                    <View style={styles.alertBadge}>
                        <TriangleAlert size={20} color={Colors.orange} />
                    </View>
                </View>

                <Text style={styles.title}>Connection Required</Text>

                <Text style={styles.description}>
                    Kitchen Studio requires a valid Supabase configuration to function.
                    The current environment is missing the necessary API keys.
                </Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Missing Credentials</Text>
                    <View style={styles.codeBlock}>
                        <Text style={styles.codeText}>EXPO_PUBLIC_SUPABASE_URL</Text>
                        <Text style={styles.codeText}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>
                    </View>
                    <Text style={styles.cardFooter}>
                        Please add these to your .env file
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleOpenDocs}
                    activeOpacity={0.8}
                >
                    <FileText size={20} color={Colors.backgroundDark} />
                    <Text style={styles.buttonText}>Open Documentation</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundDark,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        width: width * 0.9,
        maxWidth: 400,
        alignItems: "center",
        padding: 24,
    },
    iconContainer: {
        width: 96,
        height: 96,
        marginBottom: 32,
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "rgba(43, 238, 91, 0.1)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(43, 238, 91, 0.2)",
    },
    alertBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(249, 115, 22, 0.2)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: Colors.backgroundDark,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: Colors.white,
        marginBottom: 16,
        textAlign: "center",
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: "center",
        marginBottom: 32,
        lineHeight: 24,
    },
    card: {
        width: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        marginBottom: 32,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.textMuted,
        marginBottom: 12,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    codeBlock: {
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        borderRadius: 8,
        padding: 12,
        gap: 8,
    },
    codeText: {
        fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
        fontSize: 13,
        color: Colors.primary,
    },
    cardFooter: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 12,
        fontStyle: "italic",
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        gap: 8,
        width: "100%",
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.backgroundDark,
    },
});
