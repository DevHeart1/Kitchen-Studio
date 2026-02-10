import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    Image,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    ArrowLeft,
    Plus,
    Trash2,
    CheckCircle,
    Circle,
    ShoppingBag,
    MoreHorizontal,
    X,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useShoppingList, ShoppingListItem } from "@/contexts/ShoppingListContext";

export default function ShoppingListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { items, addItem, toggleItem, removeItem, clearChecked } = useShoppingList();
    const [newItemName, setNewItemName] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const handleAddItem = async () => {
        if (!newItemName.trim()) return;

        await addItem({
            name: newItemName.trim(),
            category: "Uncategorized",
        });

        setNewItemName("");
        setIsAdding(false);
    };

    const renderItem = ({ item }: { item: ShoppingListItem }) => (
        <TouchableOpacity
            style={[styles.itemCard, item.isChecked && styles.itemCardChecked]}
            onPress={() => toggleItem(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.itemLeft}>
                <TouchableOpacity onPress={() => toggleItem(item.id)}>
                    {item.isChecked ? (
                        <CheckCircle size={24} color={Colors.primary} fill={Colors.primary + "20"} />
                    ) : (
                        <Circle size={24} color={Colors.textMuted} />
                    )}
                </TouchableOpacity>

                {item.image && (
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                )}

                <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, item.isChecked && styles.itemNameChecked]}>
                        {item.name}
                    </Text>
                    {(item.amount || item.category !== "Uncategorized") && (
                        <Text style={styles.itemDetails}>
                            {item.amount && <Text>{item.amount} • </Text>}
                            {item.category}
                        </Text>
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeItem(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Trash2 size={20} color={Colors.textMuted} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Shopping List</Text>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={clearChecked}
                    disabled={items.filter(i => i.isChecked).length === 0}
                >
                    {items.some(i => i.isChecked) && (
                        <Text style={styles.clearText}>Clear</Text>
                    )}
                </TouchableOpacity>
            </View>

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingBottom: insets.bottom + 100 },
                ]}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <ShoppingBag size={64} color={Colors.textMuted} />
                        <Text style={styles.emptyTitle}>Your list is empty</Text>
                        <Text style={styles.emptyText}>
                            Add items you need to buy for your next cooking session.
                        </Text>
                    </View>
                }
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
                style={[styles.inputContainer, { paddingBottom: insets.bottom + 16 }]}
            >
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Add item..."
                        placeholderTextColor={Colors.textMuted}
                        value={newItemName}
                        onChangeText={setNewItemName}
                        onSubmitEditing={handleAddItem}
                        returnKeyType="done"
                    />
                    <TouchableOpacity
                        style={[
                            styles.addButton,
                            !newItemName.trim() && styles.addButtonDisabled,
                        ]}
                        onPress={handleAddItem}
                        disabled={!newItemName.trim()}
                    >
                        <Plus size={24} color={Colors.backgroundDark} />
                    </TouchableOpacity>
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: Colors.backgroundDark,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
    },
    headerButton: {
        width: 60,
        height: 48,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: Colors.white,
    },
    clearText: {
        color: "#EF4444",
        fontWeight: "600",
        fontSize: 14,
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    itemCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(255,255,255,0.05)",
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    itemCardChecked: {
        opacity: 0.6,
        backgroundColor: "rgba(255,255,255,0.02)",
    },
    itemLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    itemImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        color: Colors.white,
        fontWeight: "600",
    },
    itemNameChecked: {
        textDecorationLine: "line-through",
        color: Colors.textMuted,
    },
    itemDetails: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    deleteButton: {
        padding: 8,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 100,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: Colors.white,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textMuted,
        textAlign: "center",
        lineHeight: 24,
    },
    inputContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.backgroundDark,
        paddingHorizontal: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.1)",
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    input: {
        flex: 1,
        height: 50,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 25,
        paddingHorizontal: 20,
        fontSize: 16,
        color: Colors.white,
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    addButtonDisabled: {
        opacity: 0.5,
        backgroundColor: Colors.textMuted,
    },
});
