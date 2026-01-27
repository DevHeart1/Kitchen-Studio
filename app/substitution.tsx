import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Info,
  X,
  ShoppingCart,
} from "lucide-react-native";
import Colors from "@/constants/colors";

interface Substitute {
  id: string;
  name: string;
  ratio: string;
  matchPercent: number;
  image: string;
  explanation: string;
}

const substitutesData: Record<string, { ingredient: { name: string; amount: string; image: string }; substitutes: Substitute[] }> = {
  "3": {
    ingredient: {
      name: "Kosher Salt",
      amount: "1 tsp",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFWdfhVmHNyvkuecLVPnjD8di1NBUCgXaA-UhHv4zk6Nxe8SKYPzL2yzaQiC0bdl_Q5RwisCbFyufK-64zyy0Fox8hsSoGTeeNcGznltPl2ERVaKppby2N38TUOYROOLvY2E5-qOqOJ1NFdKwJ-djhGtDKZrF62oAvd3ug4kBnsWFq5YphCZ3auWCYyqQrse3iuJ4cCgQFf8pL3g0vN6jMh1fMtNtkMezF5yZvtaix5neJLw3jI6EFNh7LikaPx4LQmwt5NcfUtQ",
    },
    substitutes: [
      {
        id: "1",
        name: "Table Salt",
        ratio: "Use 3/4 tsp",
        matchPercent: 95,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBA-7sCtfjffeCbyNeMwxGx0ZAwPeGwFGrM3RfQtcU-2AZ9Vk6mleSdAYDLzy5Ow6sT31SJbvBvJQwIbcmYi2s9dKyp9fMcvnm13h_1Drc5CMYo9EjX6gCQK6U7nthgiA4oLqh1kad8_TgtELWCvGz6L5Gr5KAHLh7y_hIQbqOyrtVB2QFqTM0l_Mih6P2wMFDqM5yCyGV8pljXtNn_E5hSz57MWjKZCAGYd7vS4HXs_zR8i7YzfK7pPj0ZdcsSalaY2Q-yCdhxow",
        explanation: "Table salt has smaller crystals than kosher salt, meaning more fits into a teaspoon. Reducing the volume by 25% maintains the same salinity level.",
      },
      {
        id: "2",
        name: "Sea Salt",
        ratio: "Use 1:1 ratio",
        matchPercent: 90,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFWdfhVmHNyvkuecLVPnjD8di1NBUCgXaA-UhHv4zk6Nxe8SKYPzL2yzaQiC0bdl_Q5RwisCbFyufK-64zyy0Fox8hsSoGTeeNcGznltPl2ERVaKppby2N38TUOYROOLvY2E5-qOqOJ1NFdKwJ-djhGtDKZrF62oAvd3ug4kBnsWFq5YphCZ3auWCYyqQrse3iuJ4cCgQFf8pL3g0vN6jMh1fMtNtkMezF5yZvtaix5neJLw3jI6EFNh7LikaPx4LQmwt5NcfUtQ",
        explanation: "Fine sea salt and kosher salt share similar salinity profiles per gram. A direct 1:1 volume swap works well for most pan-seared recipes.",
      },
    ],
  },
  "7": {
    ingredient: {
      name: "Fresh Parsley",
      amount: "2 tbsp, chopped",
      image: "https://images.unsplash.com/photo-1599438099655-1e40f359ca1d?w=200",
    },
    substitutes: [
      {
        id: "1",
        name: "Dried Parsley",
        ratio: "Use 1 tsp",
        matchPercent: 85,
        image: "https://images.unsplash.com/photo-1599438099655-1e40f359ca1d?w=200",
        explanation: "Dried herbs are more concentrated than fresh. Use 1/3 of the fresh amount. Best added earlier in cooking to rehydrate and release flavor.",
      },
      {
        id: "2",
        name: "Fresh Cilantro",
        ratio: "Use 2 tbsp",
        matchPercent: 75,
        image: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=200",
        explanation: "Cilantro provides a similar fresh, herbaceous quality with a slightly different flavor profile. Great for adding brightness to the dish.",
      },
      {
        id: "3",
        name: "Fresh Chives",
        ratio: "Use 2 tbsp",
        matchPercent: 70,
        image: "https://images.unsplash.com/photo-1591261729853-b086e4082b36?w=200",
        explanation: "Chives offer a mild onion flavor that complements fish dishes well. Use as a garnish for color and subtle flavor.",
      },
    ],
  },
};

export default function SubstitutionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const data = substitutesData[id || "3"] || substitutesData["3"];
  const { ingredient, substitutes } = data;

  const handleSelectSubstitute = (substitute: Substitute) => {
    console.log("Selected substitute:", substitute.name);
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          testID="back-button"
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ingredient Substitution</Text>
        <TouchableOpacity style={styles.headerButton} testID="info-button">
          <Info size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 180 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.missingItemCard}>
          <View style={styles.missingItemContent}>
            <View style={styles.missingImageContainer}>
              <Image
                source={{ uri: ingredient.image }}
                style={styles.missingImage}
              />
              <View style={styles.missingOverlay}>
                <X size={20} color="rgba(255, 255, 255, 0.7)" />
              </View>
            </View>
            <View style={styles.missingInfo}>
              <View style={styles.missingBadge}>
                <Text style={styles.missingBadgeText}>MISSING ITEM</Text>
              </View>
              <Text style={styles.missingName}>{ingredient.name}</Text>
              <Text style={styles.missingAmount}>Required: {ingredient.amount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.substitutesHeader}>
          <Text style={styles.substitutesTitle}>AI Recommended Substitutes</Text>
          <Text style={styles.optionsCount}>{substitutes.length} OPTIONS FOUND</Text>
        </View>

        <View style={styles.substitutesList}>
          {substitutes.map((substitute, index) => (
            <View
              key={substitute.id}
              style={[
                styles.substituteCard,
                index === 0 && styles.primarySubstituteCard,
              ]}
            >
              <View style={styles.matchBadge}>
                <Text
                  style={[
                    styles.matchBadgeText,
                    index === 0 && styles.primaryMatchText,
                  ]}
                >
                  {substitute.matchPercent}% Match
                </Text>
              </View>

              <View style={styles.substituteContent}>
                <Image
                  source={{ uri: substitute.image }}
                  style={styles.substituteImage}
                />
                <View style={styles.substituteInfo}>
                  <Text style={styles.substituteName}>{substitute.name}</Text>
                  <Text style={styles.substituteRatio}>{substitute.ratio}</Text>
                </View>
              </View>

              <View style={styles.explanationBox}>
                <Text style={styles.explanationText}>
                  <Text style={styles.explanationLabel}>Why this works: </Text>
                  {substitute.explanation}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.selectButton,
                  index === 0 && styles.primarySelectButton,
                ]}
                onPress={() => handleSelectSubstitute(substitute)}
                activeOpacity={0.8}
                testID={`select-substitute-${substitute.id}`}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    index === 0 && styles.primarySelectButtonText,
                  ]}
                >
                  Select Substitute
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.storeButton}
          activeOpacity={0.8}
          testID="find-in-store-button"
        >
          <ShoppingCart size={20} color={Colors.white} />
          <Text style={styles.storeButtonText}>Find in Store</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="keep-looking-button">
          <Text style={styles.alternativesLink}>Keep looking for alternatives</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "rgba(16, 34, 21, 0.8)",
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  missingItemCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.2)",
  },
  missingItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  missingImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  missingImage: {
    width: "100%",
    height: "100%",
    opacity: 0.5,
  },
  missingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  missingInfo: {
    flex: 1,
  },
  missingBadge: {
    backgroundColor: "rgba(234, 179, 8, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  missingBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#EAB308",
    letterSpacing: 0.5,
  },
  missingName: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 4,
  },
  missingAmount: {
    fontSize: 14,
    color: "#92c9a0",
  },
  substitutesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 16,
  },
  substitutesTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  optionsCount: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  substitutesList: {
    gap: 16,
  },
  substituteCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    position: "relative",
  },
  primarySubstituteCard: {
    borderColor: "rgba(43, 238, 91, 0.2)",
  },
  matchBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "rgba(255, 255, 255, 0.6)",
  },
  primaryMatchText: {
    color: Colors.primary,
  },
  substituteContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  substituteImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  substituteInfo: {
    flex: 1,
  },
  substituteName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 4,
  },
  substituteRatio: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  explanationBox: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  explanationText: {
    fontSize: 12,
    color: "#92c9a0",
    lineHeight: 18,
  },
  explanationLabel: {
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  selectButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primarySelectButton: {
    backgroundColor: Colors.primary,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  primarySelectButtonText: {
    color: Colors.backgroundDark,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
    alignItems: "center",
    backgroundColor: Colors.backgroundDark,
  },
  storeButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 18,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  storeButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  alternativesLink: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#92c9a0",
    paddingVertical: 8,
  },
});
