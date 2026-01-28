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
import { ChefHat, Mail, Lock, Eye, EyeOff, User, ArrowLeft } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function SignUpScreen() {
    const { signUp, isLoading } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!name.trim()) {
            newErrors.name = "Name is required";
        } else if (name.trim().length < 2) {
            newErrors.name = "Name must be at least 2 characters";
        }

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

        if (!confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignUp = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const { error } = await signUp(email, password, name);

            if (error) {
                Alert.alert("Sign Up Failed", error.message || "Could not create account");
            } else {
                Alert.alert(
                    "Account Created",
                    "Please check your email to verify your account, then sign in.",
                    [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
                );
            }
        } catch (error) {
            Alert.alert("Error", "An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
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
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={24} color={Colors.white} />
                    </TouchableOpacity>

                    {/* Logo Section */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={[Colors.primary, "#1a9e3e"]}
                                style={styles.logoGradient}
                            >
                                <ChefHat size={40} color={Colors.backgroundDark} strokeWidth={1.5} />
                            </LinearGradient>
                        </View>
                        <Text style={styles.appName}>Kitchen Studio</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formSection}>
                        <Text style={styles.welcomeText}>Create Account</Text>
                        <Text style={styles.subtitleText}>
                            Join thousands of home chefs mastering their craft
                        </Text>

                        {/* Name Input */}
                        <View style={styles.inputWrapper}>
                            <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                                <User size={20} color={Colors.textSecondary} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full name"
                                    placeholderTextColor={Colors.textMuted}
                                    value={name}
                                    onChangeText={(text) => {
                                        setName(text);
                                        if (errors.name) setErrors({ ...errors, name: undefined });
                                    }}
                                    autoCapitalize="words"
                                    autoComplete="name"
                                />
                            </View>
                            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                        </View>

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
                                    autoComplete="new-password"
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

                        {/* Confirm Password Input */}
                        <View style={styles.inputWrapper}>
                            <View
                                style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}
                            >
                                <Lock size={20} color={Colors.textSecondary} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm password"
                                    placeholderTextColor={Colors.textMuted}
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        if (errors.confirmPassword)
                                            setErrors({ ...errors, confirmPassword: undefined });
                                    }}
                                    secureTextEntry={!showConfirmPassword}
                                    autoComplete="new-password"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={20} color={Colors.textSecondary} />
                                    ) : (
                                        <Eye size={20} color={Colors.textSecondary} />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && (
                                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                            )}
                        </View>

                        {/* Terms */}
                        <Text style={styles.termsText}>
                            By signing up, you agree to our{" "}
                            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                            <Text style={styles.termsLink}>Privacy Policy</Text>
                        </Text>

                        {/* Sign Up Button */}
                        <TouchableOpacity
                            style={[styles.signUpButton, isSubmitting && styles.buttonDisabled]}
                            onPress={handleSignUp}
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
                                    <Text style={styles.signUpButtonText}>Create Account</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Sign In Link */}
                        <View style={styles.signInContainer}>
                            <Text style={styles.signInText}>Already have an account? </Text>
                            <Link href="/(auth)/login" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.signInLink}>Sign In</Text>
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
        paddingTop: 48,
        paddingBottom: 40,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.inputBackground,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    logoSection: {
        alignItems: "center",
        marginBottom: 32,
    },
    logoContainer: {
        marginBottom: 12,
    },
    logoGradient: {
        width: 72,
        height: 72,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
            },
            web: {
                boxShadow: `0 6px 24px ${Colors.primary}30`,
            } as any,
            android: {
                elevation: 6,
            },
        }),
    },
    appName: {
        fontSize: 24,
        fontWeight: "700",
        color: Colors.white,
        letterSpacing: -0.5,
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
        marginBottom: 28,
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
    termsText: {
        fontSize: 13,
        color: Colors.textMuted,
        textAlign: "center",
        marginTop: 8,
        marginBottom: 24,
        lineHeight: 18,
    },
    termsLink: {
        color: Colors.primary,
        fontWeight: "500",
    },
    signUpButton: {
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 24,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonGradient: {
        height: 56,
        justifyContent: "center",
        alignItems: "center",
    },
    signUpButtonText: {
        fontSize: 17,
        fontWeight: "600",
        color: Colors.backgroundDark,
    },
    signInContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    signInText: {
        color: Colors.textSecondary,
        fontSize: 15,
    },
    signInLink: {
        color: Colors.primary,
        fontSize: 15,
        fontWeight: "600",
    },
});
