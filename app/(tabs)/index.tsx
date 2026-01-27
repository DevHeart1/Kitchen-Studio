import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import LinkInput from "@/components/LinkInput";
import SessionCard from "@/components/SessionCard";
import RecentCookCard from "@/components/RecentCookCard";
import { featuredSessions, recentCooks } from "@/mocks/sessions";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const handleConvert = (url: string) => {
    console.log("Converting URL:", url);
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
          <Text style={styles.headline}>
            Transform any video into a{" "}
            <Text style={styles.headlineAccent}>kitchen guide</Text>
          </Text>
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
          <Text style={styles.sectionTitle}>Recent Cooks</Text>
          <View style={styles.recentList}>
            {recentCooks.map((cook) => (
              <RecentCookCard
                key={cook.id}
                cook={cook}
                onPress={() => console.log("Cook pressed:", cook.id)}
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
    marginTop: 16,
    gap: 12,
  },
});
