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
} from "react-native";
import { router, Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { ChefHat, Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
    const { signIn, isLoading, isDemoMode } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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

    const handleLogin = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const { error } = await signIn(email, password);

            if (error) {
                Alert.alert("Login Failed", error.message || "Invalid credentials");
            } else {
                router.replace("/(tabs)");
            }
        } catch (error) {
            Alert.alert("Error", "An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
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
            <LinearGradient
                colors={[Colors.backgroundDark, "#0a1a0e", Colors.backgroundDark]}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo Section */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={[Colors.primary, "#1a9e3e"]}
                                style={styles.logoGradient}
                            >
                                <ChefHat size={48} color={Colors.backgroundDark} strokeWidth={1.5} />
                            </LinearGradient>
                        </View>
                        <Text style={styles.appName}>Kitchen Studio</Text>
                        <Text style={styles.tagline}>Your AI-Powered Culinary Companion</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formSection}>
                        <Text style={styles.welcomeText}>Welcome Back</Text>
                        <Text style={styles.subtitleText}>Sign in to continue your culinary journey</Text>

                        {/* Email Input */}
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

                        {/* Password Input */}
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

                        {/* Forgot Password */}
                        <TouchableOpacity style={styles.forgotButton}>
                            <Text style={styles.forgotText}>Forgot password?</Text>
                        </TouchableOpacity>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            style={[styles.signInButton, isSubmitting && styles.buttonDisabled]}
                            onPress={handleLogin}
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

                        {/* Demo Mode Button */}
                        {isDemoMode && (
                            <TouchableOpacity style={styles.demoButton} onPress={handleDemoMode}>
                                <Text style={styles.demoButtonText}>Continue in Demo Mode</Text>
                            </TouchableOpacity>
                        )}

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Sign Up Link */}
                        <View style={styles.signUpContainer}>
                            <Text style={styles.signUpText}>Don't have an account? </Text>
                            <Link href="/(auth)/sign-up" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.signUpLink}>Sign Up</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    logoSection: {
        alignItems: "center",
        marginBottom: 48,
    },
    logoContainer: {
        marginBottom: 16,
    },
    logoGradient: {
        width: 96,
        height: 96,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
            },
            web: {
                boxShadow: `0 8px 32px ${Colors.primary}40`,
            } as any,
            android: {
                elevation: 8,
            },
        }),
    },
    appName: {
        fontSize: 32,
        fontWeight: "700",
        color: Colors.white,
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 8,
    },
    formSection: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: "700",
        color: Colors.white,
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 15,
        color: Colors.textSecondary,
        marginBottom: 32,
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
        marginBottom: 16,
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
    demoButton: {
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.inputBorder,
        backgroundColor: Colors.inputBackground,
        marginBottom: 16,
    },
    demoButtonText: {
        fontSize: 16,
        fontWeight: "500",
        color: Colors.textSecondary,
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.inputBorder,
    },
    dividerText: {
        color: Colors.textMuted,
        paddingHorizontal: 16,
        fontSize: 14,
    },
    signUpContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    signUpText: {
        color: Colors.textSecondary,
        fontSize: 15,
    },
    signUpLink: {
        color: Colors.primary,
        fontSize: 15,
        fontWeight: "600",
    },
});
