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
import {
  ArrowLeft,
  Shield,
  Eye,
  Database,
  Share2,
  Lock,
  FileText,
  Clock,
} from "lucide-react-native";
import Colors from "@/constants/colors";

interface PolicySection {
  id: string;
  title: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  content: string[];
}

const POLICY_SECTIONS: PolicySection[] = [
  {
    id: "collection",
    title: "Information We Collect",
    icon: Database,
    content: [
      "Account information (name, email, profile picture)",
      "Recipe data and cooking history",
      "Pantry inventory information",
      "Usage data and app interactions",
      "Device information for app optimization",
      "AR session data for improving cooking guidance",
    ],
  },
  {
    id: "usage",
    title: "How We Use Your Information",
    icon: Eye,
    content: [
      "To provide personalized recipe recommendations",
      "To track your cooking progress and achievements",
      "To improve AR cooking guidance accuracy",
      "To send relevant notifications (with your consent)",
      "To analyze app performance and fix issues",
      "To develop new features based on user needs",
    ],
  },
  {
    id: "sharing",
    title: "Information Sharing",
    icon: Share2,
    content: [
      "We do not sell your personal information",
      "Shared recipes are visible to other users (opt-in)",
      "Service providers help us operate the app securely",
      "We may share data when required by law",
      "Anonymized data may be used for research",
    ],
  },
  {
    id: "security",
    title: "Data Security",
    icon: Lock,
    content: [
      "Industry-standard encryption for data in transit",
      "Secure cloud storage with access controls",
      "Regular security audits and updates",
      "Two-factor authentication available",
      "Automatic session timeouts for protection",
    ],
  },
  {
    id: "rights",
    title: "Your Rights",
    icon: Shield,
    content: [
      "Access and download your personal data",
      "Request correction of inaccurate information",
      "Delete your account and associated data",
      "Opt-out of marketing communications",
      "Control data sharing preferences",
      "Export your recipes and cooking history",
    ],
  },
  {
    id: "retention",
    title: "Data Retention",
    icon: Clock,
    content: [
      "Account data kept while account is active",
      "Cooking history retained for 2 years",
      "Deleted accounts purged within 30 days",
      "Anonymized analytics kept for improvement",
      "Backup data removed within 90 days of deletion",
    ],
  },
];

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <FileText size={28} color={Colors.primary} />
          </View>
          <Text style={styles.introTitle}>Your Privacy Matters</Text>
          <Text style={styles.introText}>
            We are committed to protecting your privacy and being transparent about how we handle your data. This policy explains what information we collect and how we use it.
          </Text>
          <Text style={styles.lastUpdated}>Last updated: January 15, 2026</Text>
        </View>

        {POLICY_SECTIONS.map((section) => {
          const IconComponent = section.icon;
          return (
            <View key={section.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <IconComponent size={20} color={Colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <View style={styles.sectionContent}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Questions About Privacy?</Text>
          <Text style={styles.contactText}>
            If you have any questions or concerns about our privacy practices, please contact our Data Protection Officer at privacy@chefapp.com
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using ChefApp, you agree to this Privacy Policy. We may update this policy periodically, and we will notify you of significant changes.
          </Text>
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
  introCard: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    marginBottom: 24,
  },
  introIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 12,
  },
  introText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  lastUpdated: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 16,
  },
  section: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  sectionContent: {
    gap: 10,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: Colors.primary + "15",
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.cardGlassBorder,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});
