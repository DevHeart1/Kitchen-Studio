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
import { 
    UtensilsCrossed, 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    User, 
    ArrowRight,
    Sparkles,
    Zap,
    Leaf,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

interface CookingInterest {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

const COOKING_INTERESTS: CookingInterest[] = [
    { id: "quick-meals", label: "Quick Meals", icon: <Zap size={14} color={Colors.backgroundDark} /> },
    { id: "baking", label: "Baking" },
    { id: "healthy", label: "Healthy", icon: <Leaf size={14} color={Colors.backgroundDark} /> },
    { id: "vegan", label: "Vegan" },
    { id: "asian-fusion", label: "Asian Fusion" },
    { id: "pastries", label: "Pastries" },
    { id: "italian", label: "Italian" },
    { id: "grilling", label: "Grilling" },
];

export default function SignUpScreen() {
    const { signUp, isLoading } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [selectedInterests, setSelectedInterests] = useState<string[]>(["quick-meals", "healthy"]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        password?: string;
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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const toggleInterest = (interestId: string) => {
        setSelectedInterests((prev) =>
            prev.includes(interestId)
                ? prev.filter((id) => id !== interestId)
                : [...prev, interestId]
        );
    };

    const handleSignUp = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const { error } = await signUp(email, password, name, selectedInterests);

            if (error) {
                Alert.alert("Sign Up Failed", error.message || "Could not create account");
            } else {
                Alert.alert(
                    "Verify Your Email",
                    "We've sent a verification link to your email address. Please check your inbox and verify your email before logging in.",
                    [
                        {
                            text: "OK",
                            onPress: () => router.replace("/(auth)/login"),
                        },
                    ]
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
            
            <View style={styles.bgGlowTop} />
            <View style={styles.bgGlowBottom} />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, styles.progressActive]} />
                        <View style={styles.progressBar} />
                        <View style={styles.progressBar} />
                    </View>

                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <UtensilsCrossed size={24} color={Colors.primary} />
                        </View>
                        <Text style={styles.title}>
                            Create your{"\n"}
                            <Text style={styles.titleAccent}>Kitchen Studio</Text>
                        </Text>
                        <Text style={styles.subtitle}>
                            Join the future of hands-free AR cooking.
                        </Text>
                    </View>

                    <View style={styles.formSection}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>FULL NAME</Text>
                            <View
                                style={[
                                    styles.inputContainer,
                                    focusedInput === "name" && styles.inputFocused,
                                    errors.name && styles.inputError,
                                ]}
                            >
                                <User
                                    size={20}
                                    color={focusedInput === "name" ? Colors.primary : Colors.textMuted}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Gordon Ramsay"
                                    placeholderTextColor={Colors.textMuted}
                                    value={name}
                                    onChangeText={(text) => {
                                        setName(text);
                                        if (errors.name) setErrors({ ...errors, name: undefined });
                                    }}
                                    onFocus={() => setFocusedInput("name")}
                                    onBlur={() => setFocusedInput(null)}
                                    autoCapitalize="words"
                                    autoComplete="name"
                                />
                            </View>
                            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>EMAIL</Text>
                            <View
                                style={[
                                    styles.inputContainer,
                                    focusedInput === "email" && styles.inputFocused,
                                    errors.email && styles.inputError,
                                ]}
                            >
                                <Mail
                                    size={20}
                                    color={focusedInput === "email" ? Colors.primary : Colors.textMuted}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="hello@kitchen.studio"
                                    placeholderTextColor={Colors.textMuted}
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        if (errors.email) setErrors({ ...errors, email: undefined });
                                    }}
                                    onFocus={() => setFocusedInput("email")}
                                    onBlur={() => setFocusedInput(null)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                />
                            </View>
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>PASSWORD</Text>
                            <View
                                style={[
                                    styles.inputContainer,
                                    focusedInput === "password" && styles.inputFocused,
                                    errors.password && styles.inputError,
                                ]}
                            >
                                <Lock
                                    size={20}
                                    color={focusedInput === "password" ? Colors.primary : Colors.textMuted}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor={Colors.textMuted}
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        if (errors.password) setErrors({ ...errors, password: undefined });
                                    }}
                                    onFocus={() => setFocusedInput("password")}
                                    onBlur={() => setFocusedInput(null)}
                                    secureTextEntry={!showPassword}
                                    autoComplete="new-password"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    {showPassword ? (
                                        <Eye size={20} color={Colors.textMuted} />
                                    ) : (
                                        <EyeOff size={20} color={Colors.textMuted} />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>
                    </View>

                    <View style={styles.interestsSection}>
                        <View style={styles.interestsHeader}>
                            <Sparkles size={20} color={Colors.primary} />
                            <Text style={styles.interestsTitle}>Cooking Interests</Text>
                        </View>
                        <View style={styles.interestsContainer}>
                            {COOKING_INTERESTS.map((interest) => {
                                const isSelected = selectedInterests.includes(interest.id);
                                return (
                                    <TouchableOpacity
                                        key={interest.id}
                                        style={[
                                            styles.interestChip,
                                            isSelected && styles.interestChipSelected,
                                        ]}
                                        onPress={() => toggleInterest(interest.id)}
                                        activeOpacity={0.7}
                                    >
                                        {isSelected && interest.icon && (
                                            <View style={styles.chipIcon}>{interest.icon}</View>
                                        )}
                                        <Text
                                            style={[
                                                styles.interestChipText,
                                                isSelected && styles.interestChipTextSelected,
                                            ]}
                                        >
                                            {interest.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                        onPress={handleSignUp}
                        disabled={isSubmitting}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[Colors.primary, "#1fe550"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitButtonGradient}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={Colors.backgroundDark} />
                            ) : (
                                <>
                                    <Text style={styles.submitButtonText}>Start My Culinary Journey</Text>
                                    <ArrowRight size={20} color={Colors.backgroundDark} />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.signInContainer}>
                        <Text style={styles.signInText}>Already have an account? </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.signInLink}>Log in</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
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
    bgGlowTop: {
        position: "absolute",
        top: "-10%",
        right: "-20%",
        width: 300,
        height: 300,
        backgroundColor: Colors.primary,
        opacity: 0.15,
        borderRadius: 150,
        ...Platform.select({
            web: {
                filter: "blur(120px)",
            } as any,
            default: {},
        }),
    },
    bgGlowBottom: {
        position: "absolute",
        bottom: "-10%",
        left: "-20%",
        width: 250,
        height: 250,
        backgroundColor: "#0a3d1c",
        opacity: 0.4,
        borderRadius: 125,
        ...Platform.select({
            web: {
                filter: "blur(100px)",
            } as any,
            default: {},
        }),
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 56,
        paddingBottom: 16,
    },
    progressContainer: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 32,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 3,
    },
    progressActive: {
        backgroundColor: Colors.primary,
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
            },
            web: {
                boxShadow: `0 0 10px ${Colors.primary}60`,
            } as any,
            android: {},
        }),
    },
    header: {
        marginBottom: 32,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        color: Colors.white,
        lineHeight: 40,
        marginBottom: 8,
    },
    titleAccent: {
        color: Colors.primary,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.textSecondary,
    },
    formSection: {
        gap: 20,
        marginBottom: 32,
    },
    inputWrapper: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.textSecondary,
        letterSpacing: 1,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        paddingHorizontal: 16,
        height: 56,
        gap: 12,
    },
    inputFocused: {
        borderColor: "rgba(43,238,91,0.5)",
        backgroundColor: "rgba(255,255,255,0.08)",
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
        marginLeft: 4,
    },
    interestsSection: {
        marginBottom: 24,
    },
    interestsHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
    },
    interestsTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.white,
    },
    interestsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    interestChip: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    interestChipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            web: {
                boxShadow: `0 4px 16px ${Colors.primary}40`,
            } as any,
            android: {
                elevation: 4,
            },
        }),
    },
    chipIcon: {
        marginRight: 2,
    },
    interestChipText: {
        fontSize: 14,
        fontWeight: "500",
        color: Colors.textSecondary,
    },
    interestChipTextSelected: {
        color: Colors.backgroundDark,
        fontWeight: "700",
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: Platform.OS === "ios" ? 34 : 24,
        backgroundColor: Colors.backgroundDark,
    },
    submitButton: {
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    submitButtonGradient: {
        height: 56,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
            },
            web: {
                boxShadow: `0 8px 32px ${Colors.primary}50`,
            } as any,
            android: {
                elevation: 8,
            },
        }),
    },
    submitButtonText: {
        fontSize: 17,
        fontWeight: "700",
        color: Colors.backgroundDark,
    },
    signInContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    signInText: {
        color: Colors.textMuted,
        fontSize: 14,
    },
    signInLink: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: "600",
    },
});
