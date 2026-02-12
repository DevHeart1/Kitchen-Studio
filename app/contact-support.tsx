import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Linking,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Mail,
  Phone,
  Send,
  CheckCircle,
  Bug,
  Lightbulb,
  CircleHelp,
  TriangleAlert,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useUserProfile } from "@/contexts/UserProfileContext";

type IssueType = "bug" | "feature" | "question" | "other";

interface ContactOption {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  action: () => void;
}

const ISSUE_TYPES: { type: IssueType; label: string; icon: React.ComponentType<{ size: number; color: string }> }[] = [
  { type: "bug", label: "Bug Report", icon: Bug },
  { type: "feature", label: "Feature Request", icon: Lightbulb },
  { type: "question", label: "Question", icon: CircleHelp },
  { type: "other", label: "Other", icon: TriangleAlert },
];

export default function ContactSupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useUserProfile();

  const [selectedType, setSelectedType] = useState<IssueType | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleTypeSelect = (type: IssueType) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedType(type);
  };

  const handleSubmit = async () => {
    if (!selectedType || !subject.trim() || !message.trim()) {
      Alert.alert("Missing Information", "Please fill in all fields before submitting.");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("Support ticket submitted:", {
      type: selectedType,
      subject,
      message,
      user: profile.name,
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleEmailPress = () => {
    Linking.openURL("mailto:support@chefapp.com?subject=Support Request");
  };

  const handlePhonePress = () => {
    if (Platform.OS !== "web") {
      Linking.openURL("tel:+18001234567");
    }
  };

  const contactOptions: ContactOption[] = [
    {
      id: "email",
      title: "Email Us",
      subtitle: "support@chefapp.com",
      icon: Mail,
      action: handleEmailPress,
    },
    {
      id: "phone",
      title: "Call Us",
      subtitle: "+1 (800) 123-4567",
      icon: Phone,
      action: handlePhonePress,
    },
  ];

  if (isSubmitted) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle size={64} color={Colors.primary} />
          </View>
          <Text style={styles.successTitle}>Message Sent!</Text>
          <Text style={styles.successSubtitle}>
            Thank you for reaching out. We will get back to you within 24-48 hours.
          </Text>
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketLabel}>Ticket Reference</Text>
            <Text style={styles.ticketNumber}>#{Date.now().toString().slice(-8)}</Text>
          </View>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contactOptions}>
            {contactOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={styles.contactCard}
                  onPress={option.action}
                  activeOpacity={0.7}
                >
                  <View style={styles.contactIcon}>
                    <IconComponent size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.contactContent}>
                    <Text style={styles.contactTitle}>{option.title}</Text>
                    <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or send a message</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Issue Type</Text>
            <View style={styles.issueTypes}>
              {ISSUE_TYPES.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedType === item.type;
                return (
                  <TouchableOpacity
                    key={item.type}
                    style={[styles.issueTypeCard, isSelected && styles.issueTypeCardSelected]}
                    onPress={() => handleTypeSelect(item.type)}
                  >
                    <IconComponent
                      size={20}
                      color={isSelected ? Colors.primary : Colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.issueTypeLabel,
                        isSelected && styles.issueTypeLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief description of your issue"
              placeholderTextColor={Colors.textMuted}
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your issue in detail..."
              placeholderTextColor={Colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.charCount}>{message.length}/1000</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedType || !subject.trim() || !message.trim()) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !selectedType || !subject.trim() || !message.trim()}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Sending...</Text>
            ) : (
              <>
                <Send size={20} color={Colors.backgroundDark} />
                <Text style={styles.submitButtonText}>Send Message</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.responseTime}>
            Average response time: 24-48 hours
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
  contactOptions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  contactCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    gap: 12,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  contactSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.cardGlassBorder,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textMuted,
    paddingHorizontal: 16,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.white,
    marginBottom: 10,
  },
  issueTypes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  issueTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardGlass,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    gap: 8,
  },
  issueTypeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "15",
  },
  issueTypeLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: "500" as const,
  },
  issueTypeLabelSelected: {
    color: Colors.primary,
  },
  input: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  textArea: {
    minHeight: 140,
    paddingTop: 16,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "right",
    marginTop: 6,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  responseTime: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 16,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  ticketInfo: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    marginBottom: 32,
    width: "100%",
  },
  ticketLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  ticketNumber: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
});
