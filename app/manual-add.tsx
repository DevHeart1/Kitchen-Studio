import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Check, Plus } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useInventory } from "@/contexts/InventoryContext";

const CATEGORIES = [
    "Oils & Spices",
    "Grains & Pasta",
    "Proteins",
    "Dairy",
    "Produce",
    "Canned Goods",
    "Condiments",
    "Beverages",
    "Snacks",
    "Baking",
    "Frozen",
    "Other",
];

const PLACEHOLDER_IMAGES: Record<string, string> = {
    "Oils & Spices": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200",
    "Grains & Pasta": "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=200",
    "Proteins": "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200",
    "Dairy": "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200",
    "Produce": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200",
    "Canned Goods": "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=200",
    "Condiments": "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=200",
    "Beverages": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200",
    "Snacks": "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200",
    "Baking": "https://images.unsplash.com/photo-1486427944544-d2c6128c6804?w=200",
    "Frozen": "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=200",
    "Other": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200",
};

export default function ManualAddScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { addItem } = useInventory();

    const [name, setName] = useState("");
    const [category, setCategory] = useState("Other");
    const [quantity, setQuantity] = useState("1");
    const [unit, setUnit] = useState("pcs");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAdd = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Please enter an item name");
            return;
        }

        const count = parseInt(quantity);
        if (isNaN(count) || count < 1) {
            Alert.alert("Error", "Please enter a valid quantity (1 or more)");
            return;
        }

        setIsSubmitting(true);
        try {
            const promises = [];
            for (let i = 0; i < count; i++) {
                promises.push(addItem({
                    name: name.trim(),
                    image: PLACEHOLDER_IMAGES[category] || PLACEHOLDER_IMAGES["Other"],
                    category: category,
                    addedDate: "Added just now",
                    status: "good",
                    stockPercentage: 100,
                    // We don't save quantity/unit per item if we are splitting by count
                    // But we could save 'unit' if it represents package type e.g. 'bottle'
                    unit: unit,
                }));
            }
            await Promise.all(promises);
            router.back();
        } catch (error) {
            console.error("Failed to add items:", error);
            Alert.alert("Error", "Failed to add items. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Item</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                >
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Item Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Olive Oil"
                            placeholderTextColor="rgba(255, 255, 255, 0.4)"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Quantity</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="1"
                                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                value={quantity}
                                onChangeText={setQuantity}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Unit</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="pcs"
                                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                value={unit}
                                onChangeText={setUnit}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Category</Text>
                        <View style={styles.categoriesGrid}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[
                                        styles.categoryChip,
                                        category === cat && styles.categoryChipActive,
                                    ]}
                                    onPress={() => setCategory(cat)}
                                >
                                    <Text
                                        style={[
                                            styles.categoryText,
                                            category === cat && styles.categoryTextActive,
                                        ]}
                                    >
                                        {cat}
                                    </Text>
                                    {category === cat && (
                                        <Check size={14} color={Colors.backgroundDark} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={[styles.addButton, isSubmitting && styles.addButtonDisabled]}
                    onPress={handleAdd}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <Text style={styles.addButtonText}>Adding...</Text>
                    ) : (
                        <>
                            <Plus size={20} color={Colors.backgroundDark} />
                            <Text style={styles.addButtonText}>Add to Pantry</Text>
                        </>
                    )}
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.05)",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: Colors.white,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 24,
        gap: 32,
    },
    inputGroup: {
        gap: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.white,
        marginBottom: 4,
    },
    input: {
        backgroundColor: Colors.cardDark,
        borderRadius: 12,
        padding: 16,
        color: Colors.white,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    categoriesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    categoryChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: Colors.cardDark,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    categoryChipActive: {
        backgroundColor: Colors.white,
        borderColor: Colors.white,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: "600",
        color: "rgba(255, 255, 255, 0.8)",
    },
    categoryTextActive: {
        color: Colors.backgroundDark,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.05)",
    },
    addButton: {
        backgroundColor: Colors.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 16,
        borderRadius: 16,
    },
    addButtonDisabled: {
        opacity: 0.7,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.backgroundDark,
    },
    row: {
        flexDirection: "row",
        gap: 12,
    },
});
