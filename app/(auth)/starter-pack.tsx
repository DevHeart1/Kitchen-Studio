import React, { useRef, useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Dimensions,
    Platform,
    Animated,
    ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import {
    Play,
    Clock,
    Flame,
    View as ViewIcon,
    Sparkles,
    AlertCircle,
    RefreshCw,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { getStarterRecipes, StarterRecipe, UserPreferences } from "@/lib/starterRecipes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const DIETARY_LABELS: Record<string, string> = {
    "vegetarian": "Vegetarian",
    "vegan": "Vegan",
    "keto": "Keto",
    "halal": "Halal",
    "gluten-free": "Gluten-free",
    "dairy-free": "Dairy-free",
    "nut-free": "Nut-free",
};

const LEVEL_LABELS: Record<string, string> = {
    "beginner": "Beginner",
    "intermediate": "Intermediate",
    "pro": "Pro",
};

export default function StarterPackScreen() {
    const { profile, completeOnboarding } = useUserProfile();
    const [recipes, setRecipes] = useState<StarterRecipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        fetchRecipes();

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.02,
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
        pulse.start();

        return () => pulse.stop();
    }, []);

    const fetchRecipes = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const preferences: UserPreferences = {
                cookingLevel: profile.cookingLevel || "intermediate",
                dietaryPreferences: profile.dietaryPreferences || [],
                primaryGoal: profile.primaryGoal || "eat-healthy",
            };
            console.log("[StarterPack] Fetching AI recipes with preferences:", preferences);
            const result = await getStarterRecipes(preferences);

            if (result.error) {
                setError(result.error);
                setRecipes([]);
            } else {
                setRecipes(result.recipes);
            }
        } catch (err) {
            console.error("[StarterPack] Error fetching recipes:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartCooking = async () => {
        console.log("[StarterPack] Starting first cook");
        await completeOnboarding();
        router.replace("/(tabs)");
    };

    const handleRecipePress = async (recipe: StarterRecipe) => {
        console.log("[StarterPack] Recipe pressed:", recipe.name);
        await completeOnboarding();
        router.replace("/(tabs)");
    };

    const primaryDiet = profile.dietaryPreferences?.[0];
    const dietLabel = primaryDiet ? DIETARY_LABELS[primaryDiet] : "your";
    const levelLabel = profile.cookingLevel ? LEVEL_LABELS[profile.cookingLevel] : "Intermediate";

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.bgGlowTop} />
            <View style={styles.bgGlowBottom} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[
                        styles.headerSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, styles.progressCompleted]} />
                        <View style={[styles.progressBar, styles.progressCompleted]} />
                        <View style={[styles.progressBar, styles.progressActive]} />
                    </View>

                    <View style={styles.badgeContainer}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>STARTER PACK</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>
                        Just for <Text style={styles.titleAccent}>You</Text> 🎉
                    </Text>
                    <Text style={styles.subtitle}>
                        We've curated these recipes based on your{" "}
                        <Text style={styles.highlightText}>{dietLabel}</Text> preferences and{" "}
                        <Text style={styles.highlightText}>{levelLabel}</Text> skills.
                    </Text>
                </Animated.View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <Sparkles size={32} color={Colors.primary} />
                        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 16 }} />
                        <Text style={styles.loadingText}>
                            AI is curating your perfect recipes...
                        </Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <AlertCircle size={48} color={Colors.primary} />
                        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={fetchRecipes}
                            activeOpacity={0.8}
                        >
                            <RefreshCw size={18} color={Colors.backgroundDark} />
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.recipesContainer}>
                        {recipes.map((recipe, index) => (
                            <TouchableOpacity
                                key={recipe.id}
                                style={[
                                    styles.recipeCard,
                                    index === 0 && styles.featuredCard,
                                    index > 0 && styles.secondaryCard,
                                ]}
                                onPress={() => handleRecipePress(recipe)}
                                activeOpacity={0.9}
                            >
                                <Image
                                    source={{ uri: recipe.image }}
                                    style={styles.recipeImage}
                                    resizeMode="cover"
                                />
                                <LinearGradient
                                    colors={["transparent", "rgba(16,34,21,0.6)", "rgba(16,34,21,0.95)"]}
                                    style={styles.recipeGradient}
                                />

                                {recipe.isArGuided && (
                                    <View style={styles.arBadge}>
                                        <ViewIcon size={14} color={Colors.primary} />
                                        <Text style={styles.arBadgeText}>AR Guided</Text>
                                    </View>
                                )}

                                <View style={styles.recipeContent}>
                                    <View style={styles.tagRow}>
                                        {recipe.matchPercentage && (
                                            <View style={styles.matchTag}>
                                                <Text style={styles.matchTagText}>{recipe.matchPercentage}% Match</Text>
                                            </View>
                                        )}
                                        <View style={styles.difficultyTag}>
                                            <Text style={styles.difficultyTagText}>{recipe.difficulty}</Text>
                                        </View>
                                    </View>

                                    <Text style={[styles.recipeTitle, index === 0 && styles.featuredTitle]}>
                                        {recipe.name}
                                    </Text>

                                    <View style={styles.metaRow}>
                                        <View style={styles.metaItem}>
                                            <Clock size={index === 0 ? 18 : 16} color={Colors.primary} />
                                            <Text style={styles.metaText}>{recipe.cookTime} min</Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <Flame size={index === 0 ? 18 : 16} color={Colors.primary} />
                                            <Text style={styles.metaText}>{recipe.calories} kcal</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleStartCooking}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[Colors.primary, "#1fe550"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitButtonGradient}
                        >
                            <Play size={22} color={Colors.backgroundDark} fill={Colors.backgroundDark} />
                            <Text style={styles.submitButtonText}>Start First Cook</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
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
        paddingBottom: 140,
    },
    headerSection: {
        marginBottom: 24,
    },
    progressContainer: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 24,
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
    badgeContainer: {
        flexDirection: "row",
        marginBottom: 12,
    },
    badge: {
        backgroundColor: "rgba(255,255,255,0.1)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    badgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.primary,
        letterSpacing: 1.2,
    },
    title: {
        fontSize: 36,
        fontWeight: "800",
        color: Colors.white,
        lineHeight: 44,
        marginBottom: 12,
    },
    titleAccent: {
        color: Colors.primary,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 22,
    },
    highlightText: {
        color: Colors.white,
        fontWeight: "600",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 80,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: "center",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 80,
        paddingHorizontal: 24,
    },
    errorTitle: {
        marginTop: 16,
        fontSize: 20,
        fontWeight: "700",
        color: Colors.white,
        textAlign: "center",
    },
    errorText: {
        marginTop: 8,
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
    },
    retryButton: {
        marginTop: 24,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.backgroundDark,
    },
    recipesContainer: {
        gap: 20,
    },
    recipeCard: {
        borderRadius: 32,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.4,
                shadowRadius: 20,
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
            } as any,
        }),
    },
    featuredCard: {
        height: 420,
    },
    secondaryCard: {
        height: 280,
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    recipeImage: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
    },
    recipeGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    arBadge: {
        position: "absolute",
        top: 20,
        right: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.15)",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        ...Platform.select({
            web: {
                backdropFilter: "blur(10px)",
            } as any,
            default: {},
        }),
    },
    arBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.white,
        letterSpacing: 0.5,
    },
    recipeContent: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
    },
    tagRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
    },
    matchTag: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    matchTagText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.backgroundDark,
    },
    difficultyTag: {
        backgroundColor: "rgba(0,0,0,0.3)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        ...Platform.select({
            web: {
                backdropFilter: "blur(10px)",
            } as any,
            default: {},
        }),
    },
    difficultyTagText: {
        fontSize: 12,
        fontWeight: "500",
        color: "rgba(255,255,255,0.8)",
    },
    recipeTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: Colors.white,
        marginBottom: 12,
    },
    featuredTitle: {
        fontSize: 28,
        lineHeight: 34,
    },
    metaRow: {
        flexDirection: "row",
        gap: 20,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metaText: {
        fontSize: 14,
        fontWeight: "500",
        color: "rgba(255,255,255,0.8)",
    },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: Platform.OS === "ios" ? 40 : 28,
    },
    submitButton: {
        borderRadius: 20,
        overflow: "hidden",
    },
    submitButtonGradient: {
        height: 60,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
            },
            web: {
                boxShadow: `0 8px 40px ${Colors.primary}60`,
            } as any,
            android: {
                elevation: 10,
            },
        }),
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: "800",
        color: Colors.backgroundDark,
    },
});
