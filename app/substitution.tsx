import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Info,
  X,
  ShoppingCart,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useShoppingList } from "@/contexts/ShoppingListContext";

// const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY; // Managed on server now

interface Substitute {
  id: string;
  name: string;
  ratio: string;
  matchPercent: number;
  image: string;
  explanation: string;
}

// Removed hardcoded substitutesData

export default function SubstitutionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, name, amount, image } = useLocalSearchParams<{
    id: string;
    name: string;
    amount: string;
    image: string;
  }>();

  const { addItem } = useShoppingList();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [substitutes, setSubstitutes] = React.useState<Substitute[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [noMoreAlternatives, setNoMoreAlternatives] = React.useState(false);

  React.useEffect(() => {
    if (name) {
      fetchSubstitutions();
    }
  }, [name]);

  const fetchSubstitutions = async (isLoadMore = false) => {
    if (isLoadMore) setIsLoadingMore(true);
    else setIsLoading(true);

    setError(null);

    // AI service availability is now handled by the edge function request
    // if (!GEMINI_API_KEY) check removed

    try {
      if (isLoadMore) {
        console.log("Loading more substitutes for:", name);
      } else {
        console.log("Fetching substitutes for:", name);
      }

      const { data, error } = await supabase.functions.invoke('get-ingredient-substitutes', {
        body: {
          name,
          amount,
          existingSubstitutes: isLoadMore ? substitutes : []
        }
      });

      if (error) {
        console.error("Substitutes Edge Function Error:", error);
        throw error;
      }

      if (!data || !data.substitutes) {
        console.error("No data returned from Edge Function");
        throw new Error("No substitutes found");
      }

      const parsed = data.substitutes;

      if (parsed.length === 0 && isLoadMore) {
        setNoMoreAlternatives(true);
      }

      const mapped = parsed.map((s: any) => ({
        ...s,
        id: s.id || `sub-${Date.now()}-${Math.random()}`,
        image: s.unsplashPhotoId
          ? `https://images.unsplash.com/${s.unsplashPhotoId}?auto=format&fit=crop&w=200&q=80`
          : "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=200&q=80"
      }));

      if (isLoadMore) {
        setSubstitutes(prev => [...prev, ...mapped]);
        if (mapped.length === 0) setNoMoreAlternatives(true);
      } else {
        setSubstitutes(mapped);
      }
    } catch (err) {
      console.error("Substitution fetch error:", err);
      setError("Failed to load substitutions");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleSelectSubstitute = (substitute: Substitute) => {
    router.navigate({
      pathname: "/recipe",
      params: {
        substitutedId: id,
        newName: substitute.name,
        newAmount: substitute.ratio.replace(/Use /g, ""),
        newImage: substitute.image
      }
    });
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
          { paddingBottom: insets.bottom + 220 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.missingItemCard}>
          <View style={styles.missingItemContent}>
            <View style={styles.missingImageContainer}>
              <Image
                source={{ uri: image || "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=200&q=80" }}
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
              <Text style={styles.missingName}>{name}</Text>
              <Text style={styles.missingAmount}>Required: {amount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.substitutesHeader}>
          <Text style={styles.substitutesTitle}>AI Recommended Substitutes</Text>
          {!isLoading && <Text style={styles.optionsCount}>{substitutes.length} OPTIONS FOUND</Text>}
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>AI is finding substitutions for {name}...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchSubstitutions()} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.substitutesList}>
            {substitutes.map((substitute, index) => (
              <View
                key={`${substitute.id}-${index}`}
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
        )}

        {isLoadingMore && (
          <View style={[styles.loadingState, { padding: 20 }]}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Finding more options...</Text>
          </View>
        )}

        {noMoreAlternatives && !isLoadingMore && (
          <View style={[styles.loadingState, { padding: 20 }]}>
            <Text style={styles.loadingText}>No more unique alternatives found.</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <LinearGradient
          colors={['transparent', Colors.backgroundDark]}
          style={styles.footerGradient}
        />
        <TouchableOpacity
          style={styles.storeButton}
          activeOpacity={0.8}
          testID="find-in-store-button"
          onPress={async () => {
            await addItem({
              name: name,
              amount: amount,
              image: image,
              category: "Missing Ingredient",
            });
            router.push("/shopping-list");
          }}
        >
          <ShoppingCart size={20} color={Colors.white} />
          <Text style={styles.storeButtonText}>Add to Shopping List</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="keep-looking-button"
          onPress={() => fetchSubstitutions(true)}
          disabled={isLoadingMore || noMoreAlternatives}
        >
          <Text style={[styles.alternativesLink, (isLoadingMore || noMoreAlternatives) && { opacity: 0.5 }]}>
            {noMoreAlternatives ? "No more alternatives" : "Keep looking for alternatives"}
          </Text>
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
    paddingTop: 32,
    gap: 12,
    alignItems: "center",
  },
  footerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "transparent",
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
  loadingState: {
    padding: 40,
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#92c9a0",
    textAlign: "center",
  },
  errorState: {
    padding: 40,
    alignItems: "center",
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.white,
  },
});
