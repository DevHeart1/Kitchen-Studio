import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Box } from "lucide-react-native";
import Colors from "@/constants/colors";
import { Session } from "@/types";

const CARD_WIDTH = Dimensions.get("window").width * 0.65;
const CARD_HEIGHT = 320;

interface SessionCardProps {
  session: Session;
  onPress?: () => void;
}

export default function SessionCard({ session, onPress }: SessionCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: session.image }} style={styles.image} />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.gradient}
        />

        <View style={styles.arBadge}>
          <Box size={10} color={Colors.backgroundDark} />
          <Text style={styles.arText}>AR READY</Text>
        </View>

        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{session.price}</Text>
        </View>

        <View style={styles.chefInfo}>
          <Image source={{ uri: session.chefAvatar }} style={styles.chefAvatar} />
          <Text style={styles.chefName}>{session.chefName}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {session.title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginRight: 16,
  },
  imageContainer: {
    width: "100%",
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  arBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: Colors.primary + "E6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  arText: {
    color: Colors.backgroundDark,
    fontSize: 9,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  priceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  priceText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "700" as const,
  },
  chefInfo: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chefAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  chefName: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "500" as const,
  },
  title: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700" as const,
    paddingHorizontal: 4,
  },
});
