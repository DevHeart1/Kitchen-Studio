import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Shield,
  Eye,
  Database,
  Download,
  Trash2,
  Bell,
  Mail,
  BarChart3,
  Share2,
  ChevronRight,
  Lock,
  Smartphone,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function PrivacySecurityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, updateSettings } = useUserProfile();

  const settings = profile.settings;

  const handleToggle = (key: keyof typeof settings) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    updateSettings({ [key]: !settings[key] });
  };

  const handleDownloadData = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert(
      "Download Data",
      "We'll prepare a copy of your data and send it to your email within 24 hours.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request Download",
          onPress: () => {
            console.log("Data download requested");
            Alert.alert("Request Sent", "You'll receive your data via email soon.");
          },
        },
      ]
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete all your data including recipes, cooking history, and achievements. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Deletion",
              "Are you absolutely sure? Type DELETE to confirm.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: () => console.log("Data deletion confirmed"),
                },
              ]
            );
          },
        },
      ]
    );
  };

  const renderToggleRow = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    value: boolean,
    onToggle: () => void
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#3e3e3e", true: Colors.primary + "60" }}
        thumbColor={value ? Colors.primary : "#f4f3f4"}
      />
    </View>
  );

  const renderActionRow = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    onPress: () => void,
    danger = false
  ) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
          {title}
        </Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color={danger ? "#ef4444" : Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Shield size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Your Data is Protected</Text>
            <Text style={styles.infoText}>
              We use industry-standard encryption to keep your information safe.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          {renderToggleRow(
            <Bell size={20} color={Colors.primary} />,
            "Push Notifications",
            "Receive alerts on your device",
            settings.pushNotifications,
            () => handleToggle("pushNotifications")
          )}
          {renderToggleRow(
            <Mail size={20} color={Colors.primary} />,
            "Email Notifications",
            "Weekly digest and updates",
            settings.emailNotifications,
            () => handleToggle("emailNotifications")
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA & ANALYTICS</Text>
          {renderToggleRow(
            <BarChart3 size={20} color={Colors.primary} />,
            "Usage Analytics",
            "Help us improve the app",
            settings.analytics,
            () => handleToggle("analytics")
          )}
          {renderToggleRow(
            <Share2 size={20} color={Colors.primary} />,
            "Data Sharing",
            "Share anonymized cooking data",
            settings.dataSharing,
            () => handleToggle("dataSharing")
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY</Text>
          {renderActionRow(
            <Lock size={20} color={Colors.primary} />,
            "Change Password",
            "Update your account password",
            () => console.log("Change password")
          )}
          {renderActionRow(
            <Smartphone size={20} color={Colors.primary} />,
            "Two-Factor Authentication",
            "Add extra security to your account",
            () => console.log("2FA settings")
          )}
          {renderActionRow(
            <Eye size={20} color={Colors.primary} />,
            "Active Sessions",
            "Manage your logged-in devices",
            () => console.log("Active sessions")
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR DATA</Text>
          {renderActionRow(
            <Download size={20} color={Colors.primary} />,
            "Download My Data",
            "Get a copy of all your data",
            handleDownloadData
          )}
          {renderActionRow(
            <Database size={20} color={Colors.primary} />,
            "View Privacy Policy",
            "See how we handle your data",
            () => router.push("/privacy-policy")
          )}
          {renderActionRow(
            <Trash2 size={20} color="#ef4444" />,
            "Delete All My Data",
            "Permanently remove your data",
            handleDeleteData,
            true
          )}
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Account Status</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Secure</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Data Encryption</Text>
            <Text style={styles.statusValue}>AES-256</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Last Security Check</Text>
            <Text style={styles.statusValue}>Today</Text>
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
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "15",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.primary,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
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
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  settingIconDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  settingTitleDanger: {
    color: "#ef4444",
  },
  settingSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    marginTop: 8,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardGlassBorder,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.white,
  },
});
