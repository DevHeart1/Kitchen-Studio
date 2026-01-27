import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Play, RefreshCw } from "lucide-react-native";
import Colors from "@/constants/colors";
import { RecentCook } from "@/types";

interface RecentCookCardProps {
  cook: RecentCook;
  onPress?: () => void;
}

export default function RecentCookCard({ cook, onPress }: RecentCookCardProps) {
  const isCompleted = cook.progress === 100;

  return (
    <TouchableOpacity
      style={[styles.container, isCompleted && styles.containerCompleted]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image source={{ uri: cook.image }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {cook.title}
        </Text>

        {isCompleted ? (
          <Text style={styles.completedText}>{cook.completedDate}</Text>
        ) : (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${cook.progress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{cook.progress}% done</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.actionButton,
          isCompleted && styles.actionButtonCompleted,
        ]}
      >
        {isCompleted ? (
          <RefreshCw size={20} color={Colors.textMuted} />
        ) : (
          <Play size={20} color={Colors.primary} fill={Colors.primary} />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    gap: 12,
  },
  containerCompleted: {
    opacity: 0.8,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700" as const,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
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
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  completedText: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600" as const,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonCompleted: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
