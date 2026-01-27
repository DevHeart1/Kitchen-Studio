import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Settings,
  Package,
  Clock,
  Sparkles,
  ChevronRight,
  Plus,
  ScanLine,
  UtensilsCrossed,
  Fish,
  Leaf,
  Bookmark,
  Play,
  Trash2,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useSavedRecipes, SavedRecipe } from "@/contexts/SavedRecipesContext";

const PANTRY_RECIPES = [
  {
    id: "1",
    title: "Smashed Avo Toast",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDbORWyKcFoNSQNwrAhXwEnACgEq9iKiYxfPU3NM1X52YCS5AbxTwaYWKe2N4_UVX9RG6ekc1dVLgNWS22pTz6Opy0hcmHekFanmaOkqJ8P2glG06yFlhzz0vYyEL8SR4jvshI8FF2JbmayhirMO6d4STTwhWFYWK_q6c0Yr91ylZNuDpe42xYTVT53EQUXasx4PrXVNhK38djgbV4ftB0OW7NWO_iCIn571Q3GJ_0avOfdhyXHdRVGFfvkcA-9AASpqE_AMByYWg",
    hasAll: true,
    time: "10 min",
  },
  {
    id: "2",
    title: "Garlic Butter Salmon",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCthHYMUEBYzQ9rYHH68GujT_ynIprHibR2MMnTaUEwM7HBh5qrLfcWvQQcrb_dDIfj5wy7CBQ8cq-PhIVwrjVxSTSFfLAFQs2wxbofQixsF9MiGHGNtv17z8dCXWAR_O2P2qA7TX4ff42hYp_qhlYVnNBQJ4y8WkYMikDsl4x2QWHske5J56ZmTWDYBsiUhjSzgvByD_wUVIbKHA-qMu9jwZ6pxHrQAuoIM0mjO0mrQeBkdWxlYVMsbkUCsru0Sdh59avkYy6ubA",
    hasAll: false,
    missingCount: 1,
    time: "25 min",
  },
];

const KITCHEN_TOOLS = [
  { id: "1", name: "Smart\nBlender", icon: "blender", active: true },
  { id: "2", name: "Coffee\nMaker", icon: "coffee", active: false },
  { id: "3", name: "Smart\nFridge", icon: "fridge", active: false },
];

const INVENTORY_CATEGORIES = [
  {
    id: "1",
    name: "Spices & Herbs",
    count: 12,
    note: "Paprika low stock",
    color: Colors.orange,
    bgColor: Colors.orangeBg,
    icon: UtensilsCrossed,
  },
  {
    id: "2",
    name: "Proteins",
    count: 5,
    note: "Salmon expiring",
    color: Colors.red,
    bgColor: Colors.redBg,
    icon: Fish,
  },
  {
    id: "3",
    name: "Produce",
    count: 8,
    note: "Fresh",
    color: Colors.green,
    bgColor: Colors.greenBg,
    icon: Leaf,
  },
];

export default function KitchenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { savedRecipes, removeRecipe, isLoading } = useSavedRecipes();

  const handleScanItems = () => {
    router.push("/scanner");
  };

  const handleRecipePress = (recipe: SavedRecipe) => {
    router.push("/recipe");
  };

  const handleRemoveRecipe = (recipeId: string) => {
    removeRecipe(recipeId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Kitchen</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Settings size={20} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuC0Hhp4xPb80ReWCi9pu-7hjtJDxqcyCPfc7K6XxjIk7aCB9D9r0VT41struXYkzbuiYT954NfldWNWu8-Rb4omGyQBIBzHteHmtsnk2TCE6stdbRuY9wzcNLXEvciQTDSONpvG-nig7BlxlU9ZWqqI755pCcY4uboGcrgGOEzcHOccJgQw8CmspyDe-IdHT8zUitGh88hu-YKr83DI1lVTHKOzkXKg_h-9dktzdmSBGipgYc4dzBh7PqxWdjPgzNphKuN4K8lcQA",
                }}
                style={styles.avatar}
              />
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statCardGlow} />
            <View style={styles.statIconContainer}>
              <Package size={24} color={Colors.primary} />
            </View>
            <Text style={styles.statLabel}>In Stock</Text>
            <Text style={styles.statValue}>42</Text>
            <Text style={styles.statNote}>+5 from last scan</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statCardGlow, styles.orangeGlow]} />
            <View style={[styles.statIconContainer, styles.orangeIconBg]}>
              <Clock size={24} color={Colors.orange} />
            </View>
            <Text style={styles.statLabel}>Expiring Soon</Text>
            <Text style={styles.statValue}>3</Text>
            <Text style={[styles.statNote, styles.orangeText]}>
              Check milk & eggs
            </Text>
          </View>
        </View>

        {savedRecipes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Bookmark size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Saved Recipes</Text>
              </View>
              <Text style={styles.savedCount}>{savedRecipes.length} saved</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.savedRecipesScroll}
            >
              {savedRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.savedRecipeCard}
                  onPress={() => handleRecipePress(recipe)}
                  activeOpacity={0.8}
                >
                  <View style={styles.savedRecipeImageContainer}>
                    <Image
                      source={{ uri: recipe.videoThumbnail }}
                      style={styles.savedRecipeImage}
                    />
                    <View style={styles.savedRecipeOverlay} />
                    <View style={styles.playIconContainer}>
                      <Play size={16} color={Colors.white} fill={Colors.white} />
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveRecipe(recipe.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={14} color={Colors.white} />
                    </TouchableOpacity>
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{recipe.videoDuration}</Text>
                    </View>
                  </View>
                  <View style={styles.savedRecipeInfo}>
                    <Text style={styles.savedRecipeTitle} numberOfLines={2}>
                      {recipe.title}
                    </Text>
                    <View style={styles.savedRecipeMeta}>
                      <View style={styles.readinessIndicator}>
                        <View
                          style={[
                            styles.readinessDot,
                            { backgroundColor: recipe.readinessPercent >= 80 ? Colors.primary : Colors.orange },
                          ]}
                        />
                        <Text style={styles.readinessText}>
                          {recipe.readinessPercent}% ready
                        </Text>
                      </View>
                      <Text style={styles.savedDateText}>
                        {formatDate(recipe.savedAt)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.sectionTitleRow}>
                <Sparkles size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Cook from Pantry</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Recipes based on what you have
              </Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recipesScroll}
          >
            {PANTRY_RECIPES.map((recipe) => (
              <TouchableOpacity key={recipe.id} style={styles.recipeCard}>
                <Image
                  source={{ uri: recipe.image }}
                  style={styles.recipeImage}
                />
                <View style={styles.recipeOverlay} />
                <View style={styles.recipeContent}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <View style={styles.recipeTags}>
                    <View
                      style={[
                        styles.recipeTag,
                        recipe.hasAll
                          ? styles.greenTag
                          : styles.yellowTag,
                      ]}
                    >
                      <Text
                        style={[
                          styles.recipeTagText,
                          recipe.hasAll
                            ? styles.greenTagText
                            : styles.yellowTagText,
                        ]}
                      >
                        {recipe.hasAll
                          ? "You have 100%"
                          : `Missing ${recipe.missingCount} item`}
                      </Text>
                    </View>
                    <View style={styles.timeTag}>
                      <Text style={styles.timeTagText}>{recipe.time}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kitchen Tools</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolsScroll}
          >
            {KITCHEN_TOOLS.map((tool) => (
              <View
                key={tool.id}
                style={[
                  styles.toolCard,
                  !tool.active && styles.toolCardInactive,
                ]}
              >
                <View
                  style={[
                    styles.toolIconContainer,
                    tool.active
                      ? styles.toolIconActive
                      : styles.toolIconInactive,
                  ]}
                >
                  <Package
                    size={20}
                    color={tool.active ? Colors.primary : Colors.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.toolName,
                    !tool.active && styles.toolNameInactive,
                  ]}
                >
                  {tool.name}
                </Text>
                <View
                  style={[
                    styles.toolStatus,
                    tool.active
                      ? styles.toolStatusActive
                      : styles.toolStatusInactive,
                  ]}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.addToolCard}>
              <View style={styles.addToolIconContainer}>
                <Plus size={20} color={Colors.textMuted} />
              </View>
              <Text style={styles.addToolText}>Add{"\n"}Device</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Inventory</Text>
            <TouchableOpacity onPress={() => router.push("/inventory")}>
              <Text style={styles.manageText}>Manage</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inventoryList}>
            {INVENTORY_CATEGORIES.map((category) => (
              <TouchableOpacity key={category.id} style={styles.inventoryCard}>
                <View
                  style={[
                    styles.inventoryIcon,
                    { backgroundColor: category.bgColor },
                  ]}
                >
                  <category.icon size={24} color={category.color} />
                </View>
                <View style={styles.inventoryInfo}>
                  <Text style={styles.inventoryName}>{category.name}</Text>
                  <Text style={styles.inventoryNote}>
                    {category.count} items • {category.note}
                  </Text>
                </View>
                <ChevronRight size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.scanButton} onPress={handleScanItems}>
            <ScanLine size={20} color={Colors.white} />
            <Text style={styles.scanButtonText}>Scan More Items</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary + "33",
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardGlassLight,
    borderRadius: 24,
    padding: 20,
    height: 144,
    justifyContent: "space-between",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  statCardGlow: {
    position: "absolute",
    right: -16,
    top: -16,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + "33",
  },
  orangeGlow: {
    backgroundColor: Colors.orange + "33",
  },
  statIconContainer: {
    marginBottom: 8,
  },
  orangeIconBg: {},
  statLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: "500" as const,
  },
  statValue: {
    fontSize: 40,
    fontWeight: "700" as const,
    color: Colors.white,
    marginTop: -4,
  },
  statNote: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    marginTop: 4,
  },
  orangeText: {
    color: Colors.orange,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  manageText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  recipesScroll: {
    paddingRight: 16,
    gap: 16,
  },
  recipeCard: {
    width: 280,
    height: 176,
    borderRadius: 24,
    overflow: "hidden",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  recipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    backgroundImage:
      "linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.2), transparent)",
  },
  recipeContent: {
    position: "absolute",
    bottom: 12,
    left: 16,
    right: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 8,
  },
  recipeTags: {
    flexDirection: "row",
    gap: 8,
  },
  recipeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  greenTag: {
    backgroundColor: Colors.primary,
  },
  yellowTag: {
    backgroundColor: Colors.yellow,
  },
  recipeTagText: {
    fontSize: 10,
    fontWeight: "700" as const,
  },
  greenTagText: {
    color: Colors.backgroundDark,
  },
  yellowTagText: {
    color: Colors.backgroundDark,
  },
  timeTag: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  timeTagText: {
    fontSize: 10,
    fontWeight: "500" as const,
    color: Colors.white,
  },
  toolsScroll: {
    gap: 12,
    paddingRight: 16,
  },
  toolCard: {
    backgroundColor: Colors.surfaceDark,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 12,
    minWidth: 100,
    alignItems: "center",
    gap: 8,
  },
  toolCardInactive: {
    opacity: 0.7,
  },
  toolIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  toolIconActive: {
    backgroundColor: Colors.primary + "1A",
  },
  toolIconInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  toolName: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: Colors.white,
    textAlign: "center",
  },
  toolNameInactive: {
    color: Colors.textMuted,
  },
  toolStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  toolStatusActive: {
    backgroundColor: Colors.green,
  },
  toolStatusInactive: {
    backgroundColor: Colors.textMuted,
  },
  addToolCard: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 12,
    minWidth: 100,
    alignItems: "center",
    gap: 8,
  },
  addToolIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  addToolText: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: Colors.textMuted,
    textAlign: "center",
  },
  inventoryList: {
    gap: 12,
  },
  inventoryCard: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  inventoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 4,
  },
  inventoryNote: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  scanButton: {
    marginTop: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  savedCount: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  savedRecipesScroll: {
    paddingRight: 16,
    gap: 12,
  },
  savedRecipeCard: {
    width: 200,
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  savedRecipeImageContainer: {
    width: "100%",
    height: 120,
    position: "relative",
  },
  savedRecipeImage: {
    width: "100%",
    height: "100%",
  },
  savedRecipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  playIconContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -16 }, { translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  savedRecipeInfo: {
    padding: 12,
  },
  savedRecipeTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 8,
    lineHeight: 18,
  },
  savedRecipeMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  readinessIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readinessDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  readinessText: {
    fontSize: 11,
    fontWeight: "500" as const,
    color: Colors.textMuted,
  },
  savedDateText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});
