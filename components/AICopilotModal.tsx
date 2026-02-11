import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Image,
    Dimensions,
    ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    Sparkles,
    X,
    ChefHat,
    Send,
    Loader2,
    Bookmark,
    ShoppingCart,
    ArrowRight,
    Check,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useInventory } from "@/contexts/InventoryContext";
import { useSavedRecipes, SavedRecipe } from "@/contexts/SavedRecipesContext";
import { useShoppingList } from "@/contexts/ShoppingListContext";
import { useGamification } from "@/contexts/GamificationContext";
import { supabase } from "@/lib/supabase";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface AICopilotModalProps {
    visible: boolean;
    onClose: () => void;
    onRecipeGenerated?: (recipe: SavedRecipe) => void;
}

interface GeneratedRecipe {
    title: string;
    description: string;
    ingredients: {
        name: string;
        amount: string;
        inPantry: boolean;
    }[];
    instructions: {
        step: number;
        text: string;
    }[];
    prepTime: string;
    cookTime: string;
    difficulty: "Easy" | "Medium" | "Hard";
    calories: string;
}

export default function AICopilotModal({
    visible,
    onClose,
    onRecipeGenerated,
}: AICopilotModalProps) {
    const insets = useSafeAreaInsets();
    const { inventory } = useInventory();
    const { saveRecipe } = useSavedRecipes();
    const { addItem } = useShoppingList();
    const { awardXP } = useGamification();

    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startReset = () => {
        setPrompt("");
        setRecipe(null);
        setSaveSuccess(false);
        setError(null);
    };

    const handleClose = () => {
        startReset();
        onClose();
    };

    const generateRecipe = async () => {
        if (!prompt.trim()) return;

        setIsLoading(true);
        setRecipe(null);
        setError(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const inventoryList = inventory.map((i) => i.name).join(", ");

            const { data, error: fnError } = await supabase.functions.invoke("generate-recipe", {
                body: {
                    prompt: prompt.trim(),
                    inventory: inventoryList,
                },
            });

            if (fnError) throw fnError;
            if (data?.recipe) {
                setRecipe(data.recipe);
                awardXP("ai_recipe");
            } else {
                throw new Error("No recipe returned");
            }
        } catch (err: any) {
            console.error("Recipe generation failed:", err);
            setError(err?.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAndCook = async () => {
        if (!recipe) return;
        setIsSaving(true);

        try {
            // 1. Save Recipe
            const newRecipe: Omit<SavedRecipe, "id" | "savedAt"> = {
                title: recipe.title,
                videoThumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80", // Placeholder or generated image
                videoDuration: `${recipe.prepTime} + ${recipe.cookTime}`,
                ingredients: recipe.ingredients.map((ing, index) => ({
                    id: `ing-${index}`,
                    name: ing.name,
                    amount: ing.amount,
                    image: "", // Placeholder
                })),
                instructions: recipe.instructions.map(inst => ({
                    step: inst.step,
                    text: inst.text,
                    time: 0
                })),
            };

            await saveRecipe(newRecipe);

            // 2. Add missing ingredients to Shopping List
            const missingIngredients = recipe.ingredients.filter((i) => !i.inPantry);
            for (const item of missingIngredients) {
                await addItem({
                    name: item.name,
                    amount: item.amount,
                    category: "Groceries", // Default category
                });
            }

            setSaveSuccess(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Notify parent to navigate
            setTimeout(() => {
                // We'd need to return the saved recipe ID if poss, but navigation to generic recipe page is ok for now
                // onRecipeGenerated?.(result); // If saveRecipe returned the object
                handleClose();
            }, 1500);

        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <ImageBackground
                    source={{ uri: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=1600&q=80" }} // Kitchen background
                    style={styles.backgroundImage}
                    blurRadius={20} // Heavy blur for glassmorphism
                >
                    <View style={styles.dimmer} />
                </ImageBackground>

                <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleContainer}>
                            <View style={styles.aiIconContainer}>
                                <Sparkles size={20} color={Colors.primary} />
                            </View>
                            <Text style={styles.headerTitle}>Chef Bot</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <X size={24} color={Colors.white} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {!recipe ? (
                            <ScrollView
                                contentContainerStyle={styles.emptyStateContainer}
                                keyboardShouldPersistTaps="handled"
                            >
                                <ChefHat size={64} color={Colors.primary} style={{ opacity: 0.8, marginBottom: 20 }} />
                                <Text style={styles.welcomeTitle}>What are you craving?</Text>
                                <Text style={styles.welcomeSubtitle}>
                                    I can create a unique recipe based on what you have in your pantry and what you feel like eating.
                                </Text>

                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. I have chicken and rice, make something spicy..."
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        multiline
                                        value={prompt}
                                        onChangeText={setPrompt}
                                        maxLength={200}
                                    />
                                    <TouchableOpacity
                                        style={[styles.sendButton, (!prompt.trim() || isLoading) && styles.sendButtonDisabled]}
                                        onPress={generateRecipe}
                                        disabled={!prompt.trim() || isLoading}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color={Colors.backgroundDark} />
                                        ) : (
                                            <Send size={20} color={Colors.backgroundDark} />
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {/* Suggestions */}
                                <View style={styles.suggestions}>
                                    <TouchableOpacity style={styles.suggestionChip} onPress={() => setPrompt("Quick 15-minute dinner with pasta")}>
                                        <Text style={styles.suggestionText}>Quick pasta dinner</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.suggestionChip} onPress={() => setPrompt("Healthy breakfast with eggs")}>
                                        <Text style={styles.suggestionText}>Healthy breakfast</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.suggestionChip} onPress={() => setPrompt("Vegetarian meal with minimal ingredients")}>
                                        <Text style={styles.suggestionText}>Simple vegetarian</Text>
                                    </TouchableOpacity>
                                </View>

                                {error && (
                                    <View style={{ marginTop: 24, padding: 16, backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.2)", alignItems: "center" }}>
                                        <Text style={{ color: Colors.red, fontSize: 14, textAlign: "center", marginBottom: 12 }}>{error}</Text>
                                        <TouchableOpacity onPress={generateRecipe} style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8 }}>
                                            <Text style={{ color: Colors.white, fontWeight: "600" }}>Retry</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </ScrollView>
                        ) : (
                            <View style={styles.recipeContainer}>
                                <ScrollView
                                    style={styles.recipeScroll}
                                    contentContainerStyle={{ paddingBottom: 100 }}
                                    showsVerticalScrollIndicator={false}
                                >
                                    <Text style={styles.recipeTitle}>{recipe.title}</Text>
                                    <View style={styles.recipeMetaRow}>
                                        <Text style={styles.recipeMeta}>{recipe.prepTime} prep</Text>
                                        <View style={styles.dot} />
                                        <Text style={styles.recipeMeta}>{recipe.cookTime} cook</Text>
                                        <View style={styles.dot} />
                                        <Text style={styles.recipeMeta}>{recipe.difficulty}</Text>
                                        <View style={styles.dot} />
                                        <Text style={styles.recipeMeta}>{recipe.calories}</Text>
                                    </View>

                                    <Text style={styles.recipeDescription}>{recipe.description}</Text>

                                    <View style={styles.divider} />

                                    <Text style={styles.sectionHeader}>Ingredients</Text>
                                    <View style={styles.listContainer}>
                                        {recipe.ingredients.map((ing, i) => (
                                            <View key={i} style={styles.ingredientRow}>
                                                <View style={[styles.statusDot, { backgroundColor: ing.inPantry ? Colors.green : Colors.orange }]} />
                                                <Text style={styles.ingredientText}>
                                                    <Text style={{ fontWeight: 'bold' }}>{ing.amount}</Text> {ing.name}
                                                </Text>
                                                {!ing.inPantry && (
                                                    <View style={styles.missingBadge}>
                                                        <Text style={styles.missingText}>Missing</Text>
                                                    </View>
                                                )}
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.divider} />

                                    <Text style={styles.sectionHeader}>Instructions</Text>
                                    <View style={styles.listContainer}>
                                        {recipe.instructions.map((inst, i) => (
                                            <View key={i} style={styles.instructionRow}>
                                                <View style={styles.stepCircle}>
                                                    <Text style={styles.stepNumber}>{inst.step}</Text>
                                                </View>
                                                <Text style={styles.instructionText}>{inst.text}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>

                                {/* Bottom Actions */}
                                <View style={styles.actionFooter}>
                                    <TouchableOpacity
                                        style={styles.secondaryActionButton}
                                        onPress={startReset}
                                        disabled={isSaving}
                                    >
                                        <Text style={styles.secondaryActionText}>New Request</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.primaryActionButton, saveSuccess && styles.successButton]}
                                        onPress={handleSaveAndCook}
                                        disabled={isSaving || saveSuccess}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator color={Colors.backgroundDark} />
                                        ) : saveSuccess ? (
                                            <>
                                                <Check size={20} color={Colors.white} />
                                                <Text style={[styles.primaryActionText, { color: Colors.white }]}>Saved!</Text>
                                            </>
                                        ) : (
                                            <>
                                                <Text style={styles.primaryActionText}>Save & Cook</Text>
                                                <ArrowRight size={20} color={Colors.backgroundDark} />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: Colors.backgroundDark,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
    },
    dimmer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    aiIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(43, 238, 91, 0.1)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(43, 238, 91, 0.2)",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: Colors.white,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    emptyStateContainer: {
        alignItems: "center",
        justifyContent: "center",
        flexGrow: 1,
        paddingBottom: 40,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: "700",
        color: Colors.white,
        textAlign: "center",
        marginBottom: 12,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.6)",
        textAlign: "center",
        marginBottom: 40,
        lineHeight: 24,
        maxWidth: "80%",
    },
    inputContainer: {
        width: "100%",
        position: "relative",
        marginBottom: 32,
    },
    input: {
        width: "100%",
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 24,
        padding: 20,
        paddingRight: 60,
        color: Colors.white,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        minHeight: 64,
    },
    sendButton: {
        position: "absolute",
        right: 8,
        bottom: 8,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    sendButtonDisabled: {
        opacity: 0.5,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    suggestions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
    },
    suggestionChip: {
        backgroundColor: "rgba(255,255,255,0.05)",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    suggestionText: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
    },

    // Recipe Results
    recipeContainer: {
        flex: 1,
    },
    recipeScroll: {
        flex: 1,
    },
    recipeTitle: {
        fontSize: 32,
        fontWeight: "800",
        color: Colors.white,
        marginBottom: 12,
    },
    recipeMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    recipeMeta: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: "600",
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.3)",
        marginHorizontal: 8,
    },
    recipeDescription: {
        fontSize: 16,
        color: "rgba(255,255,255,0.8)",
        lineHeight: 24,
        marginBottom: 24,
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.1)",
        marginBottom: 24,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: "700",
        color: Colors.white,
        marginBottom: 16,
    },
    listContainer: {
        gap: 12,
        marginBottom: 24,
    },
    ingredientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "rgba(255,255,255,0.03)",
        padding: 12,
        borderRadius: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    ingredientText: {
        fontSize: 16,
        color: "rgba(255,255,255,0.9)",
        flex: 1,
    },
    missingBadge: {
        backgroundColor: "rgba(249, 115, 22, 0.2)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    missingText: {
        fontSize: 10,
        color: Colors.orange,
        fontWeight: "700",
    },
    instructionRow: {
        flexDirection: 'row',
        gap: 16,
    },
    stepCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.primary,
    },
    instructionText: {
        fontSize: 16,
        color: "rgba(255,255,255,0.8)",
        lineHeight: 24,
        flex: 1,
    },
    actionFooter: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.1)",
    },
    secondaryActionButton: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.05)",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    secondaryActionText: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.white,
    },
    primaryActionButton: {
        flex: 2,
        flexDirection: 'row',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successButton: {
        backgroundColor: Colors.green,
    },
    primaryActionText: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.backgroundDark,
    },
});
