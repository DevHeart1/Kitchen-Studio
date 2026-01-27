import React, { useState, useMemo } from "react";
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
  ArrowLeft,
  Play,
  RefreshCw,
  Clock,
  ChefHat,
  Star,
  Filter,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { recentCooks } from "@/mocks/sessions";
import { RecentCook } from "@/types";

type FilterType = "all" | "in_progress" | "completed";

export default function RecentCooksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredCooks = useMemo(() => {
    switch (activeFilter) {
      case "in_progress":
        return recentCooks.filter((cook) => cook.progress < 100);
      case "completed":
        return recentCooks.filter((cook) => cook.progress === 100);
      default:
        return recentCooks;
    }
  }, [activeFilter]);

  const inProgressCount = recentCooks.filter((c) => c.progress < 100).length;
  const completedCount = recentCooks.filter((c) => c.progress === 100).length;

  const handleCookPress = (cook: RecentCook) => {
    router.push({
      pathname: "/cook-session",
      params: { id: cook.id },
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderCookCard = (cook: RecentCook) => {
    const isCompleted = cook.progress === 100;

    return (
      <TouchableOpacity
        key={cook.id}
        style={styles.cookCard}
        onPress={() => handleCookPress(cook)}
        activeOpacity={0.8}
      >
        <View style={styles.cardImageContainer}>
          <Image source={{ uri: cook.image }} style={styles.cardImage} />
          <View style={styles.cardImageOverlay} />
          {isCompleted && cook.rating && (
            <View style={styles.ratingBadge}>
              <Star size={12} color={Colors.yellow} fill={Colors.yellow} />
              <Text style={styles.ratingText}>{cook.rating}</Text>
            </View>
          )}
          <View style={styles.durationBadge}>
            <Clock size={12} color={Colors.white} />
            <Text style={styles.durationText}>{cook.duration}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {cook.title}
            </Text>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isCompleted && styles.actionButtonCompleted,
              ]}
            >
              {isCompleted ? (
                <RefreshCw size={18} color={Colors.textMuted} />
              ) : (
                <Play size={18} color={Colors.primary} fill={Colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {cook.chefName && (
            <View style={styles.chefRow}>
              {cook.chefAvatar && (
                <Image
                  source={{ uri: cook.chefAvatar }}
                  style={styles.chefAvatar}
                />
              )}
              <Text style={styles.chefName}>{cook.chefName}</Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            {isCompleted ? (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>
                  {cook.completedDate || formatTimeAgo(cook.startedAt)}
                </Text>
              </View>
            ) : (
              <View style={styles.progressSection}>
                <View style={styles.progressInfo}>
                  <Text style={styles.stepText}>
                    Step {cook.currentStep} of {cook.totalSteps}
                  </Text>
                  <Text style={styles.progressPercent}>{cook.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${cook.progress}%` },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>

          {isCompleted && cook.notes && (
            <Text style={styles.notesText} numberOfLines={2}>
              "{cook.notes}"
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recent Cooks</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <View style={[styles.statIconBg, styles.primaryIconBg]}>
            <ChefHat size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.statValue}>{recentCooks.length}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
        </View>
        <View style={styles.statsCard}>
          <View style={[styles.statIconBg, styles.orangeIconBg]}>
            <Play size={20} color={Colors.orange} />
          </View>
          <View>
            <Text style={styles.statValue}>{inProgressCount}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "all" && styles.filterButtonActive,
          ]}
          onPress={() => setActiveFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "all" && styles.filterTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "in_progress" && styles.filterButtonActive,
          ]}
          onPress={() => setActiveFilter("in_progress")}
        >
          <View style={styles.filterDot} />
          <Text
            style={[
              styles.filterText,
              activeFilter === "in_progress" && styles.filterTextActive,
            ]}
          >
            In Progress ({inProgressCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "completed" && styles.filterButtonActive,
          ]}
          onPress={() => setActiveFilter("completed")}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === "completed" && styles.filterTextActive,
            ]}
          >
            Completed ({completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filteredCooks.length === 0 ? (
          <View style={styles.emptyState}>
            <ChefHat size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No cooking sessions</Text>
            <Text style={styles.emptySubtitle}>
              Start cooking from a recipe to see your sessions here
            </Text>
          </View>
        ) : (
          filteredCooks.map(renderCookCard)
        )}
      </ScrollView>
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
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  headerPlaceholder: {
    width: 40,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryIconBg: {
    backgroundColor: Colors.primary + "20",
  },
  orangeIconBg: {
    backgroundColor: Colors.orange + "20",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardGlass,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  filterButtonActive: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.orange,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  cookCard: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  cardImageContainer: {
    width: "100%",
    height: 160,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  durationBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
    lineHeight: 24,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonCompleted: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  chefRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  chefAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  chefName: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "500" as const,
  },
  cardFooter: {
    marginTop: 16,
  },
  completedBadge: {
    backgroundColor: Colors.greenBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  completedText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.green,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressSection: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  progressPercent: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "700" as const,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  notesText: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: "italic",
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    maxWidth: 250,
  },
});
