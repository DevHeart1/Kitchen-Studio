import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Bell,
  ChefHat,
  Clock,
  AlertTriangle,
  Award,
  Lightbulb,
  Sparkles,
  Check,
  Trash2,
  Settings,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { notifications as mockNotifications } from "@/mocks/notifications";
import { Notification, NotificationType } from "@/types";

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "recipe_suggestion":
      return Sparkles;
    case "cooking_reminder":
      return Clock;
    case "ingredient_alert":
      return AlertTriangle;
    case "achievement":
      return Award;
    case "chef_update":
      return ChefHat;
    case "tip":
      return Lightbulb;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case "recipe_suggestion":
      return Colors.primary;
    case "cooking_reminder":
      return Colors.orange;
    case "ingredient_alert":
      return Colors.yellow;
    case "achievement":
      return "#a855f7";
    case "chef_update":
      return "#3b82f6";
    case "tip":
      return "#06b6d4";
    default:
      return Colors.primary;
  }
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
  onMarkRead: (id: string) => void;
}

function NotificationItem({ notification, onPress, onMarkRead }: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type);
  const accentColor = getNotificationColor(notification.type);

  return (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !notification.read && styles.notificationCardUnread,
      ]}
      activeOpacity={0.7}
      onPress={() => onPress(notification)}
    >
      {!notification.read && <View style={[styles.unreadIndicator, { backgroundColor: accentColor }]} />}
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: accentColor + "20" }]}>
            <Icon size={18} color={accentColor} />
          </View>
          <Text style={styles.timestamp}>{formatTimestamp(notification.timestamp)}</Text>
        </View>

        <View style={styles.notificationBody}>
          {notification.image && (
            <Image source={{ uri: notification.image }} style={styles.notificationImage} />
          )}
          <View style={[styles.textContainer, notification.image && styles.textContainerWithImage]}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
          </View>
        </View>

        {notification.actionLabel && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: accentColor + "15" }]}
            activeOpacity={0.7}
            onPress={() => onPress(notification)}
          >
            <Text style={[styles.actionButtonText, { color: accentColor }]}>
              {notification.actionLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length, 
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter(n => !n.read);
    }
    return notifications;
  }, [notifications, filter]);

  const handleNotificationPress = useCallback((notification: Notification) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
    );

    if (notification.actionRoute) {
      router.push({
        pathname: notification.actionRoute as any,
        params: notification.actionParams || {},
      });
    }
  }, [router]);

  const handleMarkRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const handleClearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
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
          style={styles.settingsButton}
          activeOpacity={0.7}
        >
          <Settings size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filter === "all" && styles.filterTabActive]}
            onPress={() => setFilter("all")}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, filter === "all" && styles.filterTabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === "unread" && styles.filterTabActive]}
            onPress={() => setFilter("unread")}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, filter === "unread" && styles.filterTabTextActive]}>
              Unread
            </Text>
            {unreadCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
          >
            <Check size={14} color={Colors.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
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
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Bell size={48} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === "unread" ? "All caught up!" : "No notifications yet"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === "unread"
                ? "You've read all your notifications"
                : "We'll notify you about recipes, tips, and updates"}
            </Text>
          </View>
        ) : (
          <>
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onPress={handleNotificationPress}
                onMarkRead={handleMarkRead}
              />
            ))}

            {notifications.length > 0 && (
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={handleClearAll}
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
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardGlass,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTabs: {
    flexDirection: "row",
    backgroundColor: Colors.cardGlass,
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: Colors.surfaceDark,
  },
  filterTabText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "500" as const,
  },
  filterTabTextActive: {
    color: Colors.white,
    fontWeight: "600" as const,
  },
  filterBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  filterBadgeText: {
    color: Colors.backgroundDark,
    fontSize: 11,
    fontWeight: "700" as const,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    paddingTop: 8,
    gap: 12,
  },
  notificationCard: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    overflow: "hidden",
  },
  notificationCardUnread: {
    backgroundColor: "rgba(43, 238, 91, 0.05)",
    borderColor: "rgba(43, 238, 91, 0.15)",
  },
  unreadIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  notificationContent: {
    padding: 16,
    paddingLeft: 20,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  timestamp: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "500" as const,
  },
  notificationBody: {
    flexDirection: "row",
    gap: 12,
  },
  notificationImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  textContainer: {
    flex: 1,
  },
  textContainerWithImage: {
    flex: 1,
  },
  notificationTitle: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  notificationMessage: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  actionButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
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
    maxWidth: 260,
    lineHeight: 20,
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
