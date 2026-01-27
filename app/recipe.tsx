import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Share2,
  CheckCircle,
  Play,
  Box,
  Info,
} from "lucide-react-native";
import Colors from "@/constants/colors";

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  image: string;
  status: "in_pantry" | "substitute" | "missing";
  substituteSuggestion?: string;
}

const ingredients: Ingredient[] = [
  {
    id: "1",
    name: "Extra Virgin Olive Oil",
    amount: "2 tbsp",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBA-7sCtfjffeCbyNeMwxGx0ZAwPeGwFGrM3RfQtcU-2AZ9Vk6mleSdAYDLzy5Ow6sT31SJbvBvJQwIbcmYi2s9dKyp9fMcvnm13h_1Drc5CMYo9EjX6gCQK6U7nthgiA4oLqh1kad8_TgtELWCvGz6L5Gr5KAHLh7y_hIQbqOyrtVB2QFqTM0l_Mih6P2wMFDqM5yCyGV8pljXtNn_E5hSz57MWjKZCAGYd7vS4HXs_zR8i7YzfK7pPj0ZdcsSalaY2Q-yCdhxow",
    status: "in_pantry",
  },
  {
    id: "2",
    name: "Salmon Fillets",
    amount: "2 large pieces",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuARg6uLtked95kTG0C5p5SRtNryHxrdaIGcD1hMIRwlCp2H0Xnt9NIZnbi01naMTFFqqzLxaf97lrt4L4QA-pQA6EXeU4etHmHrYKHgF16LkIENW2mramX5I8INSM_6hI81K7DAmysd4xv2NbQGtqZuLs2L6rNYSE3qvr6MaXqHHVIqAEcPvRDDdpTrF6qHyQe8fBtD409m2x9mwyvuz_w7ivtFS5Abn1DcDGnfASmo3lYm7u62cXCvbvAoDxgvTtTiM3DFdZrZmQ",
    status: "in_pantry",
  },
  {
    id: "3",
    name: "Kosher Salt",
    amount: "1 tsp",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFWdfhVmHNyvkuecLVPnjD8di1NBUCgXaA-UhHv4zk6Nxe8SKYPzL2yzaQiC0bdl_Q5RwisCbFyufK-64zyy0Fox8hsSoGTeeNcGznltPl2ERVaKppby2N38TUOYROOLvY2E5-qOqOJ1NFdKwJ-djhGtDKZrF62oAvd3ug4kBnsWFq5YphCZ3auWCYyqQrse3iuJ4cCgQFf8pL3g0vN6jMh1fMtNtkMezF5yZvtaix5neJLw3jI6EFNh7LikaPx4LQmwt5NcfUtQ",
    status: "substitute",
    substituteSuggestion: "Use Table Salt (3/4 tsp)",
  },
  {
    id: "4",
    name: "Fresh Garlic",
    amount: "4 cloves, minced",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDI2f3PaNs2pX7MthcwlQW9PE5bM9Rz8wvXaEmVQvfHHDlKbiText-bJ5YBxIkXLjUW5PTm6ceYLESQdLcEAx3_6SzarUqcCmyoGgjwxLXhpf_5TRqFgRfZXAuWwrqZhEzZ8JE9spU63HbLyCCGR3vrGhuf5_qldjzOQ-pVOHgcRIN1gEgSI5s07sgP9FkJDXHskw8kEJOl3Fa-LmTPV6qnpwgK_Nd1KOLGwnJ8DwYSod9fPzTPQon-nDQh1nVcB-hhWAOn_CH1vg",
    status: "in_pantry",
  },
  {
    id: "5",
    name: "Unsalted Butter",
    amount: "3 tbsp",
    image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=200",
    status: "in_pantry",
  },
  {
    id: "6",
    name: "Fresh Lemon",
    amount: "1 whole",
    image: "https://images.unsplash.com/photo-1582087463261-ddea03f80f5d?w=200",
    status: "in_pantry",
  },
  {
    id: "7",
    name: "Fresh Parsley",
    amount: "2 tbsp, chopped",
    image: "https://images.unsplash.com/photo-1599438099655-1e40f359ca1d?w=200",
    status: "missing",
    substituteSuggestion: "Use Dried Parsley (1 tsp) or Fresh Cilantro",
  },
];

export default function RecipeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const readyCount = ingredients.filter((i) => i.status === "in_pantry").length;
  const totalCount = ingredients.length;
  const readinessPercent = Math.round((readyCount / totalCount) * 100);

  const getStatusColor = (status: Ingredient["status"]) => {
    switch (status) {
      case "in_pantry":
        return Colors.primary;
      case "substitute":
        return "#EAB308";
      case "missing":
        return "#EF4444";
    }
  };

  const getStatusText = (status: Ingredient["status"]) => {
    switch (status) {
      case "in_pantry":
        return "IN PANTRY";
      case "substitute":
        return "SUBSTITUTE";
      case "missing":
        return "MISSING";
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe & Pantry Check</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Share2 size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.videoCard}>
          <View style={styles.videoThumbnail}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBl4IEulb0Sr42Sz0eGt_Pe88SfKEOFNBpkVh0KzP_BHswiHkNKGGJmt0vLDWxJdJj4_sT1sgnjt8yEltOIDsfAXvq37k6XCMTG28E2dU8AE8WVy0MUJemFr2KrddIqaEaxjpXKgW54ddhMI7b8hsZz9agaS5Jg5ym47lTXSaxUgAOW_1Bzwq72MsMA4dzJvx6BIG5Mn_r1euv6KhMu9HWUO_KqGqyn7K2jLLdIn5lQys0a3IMZ9uBZ_3cXR_izKH2LtZKAVEk55g",
              }}
              style={styles.thumbnailImage}
            />
            <View style={styles.playOverlay}>
              <Play size={20} color={Colors.white} fill={Colors.white} />
            </View>
          </View>
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle} numberOfLines={1}>
              Garlic Butter Pan-Seared Salmon
            </Text>
            <Text style={styles.videoMeta}>8:42 min • Extracted via AI</Text>
          </View>
        </View>

        <View style={styles.readinessSection}>
          <View style={styles.readinessHeader}>
            <Text style={styles.readinessLabel}>Pantry Readiness</Text>
            <Text style={styles.readinessPercent}>{readinessPercent}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${readinessPercent}%` }]}
            />
          </View>
          <View style={styles.readinessStatus}>
            <CheckCircle size={14} color={Colors.primary} />
            <Text style={styles.readinessText}>
              {readyCount}/{totalCount} ingredients ready
            </Text>
          </View>
        </View>

        <View style={styles.ingredientsHeader}>
          <Text style={styles.ingredientsTitle}>Extracted Ingredients</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI Verified</Text>
          </View>
        </View>

        <View style={styles.ingredientsList}>
          {ingredients.map((ingredient) => {
            const isClickable = ingredient.status === "substitute" || ingredient.status === "missing";
            const CardWrapper = isClickable ? TouchableOpacity : View;
            const cardProps = isClickable ? {
              onPress: () => router.push(`/substitution?id=${ingredient.id}`),
              activeOpacity: 0.7,
              testID: `ingredient-${ingredient.id}`,
            } : {};

            return (
              <CardWrapper
                key={ingredient.id}
                style={[
                  styles.ingredientCard,
                  ingredient.status === "substitute" && styles.substituteCard,
                  ingredient.status === "missing" && styles.missingCard,
                ]}
                {...cardProps}
              >
                <View style={styles.ingredientMain}>
                  <View style={styles.ingredientLeft}>
                    <Image
                      source={{ uri: ingredient.image }}
                      style={[
                        styles.ingredientImage,
                        ingredient.status !== "in_pantry" &&
                          styles.ingredientImageFaded,
                      ]}
                    />
                    <View style={styles.ingredientInfo}>
                      <Text style={styles.ingredientName}>{ingredient.name}</Text>
                      <Text style={styles.ingredientAmount}>
                        {ingredient.amount}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ingredientRight}>
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(ingredient.status) },
                      ]}
                    >
                      {getStatusText(ingredient.status)}
                    </Text>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: `${getStatusColor(ingredient.status)}33`,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDotInner,
                          { backgroundColor: getStatusColor(ingredient.status) },
                        ]}
                      />
                    </View>
                  </View>
                </View>
                {ingredient.substituteSuggestion && (
                  <View
                    style={[
                      styles.suggestionBox,
                      {
                        backgroundColor: `${getStatusColor(ingredient.status)}15`,
                        borderColor: `${getStatusColor(ingredient.status)}20`,
                      },
                    ]}
                  >
                    <Info size={14} color={getStatusColor(ingredient.status)} />
                    <Text
                      style={[
                        styles.suggestionText,
                        { color: getStatusColor(ingredient.status) },
                      ]}
                    >
                      AI suggests: {ingredient.substituteSuggestion}
                    </Text>
                  </View>
                )}
              </CardWrapper>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() => router.push("/ar-cooking")}
          testID="start-ar-cooking-button"
        >
          <Box size={20} color={Colors.backgroundDark} />
          <Text style={styles.primaryButtonText}>Start AR Cooking</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.editLink}>Edit Ingredients List</Text>
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
    paddingTop: 8,
  },
  videoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
  },
  videoThumbnail: {
    width: 96,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 4,
  },
  videoMeta: {
    fontSize: 12,
    color: "#92c9a0",
  },
  readinessSection: {
    marginTop: 20,
    gap: 12,
  },
  readinessHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  readinessLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  readinessPercent: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  progressBar: {
    height: 12,
    backgroundColor: "#32673f",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  readinessStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  readinessText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#92c9a0",
  },
  ingredientsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 16,
  },
  ingredientsTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  aiBadge: {
    backgroundColor: "rgba(43, 238, 91, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  substituteCard: {
    borderColor: "rgba(234, 179, 8, 0.3)",
  },
  missingCard: {
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  ingredientMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ingredientLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  ingredientImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  ingredientImageFaded: {
    opacity: 0.5,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 2,
  },
  ingredientAmount: {
    fontSize: 13,
    color: "#92c9a0",
  },
  ingredientRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  suggestionBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
    alignItems: "center",
    backgroundColor: Colors.backgroundDark,
  },
  primaryButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 9999,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  editLink: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#92c9a0",
  },
});
