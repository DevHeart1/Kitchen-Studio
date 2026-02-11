import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Pressable,
  Switch,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  Trash2,
  LogOut,
  ChevronRight,
  Camera,
  X,
  Check,
  Moon,
  Globe,
  HelpCircle,
  FileText,
  MessageSquare,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useAuth } from "@/contexts/AuthContext";

const AVATAR_OPTIONS = [
  "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face",
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, updateName, updateAvatar, updateSettings } = useUserProfile();
  const { signOut } = useAuth();

  const [editNameModal, setEditNameModal] = useState(false);
  const [editAvatarModal, setEditAvatarModal] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  const [tempName, setTempName] = useState(profile.name);

  const handleSaveName = async () => {
    if (tempName.trim()) {
      await updateName(tempName.trim());
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    setEditNameModal(false);
  };

  const handleSelectAvatar = async (avatarUrl: string) => {
    await updateAvatar(avatarUrl);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setEditAvatarModal(false);
  };

  const handleDeleteAccount = () => {
    setDeleteAccountModal(true);
  };

  const confirmDeleteAccount = async () => {
    // In a real app, you'd call a Supabase function to delete the user
    await signOut();
    console.log("Account deletion requested");
    setDeleteAccountModal(false);
    router.replace("/(auth)/login");
  };

  const handleLogout = () => {
    setLogoutModal(true);
  };

  const confirmLogout = async () => {
    await signOut();
    console.log("User logged out");
    setLogoutModal(false);
    router.replace("/(auth)/login");
  };

  const renderSettingRow = (
    icon: React.ReactNode,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
    danger = false
  ) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <ChevronRight size={20} color={Colors.textMuted} />)}
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => setEditAvatarModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.profileAvatarContainer}>
            <Image source={{ uri: profile.avatar }} style={styles.profileAvatar} />
            <View style={styles.cameraOverlay}>
              <Camera size={16} color={Colors.white} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileTitle}>{profile.title}</Text>
            <Text style={styles.profileLevel}>Level {profile.level}</Text>
          </View>
          <ChevronRight size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFILE</Text>
          {renderSettingRow(
            <User size={20} color={Colors.primary} />,
            "Edit Name",
            profile.name,
            () => {
              setTempName(profile.name);
              setEditNameModal(true);
            }
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          {renderSettingRow(
            <Bell size={20} color={Colors.primary} />,
            "Notifications",
            "Recipe reminders & updates",
            undefined,
            <Switch
              value={profile.settings.notifications}
              onValueChange={(value) => updateSettings({ notifications: value })}
              trackColor={{ false: "#3e3e3e", true: Colors.primary + "60" }}
              thumbColor={profile.settings.notifications ? Colors.primary : "#f4f3f4"}
            />
          )}
          {renderSettingRow(
            <Moon size={20} color={Colors.primary} />,
            "Dark Mode",
            "Use dark theme",
            undefined,
            <Switch
              value={profile.settings.darkMode}
              onValueChange={(value) => updateSettings({ darkMode: value })}
              trackColor={{ false: "#3e3e3e", true: Colors.primary + "60" }}
              thumbColor={profile.settings.darkMode ? Colors.primary : "#f4f3f4"}
            />
          )}
          {renderSettingRow(
            <Globe size={20} color={Colors.primary} />,
            "AR Cooking Tips",
            "Show tips during AR sessions",
            undefined,
            <Switch
              value={profile.settings.arTips}
              onValueChange={(value) => updateSettings({ arTips: value })}
              trackColor={{ false: "#3e3e3e", true: Colors.primary + "60" }}
              thumbColor={profile.settings.arTips ? Colors.primary : "#f4f3f4"}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          {renderSettingRow(
            <HelpCircle size={20} color={Colors.primary} />,
            "Help Center",
            "FAQs and tutorials",
            () => router.push("/help-center")
          )}
          {renderSettingRow(
            <MessageSquare size={20} color={Colors.primary} />,
            "Contact Support",
            "Get help from our team",
            () => router.push("/contact-support")
          )}
          {renderSettingRow(
            <FileText size={20} color={Colors.primary} />,
            "Privacy Policy",
            undefined,
            () => router.push("/privacy-policy")
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          {renderSettingRow(
            <Shield size={20} color={Colors.primary} />,
            "Privacy & Security",
            "Data and permissions",
            () => router.push("/privacy-security")
          )}
          {renderSettingRow(
            <Trash2 size={20} color="#ef4444" />,
            "Delete Account",
            "Permanently delete your data",
            handleDeleteAccount,
            undefined,
            true
          )}
          {renderSettingRow(
            <LogOut size={20} color="#ef4444" />,
            "Log Out",
            undefined,
            handleLogout,
            undefined,
            true
          )}
        </View>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      <Modal visible={editNameModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setEditNameModal(false)}>
          <Pressable style={styles.modalContent} onPress={() => { }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Name</Text>
              <TouchableOpacity onPress={() => setEditNameModal(false)}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.nameInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Enter your name"
              placeholderTextColor={Colors.textMuted}
              autoFocus
              maxLength={30}
            />
            <TouchableOpacity
              style={[styles.saveButton, !tempName.trim() && styles.saveButtonDisabled]}
              onPress={handleSaveName}
              disabled={!tempName.trim()}
            >
              <Check size={20} color={Colors.backgroundDark} />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={editAvatarModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setEditAvatarModal(false)}>
          <Pressable style={styles.avatarModalContent} onPress={() => { }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Avatar</Text>
              <TouchableOpacity onPress={() => setEditAvatarModal(false)}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((avatar, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.avatarOption,
                    profile.avatar === avatar && styles.avatarOptionSelected,
                  ]}
                  onPress={() => handleSelectAvatar(avatar)}
                >
                  <Image source={{ uri: avatar }} style={styles.avatarOptionImage} />
                  {profile.avatar === avatar && (
                    <View style={styles.avatarCheckmark}>
                      <Check size={14} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={logoutModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setLogoutModal(false)}>
          <Pressable style={styles.logoutModalContent} onPress={() => { }}>
            <View style={styles.logoutIconContainer}>
              <LogOut size={32} color="#ef4444" />
            </View>
            <Text style={styles.logoutTitle}>Log Out</Text>
            <Text style={styles.logoutMessage}>Are you sure you want to log out?</Text>
            <View style={styles.logoutButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={confirmLogout}
              >
                <Text style={styles.logoutButtonText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={deleteAccountModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setDeleteAccountModal(false)}>
          <Pressable style={styles.logoutModalContent} onPress={() => { }}>
            <View style={styles.logoutIconContainer}>
              <Trash2 size={32} color="#ef4444" />
            </View>
            <Text style={styles.logoutTitle}>Delete Account</Text>
            <Text style={styles.logoutMessage}>
              Are you sure you want to delete your account? This action cannot be undone.
            </Text>
            <View style={styles.logoutButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteAccountModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={confirmDeleteAccount}
              >
                <Text style={styles.logoutButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardGlass,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    marginBottom: 24,
  },
  profileAvatarContainer: {
    position: "relative",
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.backgroundDark,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  profileTitle: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600" as const,
    marginTop: 2,
  },
  profileLevel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
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
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  avatarModalContent: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  nameInput: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    marginBottom: 20,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  avatarOption: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "transparent",
  },
  avatarOptionSelected: {
    borderColor: Colors.primary,
  },
  avatarOptionImage: {
    width: "100%",
    height: "100%",
  },
  avatarCheckmark: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutModalContent: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    alignItems: "center",
  },
  logoutIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoutTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 8,
  },
  logoutMessage: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  logoutButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  logoutButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.white,
  },
});
