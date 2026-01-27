import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Utensils, Bell } from "lucide-react-native";
import Colors from "@/constants/colors";

import { notifications } from "@/mocks/notifications";

export default function Header() {
  const router = useRouter();
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <View style={styles.logoIcon}>
          <Utensils size={20} color={Colors.backgroundDark} />
        </View>
        <Text style={styles.title}>Kitchen Studio</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => router.push("/notifications")}
          activeOpacity={0.7}
        >
          <Bell size={20} color={Colors.white} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: Colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.backgroundDark,
  },
  notificationBadgeText: {
    color: Colors.backgroundDark,
    fontSize: 10,
    fontWeight: "700" as const,
  },

});
