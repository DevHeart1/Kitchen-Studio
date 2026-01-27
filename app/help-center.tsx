import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Search,
  ChevronRight,
  ChevronDown,
  Video,
  MessageCircle,
  Smartphone,
  Utensils,
  Package,
  Scan,
  HelpCircle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface TutorialItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  duration: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "1",
    question: "How do I scan a recipe from a video?",
    answer: "Open the app and tap the scan button in the center of the navigation bar. Point your camera at a cooking video or paste a video URL. Our AI will automatically extract the recipe ingredients and steps.",
    category: "Scanning",
  },
  {
    id: "2",
    question: "How does the AR cooking mode work?",
    answer: "After scanning a recipe, tap 'Start AR Cooking' to begin. The app will guide you through each step with visual overlays, timers, and voice instructions. You can use voice commands like 'next step' or 'repeat' to navigate.",
    category: "AR Cooking",
  },
  {
    id: "3",
    question: "How do I add items to my pantry?",
    answer: "Go to the Kitchen tab and tap on 'Inventory'. You can add items manually by tapping the '+' button, or scan your groceries using the camera. The app will track quantities and expiration dates.",
    category: "Pantry",
  },
  {
    id: "4",
    question: "What are chef levels and how do I level up?",
    answer: "Chef levels reflect your cooking progress. You earn XP by completing recipes, achieving high accuracy scores, and unlocking badges. Each level unlocks new titles from 'Kitchen Novice' to 'Legendary Chef'.",
    category: "Profile",
  },
  {
    id: "5",
    question: "How do I share my recipes with others?",
    answer: "After completing a cook, you'll have the option to share your recipe. You can also go to your profile and tap on any recipe to share it via social media or direct link.",
    category: "Sharing",
  },
  {
    id: "6",
    question: "Can I use the app offline?",
    answer: "Yes! Once you've saved a recipe, you can access it offline. However, scanning new recipes and AR features require an internet connection for optimal performance.",
    category: "General",
  },
];

const TUTORIALS: TutorialItem[] = [
  {
    id: "1",
    title: "Getting Started",
    description: "Learn the basics of the app",
    icon: Smartphone,
    duration: "3 min",
  },
  {
    id: "2",
    title: "Scanning Recipes",
    description: "Extract recipes from videos",
    icon: Scan,
    duration: "2 min",
  },
  {
    id: "3",
    title: "AR Cooking Guide",
    description: "Master the AR cooking mode",
    icon: Utensils,
    duration: "5 min",
  },
  {
    id: "4",
    title: "Managing Your Pantry",
    description: "Track ingredients efficiently",
    icon: Package,
    duration: "3 min",
  },
];

export default function HelpCenterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const filteredFAQs = FAQ_DATA.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFAQPress = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleTutorialPress = (tutorial: TutorialItem) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    console.log("Opening tutorial:", tutorial.title);
  };

  const handleContactSupport = () => {
    router.push("/contact-support");
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionCard} onPress={handleContactSupport}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + "20" }]}>
              <MessageCircle size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionTitle}>Contact Support</Text>
            <Text style={styles.quickActionSubtitle}>Get help from our team</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIcon, { backgroundColor: "#3b82f620" }]}>
              <Video size={24} color="#3b82f6" />
            </View>
            <Text style={styles.quickActionTitle}>Video Guides</Text>
            <Text style={styles.quickActionSubtitle}>Watch tutorials</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TUTORIALS</Text>
          {TUTORIALS.map((tutorial) => {
            const IconComponent = tutorial.icon;
            return (
              <TouchableOpacity
                key={tutorial.id}
                style={styles.tutorialCard}
                onPress={() => handleTutorialPress(tutorial)}
                activeOpacity={0.7}
              >
                <View style={styles.tutorialIcon}>
                  <IconComponent size={20} color={Colors.primary} />
                </View>
                <View style={styles.tutorialContent}>
                  <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                  <Text style={styles.tutorialDescription}>{tutorial.description}</Text>
                </View>
                <View style={styles.tutorialMeta}>
                  <Text style={styles.tutorialDuration}>{tutorial.duration}</Text>
                  <ChevronRight size={18} color={Colors.textMuted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
          {filteredFAQs.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={styles.faqCard}
              onPress={() => handleFAQPress(faq.id)}
              activeOpacity={0.8}
            >
              <View style={styles.faqHeader}>
                <View style={styles.faqQuestion}>
                  <HelpCircle size={18} color={Colors.primary} />
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                </View>
                {expandedFAQ === faq.id ? (
                  <ChevronDown size={20} color={Colors.primary} />
                ) : (
                  <ChevronRight size={20} color={Colors.textMuted} />
                )}
              </View>
              {expandedFAQ === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  <View style={styles.faqCategory}>
                    <Text style={styles.faqCategoryText}>{faq.category}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {filteredFAQs.length === 0 && searchQuery && (
          <View style={styles.noResults}>
            <HelpCircle size={48} color={Colors.textMuted} />
            <Text style={styles.noResultsText}>No results found</Text>
            <Text style={styles.noResultsSubtext}>
              Try different keywords or contact support
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.contactCard} onPress={handleContactSupport}>
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Still need help?</Text>
            <Text style={styles.contactSubtitle}>
              Our support team is ready to assist you
            </Text>
          </View>
          <View style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Contact Us</Text>
          </View>
        </TouchableOpacity>
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
    paddingBottom: 12,
    backgroundColor: "rgba(16, 34, 21, 0.5)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardGlass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    marginBottom: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.white,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.white,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  tutorialCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  tutorialIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  tutorialContent: {
    flex: 1,
    marginLeft: 12,
  },
  tutorialTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  tutorialDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tutorialMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tutorialDuration: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  faqCard: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqQuestion: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  faqAnswer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cardGlassBorder,
  },
  faqAnswerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  faqCategory: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  faqCategoryText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  noResults: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.white,
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  contactCard: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    marginTop: 8,
  },
  contactContent: {
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  contactButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
});
