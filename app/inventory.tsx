import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
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
} from "lucide-react-native";
import Colors from "@/constants/colors";

type FilterType = "all" | "expiring" | "low" | "favorites";

type IngredientStatus = "good" | "low" | "expiring";

interface Ingredient {
  id: string;
  name: string;
  image: string;
  addedDate: string;
  status: IngredientStatus;
  stockPercentage: number;
  expiresIn?: string;
}

interface Category {
  id: string;
  name: string;
  itemCount: number;
  ingredients: Ingredient[];
}

const INVENTORY_DATA: Category[] = [
  {
    id: "1",
    name: "Oils & Spices",
    itemCount: 12,
    ingredients: [
      {
        id: "1-1",
        name: "Extra Virgin Olive Oil",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCGihIrsVtJRXiaNrreWJ3lM36p0d3HqJYFX5GfaAqlOPdgqetMaggvadRosPF4KsiZcrN9Xpcn_1GSKCoLMrRZNegS43G0NSdJpcevWkvKtuWmjkozS7lRFoXkjR2UaTu3Nby-s526Ct-5mmUEuAjvYyx1hexJZ9u4p8_konOz-p-t0C65FMjWeLoN1H1CwoxoRTug4tOPB6wfuaxNCZ_2N_PuzX8UPeOkPE02YfJ-S6NccQzIoVcrtN0tlLgAu9sij7Qd1qG3Dw",
        addedDate: "Added 2 days ago",
        status: "good",
        stockPercentage: 75,
      },
      {
        id: "1-2",
        name: "Garlic Cloves",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUuHZTd2EL84IxLzodhX6BSnuiMWOsvVrJ_PI7i0V24zTPHLL8gvOMBQ5nbl-UrrnMOvDvTOhRj40j9_Dp8ykRFnxe8nuLvdDi0xmGOpPGtTpja-6Nci0g_jGEGwj-fv9Kmm8Gj7icidipi4QGdsho4ofbJAMXdfWSE24c2AKoISz4IkBZgHBkG4PuWxXDi2RqkLBNHOIXRSHHSC0SzcGwif9tTNp3EFl9gwLTJovDGmFfkZyuzOGahIMizI0ZV_Ev90A4IrUegA",
        addedDate: "Added 5 days ago",
        status: "low",
        stockPercentage: 25,
      },
    ],
  },
  {
    id: "2",
    name: "Grains & Pasta",
    itemCount: 8,
    ingredients: [
      {
        id: "2-1",
        name: "Spaghetti Pasta",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyBHuo2syefoICrth20zOOkyxJGr7IdioHXX-118lN1ydGbO7e3ZPyodX6okmABO7GfEhV8_swxL0zAeoHPt21YSECsfgKSqfn_KcEABDsgS2qwQtEvVjKVowT4dB_jkoBTD0eqbxJIIV51irecbAEK3FanqFcQ2Dn9hDLHdY6wqtcS6GOnfeXVDFvDPi7Q6xM9vuTawlj6HcvCipskJhvFNrTWJ_r79kTXxoIflzGxRD9a28b9EGLfBKbjqmb8bwEwUoeGb8Zig",
        addedDate: "Added 1 week ago",
        status: "good",
        stockPercentage: 100,
      },
      {
        id: "2-2",
        name: "Brown Rice",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDFBjVsYo6FI2HtenEQ0CdD7FS-eF3Oag5PxJIgXbPa32CRyiVIZDnvnBhlqRp-f_yPGTwlbIV4-ugkDmG0Wu5__MhnJXabpzmoKB8-ygnCmCwVqSpFXiX38e0P6vffaE1J9Gs8zjtJ8l9ul3Vb5xPcAKXtas4oELv1CUTY-dKAAzBdllbIx_LMn2kzZngy7OM31RwT7zr_az9ePjV4uolVWuHo8ipQxZUC8tmymVyfAbj5LjW717BV1gBy-NWs6WOS17NSnGMRaQ",
        addedDate: "Expires in 2 days",
        status: "expiring",
        stockPercentage: 50,
        expiresIn: "2 days",
      },
    ],
  },
  {
    id: "3",
    name: "Proteins",
    itemCount: 5,
    ingredients: [
      {
        id: "3-1",
        name: "Fresh Salmon Fillet",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuARg6uLtked95kTG0C5p5SRtNryHxrdaIGcD1hMIRwlCp2H0Xnt9NIZnbi01naMTFFqqzLxaf97lrt4L4QA-pQA6EXeU4etHmHrYKHgF16LkIENW2mramX5I8INSM_6hI81K7DAmysd4xv2NbQGtqZuLs2L6rNYSE3qvr6MaXqHHVIqAEcPvRDDdpTrF6qHyQe8fBtD409m2x9mwyvuz_w7ivtFS5Abn1DcDGnfASmo3lYm7u62cXCvbvAoDxgvTtTiM3DFdZrZmQ",
        addedDate: "Expires in 1 day",
        status: "expiring",
        stockPercentage: 100,
        expiresIn: "1 day",
      },
    ],
  },
];

const FILTERS: { key: FilterType; label: string; dotColor?: string }[] = [
  { key: "all", label: "All Items" },
  { key: "expiring", label: "Expiring Soon", dotColor: "#ef4444" },
  { key: "low", label: "Low Stock", dotColor: "#facc15" },
  { key: "favorites", label: "Favorites" },
];

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const getStatusColor = (status: IngredientStatus) => {
    switch (status) {
      case "good":
        return Colors.green;
      case "low":
        return Colors.yellow;
      case "expiring":
        return Colors.red;
    }
  };

  const getStatusLabel = (status: IngredientStatus) => {
    switch (status) {
      case "good":
        return "GOOD";
      case "low":
        return "LOW";
      case "expiring":
        return "EXPIRING";
    }
  };

  const getProgressColor = (status: IngredientStatus) => {
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

  const filterIngredients = (ingredients: Ingredient[]) => {
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

  const handleQuickScan = () => {
    router.push("/scanner");
  };

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
            <Text style={styles.headerTitle}>My Kitchen</Text>
            <Text style={styles.headerSubtitle}>Inventory Updated: Today</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsLeft}>
            <Text style={styles.statsLabel}>TOTAL INGREDIENTS</Text>
            <View style={styles.statsValueRow}>
              <Text style={styles.statsValue}>42</Text>
              <Text style={styles.statsChange}>+3 new</Text>
            </View>
          </View>
          <View style={styles.progressCircleContainer}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>85%</Text>
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
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {INVENTORY_DATA.map((category) => {
          const filteredIngredients = filterIngredients(category.ingredients);
          if (filteredIngredients.length === 0 && activeFilter !== "all")
            return null;

          return (
            <View key={category.id} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{category.name}</Text>
                <Text style={styles.categoryCount}>
                  {filteredIngredients.length} Items
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
        })}
      </ScrollView>

      <View style={[styles.floatingActionContainer, { bottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={styles.manualAddButton}
          onPress={() => router.push("/manual-add")}
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
    </View >
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
  statsChange: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
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
});
