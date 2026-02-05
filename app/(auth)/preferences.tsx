import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Platform,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { 
    SlidersHorizontal, 
    ArrowRight,
    Check,
    Leaf,
    PiggyBank,
    GraduationCap,
    Sparkles,
    Zap,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useUserProfile } from "@/contexts/UserProfileContext";

type CookingLevel = "beginner" | "intermediate" | "pro";
type DietaryPreference = "vegetarian" | "vegan" | "keto" | "halal" | "gluten-free" | "dairy-free" | "nut-free";
type CookingGoal = "eat-healthy" | "save-money" | "learn-new";

interface GoalOption {
    id: CookingGoal;
    label: string;
    subLabel: string;
    Icon: React.ComponentType<{ size: number; color: string }>;
}

const COOKING_LEVELS: { id: CookingLevel; label: string }[] = [
    { id: "beginner", label: "Beginner" },
    { id: "intermediate", label: "Intermediate" },
    { id: "pro", label: "Pro" },
];

const DIETARY_OPTIONS: { id: DietaryPreference; label: string }[] = [
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "keto", label: "Keto" },
    { id: "halal", label: "Halal" },
    { id: "gluten-free", label: "Gluten-free" },
    { id: "dairy-free", label: "Dairy-free" },
    { id: "nut-free", label: "Nut-free" },
];

const COOKING_GOALS: GoalOption[] = [
    { 
        id: "eat-healthy", 
        label: "Eat", 
        subLabel: "Healthy",
        Icon: Leaf,
    },
    { 
        id: "save-money", 
        label: "Save", 
        subLabel: "Money",
        Icon: PiggyBank,
    },
    { 
        id: "learn-new", 
        label: "Learn", 
        subLabel: "New",
        Icon: GraduationCap,
    },
];

interface CookingInterest {
    id: string;
    label: string;
    hasIcon?: boolean;
}

const COOKING_INTERESTS: CookingInterest[] = [
    { id: "quick-meals", label: "Quick Meals", hasIcon: true },
    { id: "baking", label: "Baking" },
    { id: "healthy", label: "Healthy", hasIcon: true },
    { id: "vegan", label: "Vegan" },
    { id: "asian-fusion", label: "Asian Fusion" },
    { id: "pastries", label: "Pastries" },
    { id: "italian", label: "Italian" },
    { id: "grilling", label: "Grilling" },
];

export default function OnboardingScreen() {
    const { updateProfile, completeOnboarding } = useUserProfile();
    const [cookingLevel, setCookingLevel] = useState<CookingLevel>("intermediate");
    const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreference[]>(["vegan", "gluten-free"]);
    const [primaryGoal, setPrimaryGoal] = useState<CookingGoal>("eat-healthy");
    const [selectedInterests, setSelectedInterests] = useState<string[]>(["quick-meals", "healthy"]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleDietaryPreference = (preference: DietaryPreference) => {
        setDietaryPreferences((prev) =>
            prev.includes(preference)
                ? prev.filter((p) => p !== preference)
                : [...prev, preference]
        );
    };

    const toggleInterest = (interestId: string) => {
        setSelectedInterests((prev) =>
            prev.includes(interestId)
                ? prev.filter((id) => id !== interestId)
                : [...prev, interestId]
        );
    };

    const handleContinue = async () => {
        setIsSubmitting(true);
        try {
            await updateProfile({
                cookingLevel,
                dietaryPreferences,
                primaryGoal,
                cookingInterests: selectedInterests,
            });
            // Don't complete onboarding yet - wait until starter pack
            console.log("[Onboarding] Preferences saved:", { cookingLevel, dietaryPreferences, primaryGoal, selectedInterests });
            router.replace("/(auth)/starter-pack");
        } catch (error) {
            console.error("[Onboarding] Error saving preferences:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            
            <View style={styles.bgGlowTop} />
            <View style={styles.bgGlowBottom} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, styles.progressCompleted]} />
                    <View style={[styles.progressBar, styles.progressActive]} />
                    <View style={styles.progressBar} />
                </View>

                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <SlidersHorizontal size={24} color={Colors.primary} />
                    </View>
                    <Text style={styles.title}>
                        Tailor your{"\n"}
                        <Text style={styles.titleAccent}>Experience</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        Help us customize your AI kitchen assistant.
                    </Text>
                </View>

                <View style={styles.sectionsContainer}>
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>COOKING LEVEL</Text>
                        <View style={styles.levelContainer}>
                            {COOKING_LEVELS.map((level) => {
                                const isSelected = cookingLevel === level.id;
                                return (
                                    <TouchableOpacity
                                        key={level.id}
                                        style={[
                                            styles.levelButton,
                                            isSelected && styles.levelButtonSelected,
                                        ]}
                                        onPress={() => setCookingLevel(level.id)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.levelButtonText,
                                                isSelected && styles.levelButtonTextSelected,
                                            ]}
                                        >
                                            {level.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>DIETARY & ALLERGIES</Text>
                        <View style={styles.dietaryContainer}>
                            {DIETARY_OPTIONS.map((option) => {
                                const isSelected = dietaryPreferences.includes(option.id);
                                return (
                                    <TouchableOpacity
                                        key={option.id}
                                        style={[
                                            styles.dietaryChip,
                                            isSelected && styles.dietaryChipSelected,
                                        ]}
                                        onPress={() => toggleDietaryPreference(option.id)}
                                        activeOpacity={0.7}
                                    >
                                        {isSelected && (
                                            <Check size={16} color={Colors.primary} style={styles.checkIcon} />
                                        )}
                                        <Text
                                            style={[
                                                styles.dietaryChipText,
                                                isSelected && styles.dietaryChipTextSelected,
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>PRIMARY GOAL</Text>
                        <View style={styles.goalsContainer}>
                            {COOKING_GOALS.map((goal) => {
                                const isSelected = primaryGoal === goal.id;
                                return (
                                    <TouchableOpacity
                                        key={goal.id}
                                        style={[
                                            styles.goalCard,
                                            isSelected && styles.goalCardSelected,
                                        ]}
                                        onPress={() => setPrimaryGoal(goal.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.goalIconContainer}>
                                            <goal.Icon 
                                                size={28} 
                                                color={isSelected ? Colors.backgroundDark : "rgba(255,255,255,0.5)"} 
                                            />
                                        </View>
                                        <Text
                                            style={[
                                                styles.goalLabel,
                                                isSelected && styles.goalLabelSelected,
                                            ]}
                                        >
                                            {goal.label}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.goalSubLabel,
                                                isSelected && styles.goalSubLabelSelected,
                                            ]}
                                        >
                                            {goal.subLabel}
                                        </Text>
                                        {isSelected && <View style={styles.goalIndicator} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.section}>
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
                                        {isSelected && interest.hasIcon && interest.id === "quick-meals" && (
                                            <Zap size={14} color={Colors.backgroundDark} style={styles.chipIcon} />
                                        )}
                                        {isSelected && interest.hasIcon && interest.id === "healthy" && (
                                            <Leaf size={14} color={Colors.backgroundDark} style={styles.chipIcon} />
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
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                    onPress={handleContinue}
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
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundDark,
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 56,
        paddingBottom: 24,
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
    progressCompleted: {
        backgroundColor: Colors.primary,
        opacity: 0.5,
    },
    progressActive: {
        backgroundColor: Colors.primary,
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 8,
            },
            web: {
                boxShadow: `0 0 10px ${Colors.primary}99`,
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
    sectionsContainer: {
        gap: 32,
    },
    section: {
        gap: 12,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.textSecondary,
        letterSpacing: 1.5,
        marginLeft: 4,
    },
    levelContainer: {
        flexDirection: "row",
        gap: 12,
    },
    levelButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
    },
    levelButtonSelected: {
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
    levelButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: Colors.textSecondary,
    },
    levelButtonTextSelected: {
        color: Colors.backgroundDark,
        fontWeight: "700",
    },
    dietaryContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    dietaryChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    dietaryChipSelected: {
        backgroundColor: "rgba(43,238,91,0.1)",
        borderColor: Colors.primary,
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
            },
            web: {
                boxShadow: `0 0 15px ${Colors.primary}25`,
            } as any,
            android: {},
        }),
    },
    checkIcon: {
        marginRight: 6,
    },
    dietaryChipText: {
        fontSize: 14,
        fontWeight: "500",
        color: Colors.textSecondary,
    },
    dietaryChipTextSelected: {
        color: Colors.primary,
        fontWeight: "700",
    },
    goalsContainer: {
        flexDirection: "row",
        gap: 12,
    },
    goalCard: {
        flex: 1,
        height: 128,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        position: "relative",
        overflow: "hidden",
    },
    goalCardSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
            },
            web: {
                boxShadow: `0 6px 24px ${Colors.primary}50`,
            } as any,
            android: {
                elevation: 6,
            },
        }),
    },
    goalIconContainer: {
        marginBottom: 12,
    },
    goalLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: Colors.textSecondary,
        textAlign: "center",
    },
    goalLabelSelected: {
        color: Colors.backgroundDark,
        fontWeight: "700",
    },
    goalSubLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: Colors.textSecondary,
        textAlign: "center",
    },
    goalSubLabelSelected: {
        color: Colors.backgroundDark,
        fontWeight: "700",
    },
    goalIndicator: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.backgroundDark,
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
    interestsHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    interestsTitle: {
        fontSize: 16,
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
        marginRight: 6,
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
});
