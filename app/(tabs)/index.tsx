import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import LinkInput from "@/components/LinkInput";
import SessionCard from "@/components/SessionCard";
import RecentCookCard from "@/components/RecentCookCard";
import { featuredSessions, recentCooks } from "@/mocks/sessions";
import { RecentCook } from "@/types";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, isLoading } = useUserProfile();

  const handleConvert = (url: string) => {
    console.log("Converting URL:", url);
  };

  const handleViewAllRecentCooks = () => {
    router.push("/recent-cooks");
  };

  const handleCookPress = (cook: RecentCook) => {
    router.push({
      pathname: "/cook-session",
      params: { id: cook.id },
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getGoalMessage = () => {
    if (!profile.primaryGoal) return "What would you like to make?";

    switch (profile.primaryGoal) {
      case "eat-healthy":
        return "Focusing on nutritious meals today.";
      case "save-money":
        return "Budget-friendly recipes selected for you.";
      case "learn-new":
        return "Explore new techniques and flavors.";
      default:
        return "What would you like to make?";
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Header />

        <View style={styles.headlineSection}>
          <Text style={styles.greeting}>
            {getGreeting()}, <Text style={styles.nameAccent}>{profile.name.split(' ')[0]}</Text>
          </Text>
          <Text style={styles.userTitle}>{profile.title}</Text>
          <Text style={styles.headline}>
            Ready to cook something <Text style={styles.headlineAccent}>delicious?</Text>
          </Text>
          <Text style={styles.goalMessage}>{getGoalMessage()}</Text>
        </View>

        <LinkInput onConvert={handleConvert} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Sessions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sessionsContainer}
        >
          {featuredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onPress={() => console.log("Session pressed:", session.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Cooks</Text>
            <TouchableOpacity onPress={handleViewAllRecentCooks}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recentList}>
            {recentCooks.slice(0, 2).map((cook) => (
              <RecentCookCard
                key={cook.id}
                cook={cook}
                onPress={() => handleCookPress(cook)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headlineSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
    fontWeight: "500",
  },
  nameAccent: {
    color: Colors.white,
    fontWeight: "700",
  },
  userTitle: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  headline: {
    fontSize: 30,
    fontWeight: "700" as const,
    color: Colors.white,
    lineHeight: 38,
    letterSpacing: -0.5,
    maxWidth: "90%",
  },
  headlineAccent: {
    color: Colors.primary,
  },
  goalMessage: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  sessionsContainer: {
    paddingHorizontal: 16,
  },
  recentSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  recentList: {
    marginTop: 12,
    gap: 12,
  },
});
