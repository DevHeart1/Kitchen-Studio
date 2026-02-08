import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Bell,
  Search,
  QrCode,
  MoreVertical,
  AlertTriangle,
  ArrowLeft,
  Plus,
  ScanLine,
  ShoppingBasket,
  Sparkles,
  Package,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useInventory, InventoryItem } from "@/contexts/InventoryContext";

type FilterType = "all" | "expiring" | "low" | "favorites";

const FILTERS: { key: FilterType; label: string; dotColor?: string }[] = [
  { key: "all", label: "All Items" },
  { key: "expiring", label: "Expiring Soon", dotColor: "#ef4444" },
  { key: "low", label: "Low Stock", dotColor: "#facc15" },
];

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { inventory, getTotalCount, getExpiringCount } = useInventory();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    if (inventory.length === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [inventory.length]);

  const categorizedInventory = useMemo(() => {
    const catMap: Record<string, InventoryItem[]> = {};
    inventory.forEach((item) => {
      if (!catMap[item.category]) {
        catMap[item.category] = [];
      }
      catMap[item.category].push(item);
    });
    return Object.entries(catMap).map(([name, items]) => ({
      id: name,
      name,
      ingredients: items,
    }));
  }, [inventory]);

  const stockPercentage = useMemo(() => {
    if (inventory.length === 0) return 0;
    const total = inventory.reduce((sum, item) => sum + item.stockPercentage, 0);
    return Math.round(total / inventory.length);
  }, [inventory]);

  const lowStockCount = useMemo(() => {
    return inventory.filter((item) => item.status === "low").length;
  }, [inventory]);

  const getStatusColor = (status: InventoryItem["status"]) => {
    switch (status) {
      case "good":
        return Colors.green;
      case "low":
        return Colors.yellow;
      case "expiring":
        return Colors.red;
    }
  };

  const getStatusLabel = (status: InventoryItem["status"]) => {
    switch (status) {
      case "good":
        return "GOOD";
      case "low":
        return "LOW";
      case "expiring":
        return "EXPIRING";
    }
  };

  const getProgressColor = (status: InventoryItem["status"]) => {
    switch (status) {
      case "good":
        return Colors.primary;
      case "low":
        return Colors.yellow;
      case "expiring":
        return "rgba(255, 255, 255, 0.4)";
    }
  };

  const getStockLabel = (percentage: number) => {
    if (percentage >= 100) return "Full";
    return `${percentage}%`;
  };

  const filterIngredients = (ingredients: InventoryItem[]) => {
    let filtered = ingredients;

    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (activeFilter) {
      case "expiring":
        filtered = filtered.filter((item) => item.status === "expiring");
        break;
      case "low":
        filtered = filtered.filter((item) => item.status === "low");
        break;
      default:
        break;
    }

    return filtered;
  };

  const hasFilterResults = useMemo(() => {
    return categorizedInventory.some(
      (cat) => filterIngredients(cat.ingredients).length > 0
    );
  }, [categorizedInventory, searchQuery, activeFilter]);

  const handleQuickScan = () => {
    router.push("/scanner");
  };

  const renderEmptyState = () => (
    <Animated.View
      style={[
        styles.emptyContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.emptyIllustration}>
        <Animated.View
          style={[
            styles.emptyMainCircle,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View style={styles.emptyInnerCircle}>
            <ShoppingBasket size={44} color={Colors.primary} />
          </View>
        </Animated.View>

        <View style={[styles.floatingOrb, styles.orbRight]}>
          <Package size={16} color={Colors.orange} />
        </View>
        <View style={[styles.floatingOrb, styles.orbLeft]}>
          <Sparkles size={14} color={Colors.primary} />
        </View>
      </View>

      <Text style={styles.emptyTitle}>Your pantry is empty</Text>
      <Text style={styles.emptySubtitle}>
        Start tracking your ingredients to get personalized recipe suggestions and never waste food again.
      </Text>

      <View style={styles.emptyActions}>
        <TouchableOpacity
          style={styles.emptyPrimaryButton}
          onPress={handleQuickScan}
          activeOpacity={0.85}
        >
          <ScanLine size={20} color={Colors.backgroundDark} />
          <Text style={styles.emptyPrimaryButtonText}>Scan Items</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emptySecondaryButton}
          onPress={() => router.push("/manual-add" as never)}
          activeOpacity={0.85}
        >
          <Plus size={20} color={Colors.white} />
          <Text style={styles.emptySecondaryButtonText}>Add Manually</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.emptyFeatures}>
        {[
          { icon: <ScanLine size={18} color={Colors.primary} />, title: "Barcode Scanner", desc: "Scan products to add instantly" },
          { icon: <AlertTriangle size={18} color={Colors.orange} />, title: "Expiry Tracking", desc: "Get alerts before items expire" },
          { icon: <Sparkles size={18} color="#8b5cf6" />, title: "Smart Suggestions", desc: "Recipes based on what you have" },
        ].map((feature, idx) => (
          <View key={idx} style={styles.featureRow}>
            <View style={styles.featureIconBg}>
              {feature.icon}
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  const renderNoFilterResults = () => (
    <View style={styles.noResultsContainer}>
      <View style={styles.noResultsIcon}>
        <Search size={28} color={Colors.textMuted} />
      </View>
      <Text style={styles.noResultsTitle}>No items found</Text>
      <Text style={styles.noResultsDesc}>
        {searchQuery
          ? `No items match "${searchQuery}"`
          : "No items match this filter"}
      </Text>
      {searchQuery ? (
        <TouchableOpacity
          style={styles.noResultsButton}
          onPress={() => setSearchQuery("")}
        >
          <Text style={styles.noResultsButtonText}>Clear Search</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.noResultsButton}
          onPress={() => setActiveFilter("all")}
        >
          <Text style={styles.noResultsButtonText}>Show All Items</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>My Pantry</Text>
            {inventory.length > 0 && (
              <Text style={styles.headerSubtitle}>
                {getTotalCount} item{getTotalCount !== 1 ? "s" : ""} tracked
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push("/notifications")}
          >
            <Bell size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {inventory.length > 0 && (
          <>
            <View style={styles.statsCard}>
              <View style={styles.statsLeft}>
                <Text style={styles.statsLabel}>TOTAL INGREDIENTS</Text>
                <View style={styles.statsValueRow}>
                  <Text style={styles.statsValue}>{getTotalCount}</Text>
                  {getExpiringCount > 0 && (
                    <Text style={styles.statsWarning}>
                      {getExpiringCount} expiring
                    </Text>
                  )}
                  {lowStockCount > 0 && getExpiringCount === 0 && (
                    <Text style={styles.statsLow}>
                      {lowStockCount} low
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.progressCircleContainer}>
                <View style={styles.progressCircle}>
                  <Text style={styles.progressText}>{stockPercentage}%</Text>
                </View>
              </View>
            </View>

            <View style={styles.searchContainer}>
              <Search size={18} color="rgba(255, 255, 255, 0.4)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search ingredients..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScroll}
            >
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    activeFilter === filter.key && styles.filterChipActive,
                  ]}
                  onPress={() => setActiveFilter(filter.key)}
                >
                  {filter.dotColor && (
                    <View
                      style={[styles.filterDot, { backgroundColor: filter.dotColor }]}
                    />
                  )}
                  <Text
                    style={[
                      styles.filterChipText,
                      activeFilter === filter.key && styles.filterChipTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {inventory.length === 0 ? (
          renderEmptyState()
        ) : !hasFilterResults ? (
          renderNoFilterResults()
        ) : (
          categorizedInventory.map((category) => {
            const filteredIngredients = filterIngredients(category.ingredients);
            if (filteredIngredients.length === 0) return null;

            return (
              <View key={category.id} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{category.name}</Text>
                  <Text style={styles.categoryCount}>
                    {filteredIngredients.length} Item{filteredIngredients.length !== 1 ? "s" : ""}
                  </Text>
                </View>

                <View style={styles.ingredientsList}>
                  {filteredIngredients.map((ingredient) => (
                    <TouchableOpacity
                      key={ingredient.id}
                      style={[
                        styles.ingredientCard,
                        ingredient.status === "expiring" &&
                          styles.ingredientCardExpiring,
                      ]}
                    >
                      {ingredient.status === "expiring" && (
                        <View style={styles.expiringGlow} />
                      )}
                      <Image
                        source={{ uri: ingredient.image }}
                        style={[
                          styles.ingredientImage,
                          ingredient.status === "expiring" &&
                            styles.ingredientImageGrayscale,
                        ]}
                      />
                      <View style={styles.ingredientInfo}>
                        <View style={styles.ingredientHeader}>
                          <Text
                            style={styles.ingredientName}
                            numberOfLines={1}
                          >
                            {ingredient.name}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  getStatusColor(ingredient.status) + "33",
                              },
                            ]}
                          >
                            {ingredient.status === "expiring" && (
                              <AlertTriangle
                                size={10}
                                color={getStatusColor(ingredient.status)}
                              />
                            )}
                            <Text
                              style={[
                                styles.statusText,
                                { color: getStatusColor(ingredient.status) },
                              ]}
                            >
                              {getStatusLabel(ingredient.status)}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.ingredientDate,
                            ingredient.status === "expiring" &&
                              styles.ingredientDateExpiring,
                          ]}
                        >
                          {ingredient.addedDate}
                        </Text>
                        <View style={styles.progressRow}>
                          <View style={styles.progressBar}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${ingredient.stockPercentage}%`,
                                  backgroundColor: getProgressColor(
                                    ingredient.status
                                  ),
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.progressLabel}>
                            {getStockLabel(ingredient.stockPercentage)}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.moreButton}>
                        <MoreVertical size={18} color="rgba(255, 255, 255, 0.4)" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.floatingActionContainer, { bottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={styles.manualAddButton}
          onPress={() => router.push("/manual-add" as never)}
          activeOpacity={0.9}
        >
          <Plus size={24} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickScanButton}
          onPress={handleQuickScan}
          activeOpacity={0.9}
        >
          <QrCode size={24} color={Colors.backgroundDark} />
          <Text style={styles.quickScanText}>Quick Scan</Text>
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
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statsCard: {
    backgroundColor: "rgba(43, 238, 91, 0.15)",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.primary + "33",
    marginBottom: 16,
  },
  statsLeft: {},
  statsLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statsValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  statsValue: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  statsWarning: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.orange,
  },
  statsLow: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.yellow,
  },
  progressCircleContainer: {
    backgroundColor: Colors.cardDark,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: Colors.primary + "4D",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  progressText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardDark,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.white,
  },
  filtersScroll: {
    gap: 12,
    paddingRight: 24,
  },
  filterChip: {
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
  filterChipActive: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "rgba(255, 255, 255, 0.8)",
  },
  filterChipTextActive: {
    color: Colors.backgroundDark,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  categoryCount: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "500" as const,
  },
  ingredientsList: {
    gap: 16,
  },
  ingredientCard: {
    backgroundColor: Colors.cardDark,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
  },
  ingredientCardExpiring: {
    borderColor: Colors.red + "4D",
  },
  expiringGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 64,
    height: 64,
    backgroundColor: Colors.red + "1A",
  },
  ingredientImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  ingredientImageGrayscale: {
    opacity: 0.7,
  },
  ingredientInfo: {
    flex: 1,
    minWidth: 0,
  },
  ingredientHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
  },
  ingredientDate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
    marginBottom: 8,
  },
  ingredientDateExpiring: {
    color: "rgba(239, 68, 68, 0.6)",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: "rgba(255, 255, 255, 0.6)",
  },
  moreButton: {
    padding: 8,
    position: "absolute",
    right: 8,
    bottom: 8,
  },
  floatingActionContainer: {
    position: "absolute",
    right: 24,
    left: 24,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 16,
    pointerEvents: "box-none",
  },
  manualAddButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.cardDark,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  quickScanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  quickScanText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 8,
  },
  emptyIllustration: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    position: "relative",
  },
  emptyMainCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.primary + "25",
  },
  emptyInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + "1A",
    alignItems: "center",
    justifyContent: "center",
  },
  floatingOrb: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardGlass,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  orbRight: {
    top: 20,
    right: 0,
  },
  orbLeft: {
    bottom: 24,
    left: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: 28,
  },
  emptyActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 36,
  },
  emptyPrimaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyPrimaryButtonText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  emptySecondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  emptySecondaryButtonText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  emptyFeatures: {
    width: "100%",
    gap: 14,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  featureIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  noResultsContainer: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  noResultsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 6,
  },
  noResultsDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },
  noResultsButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  noResultsButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.white,
  },
});
