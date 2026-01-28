import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    Dimensions,
    Modal,
} from "react-native";
import { router, Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { UtensilsCrossed, Mail, Lock, Eye, EyeOff, X, Music } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const { width, height } = Dimensions.get("window");

const BACKGROUND_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuAzVXoa0ajnxy0VYAcQxOE-9mPMvXX5rNIwC2q3AjMNqotiBXTZTDGLt785UEPyNq00NhtCzGCGtzl_9pedZJd5-c0uCb5im3nLTc4SOOMS5rQfILzGyM-K6XXglbaYcg4XaOGPojaq8pL-w_4LdrM0lJ8jn85kkSU3-gdBKy9qlBeToRZFQXja7ey49GGYVEhM2mJ2aGTH6BZslvxUGCWRi6MwVVsWQeXKDzIjWIbl4Ez0tb5tcr2x5Ib8YbepLL36Rtx3BZOflw";

export default function LoginScreen() {
    const { signIn, signInWithGoogle, signInWithApple, resendConfirmationEmail, isLoading, isDemoMode } = useAuth();
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Please enter a valid email";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEmailLogin = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        setShowConfirmationMessage(false);
        try {
            const { error, needsEmailConfirmation } = await signIn(email, password);

            if (error) {
                if (needsEmailConfirmation) {
                    setShowConfirmationMessage(true);
                } else {
                    Alert.alert("Login Failed", error.message || "Invalid credentials");
                }
            } else {
                setShowEmailModal(false);
                router.replace("/(tabs)");
            }
        } catch (error) {
            Alert.alert("Error", "An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendConfirmation = async () => {
        if (!email.trim()) {
            Alert.alert("Error", "Please enter your email address");
            return;
        }

        setIsResending(true);
        try {
            const { error } = await resendConfirmationEmail(email);
            if (error) {
                Alert.alert("Error", error.message || "Failed to resend confirmation email");
            } else {
                Alert.alert(
                    "Email Sent",
                    "A new confirmation email has been sent. Please check your inbox and spam folder."
                );
            }
        } catch (error) {
            Alert.alert("Error", "An unexpected error occurred");
        } finally {
            setIsResending(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            console.log("[Login] Starting Google sign in...");
            const { error } = await signInWithGoogle();
            if (error) {
                Alert.alert("Google Sign In Failed", error.message || "Could not sign in with Google");
            } else {
                router.replace("/(tabs)");
            }
        } catch (error) {
            console.error("[Login] Google sign in error:", error);
            Alert.alert("Error", "An unexpected error occurred");
        }
    };

    const handleAppleSignIn = async () => {
        try {
            console.log("[Login] Starting Apple sign in...");
            const { error } = await signInWithApple();
            if (error) {
                Alert.alert("Apple Sign In Failed", error.message || "Could not sign in with Apple");
            } else {
                router.replace("/(tabs)");
            }
        } catch (error) {
            console.error("[Login] Apple sign in error:", error);
            Alert.alert("Error", "An unexpected error occurred");
        }
    };

    const handleTikTokSignIn = async () => {
        Alert.alert(
            "Coming Soon",
            "TikTok sign in will be available soon!",
            [{ text: "OK" }]
        );
    };

    const handleDemoMode = () => {
        router.replace("/(tabs)");
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            
            <Image
                source={{ uri: BACKGROUND_IMAGE }}
                style={styles.backgroundImage}
                resizeMode="cover"
            />
            
            <LinearGradient
                colors={["rgba(0,0,0,0.2)", "rgba(16,34,21,0.8)", Colors.backgroundDark]}
                locations={[0, 0.5, 1]}
                style={styles.gradient}
            />

            <View style={styles.content}>
                <View style={styles.logoSection}>
                    <View style={styles.logoContainer}>
                        <UtensilsCrossed size={48} color={Colors.backgroundDark} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.appName}>Kitchen Studio</Text>
                    <Text style={styles.tagline}>Cook Live, Cook Smart</Text>
                </View>

                <View style={styles.buttonsSection}>
                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleGoogleSignIn}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.googleIcon}>G</Text>
                        <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.appleButton}
                        onPress={handleAppleSignIn}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.appleIcon}></Text>
                        <Text style={styles.appleButtonText}>Continue with Apple</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.tiktokButton}
                        onPress={handleTikTokSignIn}
                        activeOpacity={0.9}
                    >
                        <Music size={20} color={Colors.white} strokeWidth={2} />
                        <Text style={styles.tiktokButtonText}>Continue with TikTok</Text>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={styles.emailButton}
                        onPress={() => setShowEmailModal(true)}
                        activeOpacity={0.9}
                    >
                        <Mail size={20} color={Colors.white} strokeWidth={2} />
                        <Text style={styles.emailButtonText}>Sign in with Email</Text>
                    </TouchableOpacity>

                    {isDemoMode && (
                        <TouchableOpacity style={styles.demoButton} onPress={handleDemoMode}>
                            <Text style={styles.demoButtonText}>Continue in Demo Mode</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.signUpContainer}>
                        <Text style={styles.signUpText}>Don't have an account?</Text>
                        <Link href="/(auth)/sign-up" asChild>
                            <TouchableOpacity>
                                <Text style={styles.signUpLink}>Create an account</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </View>

            <Modal
                visible={showEmailModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEmailModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.modalKeyboardView}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Sign in with Email</Text>
                                <TouchableOpacity
                                    onPress={() => setShowEmailModal(false)}
                                    style={styles.closeButton}
                                >
                                    <X size={24} color={Colors.white} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                                    <Mail size={20} color={Colors.textSecondary} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email address"
                                        placeholderTextColor={Colors.textMuted}
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            if (errors.email) setErrors({ ...errors, email: undefined });
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                    />
                                </View>
                                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                                    <Lock size={20} color={Colors.textSecondary} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Password"
                                        placeholderTextColor={Colors.textMuted}
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            if (errors.password) setErrors({ ...errors, password: undefined });
                                        }}
                                        secureTextEntry={!showPassword}
                                        autoComplete="password"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        {showPassword ? (
                                            <EyeOff size={20} color={Colors.textSecondary} />
                                        ) : (
                                            <Eye size={20} color={Colors.textSecondary} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                            </View>

                            {showConfirmationMessage && (
                                <View style={styles.confirmationBanner}>
                                    <Text style={styles.confirmationText}>
                                        Please confirm your email before signing in. Check your inbox and spam folder.
                                    </Text>
                                    <TouchableOpacity
                                        onPress={handleResendConfirmation}
                                        disabled={isResending}
                                        style={styles.resendButton}
                                    >
                                        {isResending ? (
                                            <ActivityIndicator size="small" color={Colors.primary} />
                                        ) : (
                                            <Text style={styles.resendText}>Resend confirmation email</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}

                            <TouchableOpacity style={styles.forgotButton}>
                                <Text style={styles.forgotText}>Forgot password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.signInButton, isSubmitting && styles.buttonDisabled]}
                                onPress={handleEmailLogin}
                                disabled={isSubmitting}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, "#1a9e3e"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.buttonGradient}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color={Colors.backgroundDark} />
                                    ) : (
                                        <Text style={styles.signInButtonText}>Sign In</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundDark,
    },
    loadingContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    backgroundImage: {
        position: "absolute",
        width: width,
        height: height,
    },
    gradient: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    content: {
        flex: 1,
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 40,
    },
    logoSection: {
        alignItems: "center",
    },
    logoContainer: {
        width: 96,
        height: 96,
        backgroundColor: Colors.primary,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        transform: [{ rotate: "-6deg" }],
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
            },
            android: {
                elevation: 12,
            },
            web: {
                boxShadow: `0 8px 40px rgba(43, 238, 91, 0.5)`,
            } as any,
        }),
    },
    appName: {
        fontSize: 40,
        fontWeight: "800",
        color: Colors.white,
        letterSpacing: -1,
        textAlign: "center",
    },
    tagline: {
        fontSize: 18,
        color: "rgba(203, 213, 225, 1)",
        marginTop: 8,
        fontWeight: "500",
        letterSpacing: 0.5,
    },
    buttonsSection: {
        width: "100%",
        maxWidth: 400,
        alignSelf: "center",
    },
    googleButton: {
        backgroundColor: Colors.white,
        height: 56,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            } as any,
        }),
    },
    googleIcon: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1a1a1a",
    },
    googleButtonText: {
        fontSize: 17,
        fontWeight: "700",
        color: "#1a1a1a",
    },
    appleButton: {
        backgroundColor: "#000000",
        height: 56,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            } as any,
        }),
    },
    appleIcon: {
        fontSize: 22,
        color: Colors.white,
        marginTop: -2,
    },
    appleButtonText: {
        fontSize: 17,
        fontWeight: "700",
        color: Colors.white,
    },
    tiktokButton: {
        backgroundColor: "#000000",
        height: 56,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            } as any,
        }),
    },
    tiktokButtonText: {
        fontSize: 17,
        fontWeight: "700",
        color: Colors.white,
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 8,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    dividerText: {
        color: "rgba(255, 255, 255, 0.4)",
        paddingHorizontal: 16,
        fontSize: 14,
        fontWeight: "500",
    },
    emailButton: {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        height: 56,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
    },
    emailButtonText: {
        fontSize: 17,
        fontWeight: "700",
        color: Colors.white,
    },
    demoButton: {
        height: 48,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 12,
    },
    demoButtonText: {
        fontSize: 15,
        fontWeight: "500",
        color: Colors.textSecondary,
        textDecorationLine: "underline",
    },
    signUpContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 24,
        gap: 4,
    },
    signUpText: {
        color: "rgba(148, 163, 184, 1)",
        fontSize: 14,
    },
    signUpLink: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: "700",
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        justifyContent: "flex-end",
    },
    modalKeyboardView: {
        width: "100%",
    },
    modalContent: {
        backgroundColor: Colors.backgroundDark,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === "ios" ? 40 : 24,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: Colors.white,
    },
    closeButton: {
        padding: 4,
    },
    inputWrapper: {
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.inputBackground,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        paddingHorizontal: 16,
        height: 56,
        gap: 12,
    },
    inputError: {
        borderColor: Colors.red,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.white,
    },
    errorText: {
        color: Colors.red,
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
    },
    forgotButton: {
        alignSelf: "flex-end",
        marginBottom: 24,
    },
    forgotText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: "500",
    },
    signInButton: {
        borderRadius: 16,
        overflow: "hidden",
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonGradient: {
        height: 56,
        justifyContent: "center",
        alignItems: "center",
    },
    signInButtonText: {
        fontSize: 17,
        fontWeight: "600",
        color: Colors.backgroundDark,
    },
    confirmationBanner: {
        backgroundColor: "rgba(43, 238, 91, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(43, 238, 91, 0.3)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    confirmationText: {
        color: Colors.white,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    resendButton: {
        alignSelf: "flex-start",
        minHeight: 24,
    },
    resendText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: "600",
    },
});
