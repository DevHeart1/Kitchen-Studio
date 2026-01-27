import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Utensils, Bell } from "lucide-react-native";
import Colors from "@/constants/colors";
import { userProfile } from "@/mocks/sessions";

export default function Header() {
  return (
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <View style={styles.logoIcon}>
          <Utensils size={20} color={Colors.backgroundDark} />
        </View>
        <Text style={styles.title}>Kitchen Studio</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell size={20} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.avatarButton}>
          <Image source={{ uri: userProfile.avatar }} style={styles.avatar} />
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
  avatarButton: {
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
});
