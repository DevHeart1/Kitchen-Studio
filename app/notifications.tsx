import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Bell,
  Clock,
  TriangleAlert,
  Lightbulb,
  Sparkles,
  Check,
  Trash2,
  ShieldAlert,
  Leaf,
  ChefHat,
  Recycle,
  Package,
  BellOff,
  Zap,
  X,
  AlertCircle,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useNotifications } from "@/contexts/NotificationContext";
import { Notification, NotificationType } from "@/types";

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "expiry_urgent":
      return ShieldAlert;
    case "expiry_warning":
      return TriangleAlert;
    case "recipe_suggestion":
      return ChefHat;
    case "smart_recommendation":
      return Sparkles;
    case "storage_tip":
      return Lightbulb;
    case "waste_reduction":
      return Recycle;
    case "ingredient_alert":
      return Package;
    case "cooking_reminder":
      return Clock;
    case "tip":
      return Leaf;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case "expiry_urgent":
      return "#FF4444";
    case "expiry_warning":
      return Colors.orange;
    case "recipe_suggestion":
      return Colors.primary;
    case "smart_recommendation":
      return "#818cf8";
    case "storage_tip":
      return "#06b6d4";
    case "waste_reduction":
      return "#10b981";
    case "ingredient_alert":
      return Colors.yellow;
    case "cooking_reminder":
      return "#3b82f6";
    case "tip":
      return "#34d399";
    default:
      return Colors.primary;
  }
};

const getNotificationLabel = (type: NotificationType) => {
  switch (type) {
    case "expiry_urgent":
      return "URGENT";
    case "expiry_warning":
      return "EXPIRY";
    case "recipe_suggestion":
      return "RECIPE";
    case "smart_recommendation":
      return "AI TIP";
    case "storage_tip":
      return "STORAGE";
    case "waste_reduction":
      return "SAVE FOOD";
    case "ingredient_alert":
      return "LOW STOCK";
    case "cooking_reminder":
      return "REMINDER";
    case "tip":
      return "TIP";
    default:
      return "ALERT";
  }
};

const getPriorityGlow = (priority?: string) => {
  if (priority === "high") return "rgba(255, 68, 68, 0.08)";
  if (priority === "medium") return "rgba(249, 115, 22, 0.05)";
  return "transparent";
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onDismiss: (id: string) => void;
}

const NotificationItem = React.memo(function NotificationItem({
  notification,
  onPress,
  onDismiss,
}: NotificationItemProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const Icon = getNotificationIcon(notification.type);
  const accentColor = getNotificationColor(notification.type);
  const label = getNotificationLabel(notification.type);
  const glowBg = getPriorityGlow(notification.priority);

  const handleDismiss = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: Platform.OS !== "web",
    }).start(() => {
      onDismiss(notification.id);
    });
  }, [fadeAnim, notification.id, onDismiss]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !notification.read && styles.notificationCardUnread,
          { backgroundColor: notification.read ? Colors.cardGlass : glowBg || "rgba(43, 238, 91, 0.04)" },
        ]}
        activeOpacity={0.7}
        onPress={() => onPress(notification)}
        testID={`notification-${notification.id}`}
      >
        {!notification.read && (
          <View style={[styles.unreadIndicator, { backgroundColor: accentColor }]} />
        )}

        <View style={styles.notificationContent}>
          <View style={styles.notificationTopRow}>
            <View style={[styles.iconContainer, { backgroundColor: accentColor + "18" }]}>
              <Icon size={18} color={accentColor} />
            </View>

            <View style={styles.labelTimeRow}>
              <View style={[styles.typeBadge, { backgroundColor: accentColor + "20" }]}>
                <Text style={[styles.typeBadgeText, { color: accentColor }]}>{label}</Text>
              </View>
              <Text style={styles.timestamp}>{formatTimestamp(notification.timestamp)}</Text>
            </View>

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
              activeOpacity={0.6}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.notificationBody}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationMessage} numberOfLines={3}>
              {notification.message}
            </Text>
          </View>

          {notification.relatedItems && notification.relatedItems.length > 0 && (
            <View style={styles.relatedItemsRow}>
              {notification.relatedItems.slice(0, 3).map((item, idx) => (
                <View key={idx} style={styles.relatedItemChip}>
                  <Text style={styles.relatedItemText}>{item}</Text>
                </View>
              ))}
              {notification.relatedItems.length > 3 && (
                <Text style={styles.relatedItemMore}>+{notification.relatedItems.length - 3}</Text>
              )}
            </View>
          )}

          {notification.actionLabel && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: accentColor + "15", borderColor: accentColor + "25" }]}
              activeOpacity={0.7}
              onPress={() => onPress(notification)}
            >
              <Text style={[styles.actionButtonText, { color: accentColor }]}>
                {notification.actionLabel}
              </Text>
            </TouchableOpacity>
          )}

          {notification.aiGenerated && (
            <View style={styles.aiTag}>
              <Sparkles size={10} color="#818cf8" />
              <Text style={styles.aiTagText}>AI Powered</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

type FilterType = "all" | "expiry" | "ai" | "alerts";

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    notifications,
    isLoading,
    isGeneratingAI,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    fetchAIRecommendations,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [headerAnim]);

  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case "expiry":
        return notifications.filter(n =>
          n.type === "expiry_warning" || n.type === "expiry_urgent"
        );
      case "ai":
        return notifications.filter(n =>
          n.aiGenerated || n.type === "smart_recommendation" || n.type === "recipe_suggestion" || n.type === "storage_tip" || n.type === "waste_reduction"
        );
      case "alerts":
        return notifications.filter(n =>
          n.type === "ingredient_alert" || n.type === "cooking_reminder"
        );
      default:
        return notifications;
    }
  }, [notifications, filter]);

  const expiryCount = useMemo(() =>
    notifications.filter(n => n.type === "expiry_warning" || n.type === "expiry_urgent").length,
    [notifications]
  );

  const aiCount = useMemo(() =>
    notifications.filter(n => n.aiGenerated).length,
    [notifications]
  );

  const handleNotificationPress = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionRoute) {
      router.push({
        pathname: notification.actionRoute as any,
        params: notification.actionParams || {},
      });
    }
  }, [router, markAsRead]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAIRecommendations();
    setRefreshing(false);
  }, [fetchAIRecommendations]);

  const handleGenerateAI = useCallback(async () => {
    await fetchAIRecommendations();
  }, [fetchAIRecommendations]);

  const urgentNotifs = useMemo(() =>
    filteredNotifications.filter(n => n.priority === "high"),
    [filteredNotifications]
  );

  const otherNotifs = useMemo(() =>
    filteredNotifications.filter(n => n.priority !== "high"),
    [filteredNotifications]
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, opacity: headerAnim },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          testID="notifications-back"
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.aiButton}
          onPress={handleGenerateAI}
          activeOpacity={0.7}
          disabled={isGeneratingAI}
          testID="generate-ai-btn"
        >
          {isGeneratingAI ? (
            <ActivityIndicator size="small" color="#818cf8" />
          ) : (
            <Sparkles size={20} color="#818cf8" />
          )}
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {([
            { key: "all" as FilterType, label: "All", count: notifications.length },
            { key: "expiry" as FilterType, label: "Expiry", count: expiryCount },
            { key: "ai" as FilterType, label: "AI Tips", count: aiCount },
            { key: "alerts" as FilterType, label: "Alerts", count: undefined },
          ]).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
              onPress={() => setFilter(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
              {tab.count !== undefined && tab.count > 0 && (
                <View style={[
                  styles.filterBadge,
                  filter === tab.key && styles.filterBadgeActive,
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    filter === tab.key && styles.filterBadgeTextActive,
                  ]}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
            activeOpacity={0.7}
          >
            <Check size={14} color={Colors.primary} />
            <Text style={styles.markAllText}>Read all</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <BellOff size={48} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === "expiry"
                ? "No expiry alerts"
                : filter === "ai"
                  ? "No AI recommendations yet"
                  : filter === "alerts"
                    ? "No alerts"
                    : "No notifications yet"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === "expiry"
                ? "Your pantry items are all fresh! Expiry alerts will appear here when items are close to their expiry date."
                : filter === "ai"
                  ? "Tap the sparkle icon above to generate AI-powered tips based on your pantry."
                  : "Add items to your pantry and we'll keep you updated on expiry dates, recipes, and smart tips."}
            </Text>

            {filter === "ai" && (
              <TouchableOpacity
                style={styles.emptyAIButton}
                onPress={handleGenerateAI}
                activeOpacity={0.8}
                disabled={isGeneratingAI}
              >
                {isGeneratingAI ? (
                  <ActivityIndicator size="small" color={Colors.backgroundDark} />
                ) : (
                  <>
                    <Sparkles size={18} color={Colors.backgroundDark} />
                    <Text style={styles.emptyAIButtonText}>Generate AI Tips</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {notifications.length === 0 && filter === "all" && (
              <TouchableOpacity
                style={styles.emptyScanButton}
                onPress={() => router.push("/scanner")}
                activeOpacity={0.8}
              >
                <Zap size={18} color={Colors.primary} />
                <Text style={styles.emptyScanButtonText}>Scan Your Pantry</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {urgentNotifs.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>Urgent</Text>
                  <View style={styles.urgentBadge}>
                    <AlertCircle size={10} color="#FF4444" />
                    <Text style={styles.urgentBadgeText}>{urgentNotifs.length}</Text>
                  </View>
                </View>
                {urgentNotifs.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onPress={handleNotificationPress}
                    onDismiss={dismissNotification}
                  />
                ))}
              </View>
            )}

            {otherNotifs.length > 0 && (
              <View style={styles.sectionContainer}>
                {urgentNotifs.length > 0 && (
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionDot, { backgroundColor: Colors.textMuted }]} />
                    <Text style={styles.sectionTitle}>Other</Text>
                  </View>
                )}
                {otherNotifs.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onPress={handleNotificationPress}
                    onDismiss={dismissNotification}
                  />
                ))}
              </View>
            )}

            {isGeneratingAI && (
              <View style={styles.aiLoadingCard}>
                <ActivityIndicator size="small" color="#818cf8" />
                <Text style={styles.aiLoadingText}>Generating AI recommendations...</Text>
              </View>
            )}

            {notifications.length > 0 && (
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={clearAll}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color={Colors.red} />
                <Text style={styles.clearAllText}>Clear all notifications</Text>
              </TouchableOpacity>
            )}
          </>
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardGlassBorder,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardGlass,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    color: Colors.backgroundDark,
    fontSize: 12,
    fontWeight: "700" as const,
  },
  aiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(129, 140, 248, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.2)",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    backgroundColor: Colors.cardGlass,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterTabActive: {
    backgroundColor: "rgba(43, 238, 91, 0.1)",
    borderColor: "rgba(43, 238, 91, 0.25)",
  },
  filterTabText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "500" as const,
  },
  filterTabTextActive: {
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  filterBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 20,
    alignItems: "center",
  },
  filterBadgeActive: {
    backgroundColor: "rgba(43, 238, 91, 0.2)",
  },
  filterBadgeText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "700" as const,
  },
  filterBadgeTextActive: {
    color: Colors.primary,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  markAllText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "600" as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sectionContainer: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    marginTop: 8,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF4444",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  urgentBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#FF4444",
  },
  notificationCard: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    overflow: "hidden",
    marginBottom: 10,
  },
  notificationCardUnread: {
    borderColor: "rgba(43, 238, 91, 0.15)",
  },
  unreadIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  notificationContent: {
    padding: 14,
    paddingLeft: 16,
  },
  notificationTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  labelTimeRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: "800" as const,
    letterSpacing: 0.8,
  },
  timestamp: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "500" as const,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBody: {
    marginBottom: 6,
  },
  notificationTitle: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationMessage: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  relatedItemsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  relatedItemChip: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  relatedItemText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  relatedItemMore: {
    fontSize: 11,
    color: Colors.textMuted,
    alignSelf: "center",
  },
  actionButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  aiTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  aiTagText: {
    fontSize: 10,
    color: "#818cf8",
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.cardGlass,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
  emptyAIButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "#818cf8",
    borderRadius: 24,
  },
  emptyAIButtonText: {
    color: Colors.backgroundDark,
    fontSize: 15,
    fontWeight: "700" as const,
  },
  emptyScanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "rgba(43, 238, 91, 0.1)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(43, 238, 91, 0.25)",
  },
  emptyScanButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  aiLoadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "rgba(129, 140, 248, 0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.15)",
    marginTop: 4,
    marginBottom: 12,
  },
  aiLoadingText: {
    fontSize: 13,
    color: "#818cf8",
    fontWeight: "500" as const,
  },
  clearAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  clearAllText: {
    color: Colors.red,
    fontSize: 14,
    fontWeight: "500" as const,
  },
});
