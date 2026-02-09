import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Clock,
  ChefHat,
  Star,
  Check,
  Lightbulb,
  MoreVertical,
  Trash2,
  Share2,
  MessageSquare,
  X,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useCookingHistory } from "@/contexts/CookingHistoryContext";
import { CookingStep } from "@/types";

export default function CookSessionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [showMenuModal, setShowMenuModal] = useState(false);
  const { getSession, removeSession } = useCookingHistory();

  const cook = useMemo(() => {
    return getSession(id || "");
  }, [id, getSession]);

  if (!cook) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Session not found</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isCompleted = cook.progress === 100;
  const completedSteps = cook.steps?.filter((s) => s.completed).length || 0;
  const totalSteps = cook.steps?.length || 0;

  const handleResumeCooking = () => {
    router.push({
      pathname: "/ar-cooking",
      params: { id: cook?.recipeId },
    });
  };

  const handleRestartCooking = () => {
    router.push({
      pathname: "/ar-cooking",
      params: { id: cook?.recipeId },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const renderStepItem = (step: CookingStep, index: number) => {
    const isCurrentStep = index + 1 === cook.currentStep && !isCompleted;

    return (
      <View
        key={step.id}
        style={[
          styles.stepItem,
          step.completed && styles.stepItemCompleted,
          isCurrentStep && styles.stepItemCurrent,
        ]}
      >
        <View
          style={[
            styles.stepNumber,
            step.completed && styles.stepNumberCompleted,
            isCurrentStep && styles.stepNumberCurrent,
          ]}
        >
          {step.completed ? (
            <Check size={14} color={Colors.backgroundDark} />
          ) : (
            <Text
              style={[
                styles.stepNumberText,
                isCurrentStep && styles.stepNumberTextCurrent,
              ]}
            >
              {index + 1}
            </Text>
          )}
        </View>

        <View style={styles.stepContent}>
          <Text
            style={[
              styles.stepTitle,
              step.completed && styles.stepTitleCompleted,
            ]}
          >
            {step.title}
          </Text>
          <Text style={styles.stepDescription}>{step.description}</Text>

          {step.duration && (
            <View style={styles.stepDuration}>
              <Clock size={12} color={Colors.textMuted} />
              <Text style={styles.stepDurationText}>{step.duration}</Text>
            </View>
          )}

          {step.tip && (
            <View style={styles.stepTip}>
              <Lightbulb size={14} color={Colors.yellow} />
              <Text style={styles.stepTipText}>{step.tip}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Image source={{ uri: cook.image }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />

          <View style={[styles.heroHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenuModal(true)}
            >
              <MoreVertical size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroBadges}>
              <View style={styles.durationBadge}>
                <Clock size={14} color={Colors.white} />
                <Text style={styles.durationText}>{cook.duration}</Text>
              </View>
              {isCompleted && cook.rating && (
                <View style={styles.ratingBadge}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      color={Colors.yellow}
                      fill={star <= cook.rating! ? Colors.yellow : "transparent"}
                    />
                  ))}
                </View>
              )}
            </View>
            <Text style={styles.heroTitle}>{cook.title}</Text>
            {cook.chefName && (
              <View style={styles.chefRow}>
                {cook.chefAvatar && (
                  <Image
                    source={{ uri: cook.chefAvatar }}
                    style={styles.chefAvatar}
                  />
                )}
                <Text style={styles.chefName}>by {cook.chefName}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>
                {isCompleted ? "Completed Session" : "Session In Progress"}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  isCompleted ? styles.statusBadgeCompleted : styles.statusBadgeProgress,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isCompleted ? styles.statusBadgeTextCompleted : styles.statusBadgeTextProgress,
                  ]}
                >
                  {isCompleted ? "Done" : `${cook.progress}%`}
                </Text>
              </View>
            </View>

            <Text style={styles.statusDate}>
              {isCompleted ? "Finished" : "Started"} {formatDate(cook.startedAt)}
            </Text>

            {!isCompleted && (
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${cook.progress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {completedSteps} of {totalSteps} steps completed
                </Text>
              </View>
            )}

            {isCompleted && cook.notes && (
              <View style={styles.notesSection}>
                <MessageSquare size={16} color={Colors.primary} />
                <Text style={styles.notesText}>"{cook.notes}"</Text>
              </View>
            )}
          </View>

          {cook.steps && cook.steps.length > 0 && (
            <View style={styles.stepsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Cooking Steps</Text>
                <Text style={styles.sectionSubtitle}>
                  {completedSteps}/{totalSteps} completed
                </Text>
              </View>

              <View style={styles.stepsList}>
                {cook.steps.map((step, index) => renderStepItem(step, index))}
              </View>
            </View>
          )}

          {isCompleted && !cook.rating && (
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() => setShowRatingModal(true)}
            >
              <Star size={20} color={Colors.yellow} />
              <Text style={styles.rateButtonText}>Rate this session</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {isCompleted ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRestartCooking}
          >
            <RotateCcw size={20} color={Colors.backgroundDark} />
            <Text style={styles.primaryButtonText}>Cook Again</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleResumeCooking}
          >
            <Play size={20} color={Colors.backgroundDark} fill={Colors.backgroundDark} />
            <Text style={styles.primaryButtonText}>Resume Cooking</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showRatingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRatingModal(false)}
            >
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Rate Your Session</Text>
            <Text style={styles.modalSubtitle}>
              How did your {cook.title} turn out?
            </Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSelectedRating(star)}
                >
                  <Star
                    size={40}
                    color={Colors.yellow}
                    fill={star <= selectedRating ? Colors.yellow : "transparent"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about your cooking session..."
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                selectedRating === 0 && styles.submitButtonDisabled,
              ]}
              disabled={selectedRating === 0}
              onPress={() => {
                setShowRatingModal(false);
                setSelectedRating(0);
                setNotes("");
              }}
            >
              <Text style={styles.submitButtonText}>Submit Rating</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showMenuModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenuModal(false)}
        >
          <View style={[styles.menuContent, { marginTop: insets.top + 60 }]}>
            <TouchableOpacity style={styles.menuItem}>
              <Share2 size={20} color={Colors.white} />
              <Text style={styles.menuItemText}>Share Session</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]}>
              <Trash2 size={20} color={Colors.red} />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
                Delete Session
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.textMuted,
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  heroSection: {
    height: 320,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  heroHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  heroBadges: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  durationText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 8,
  },
  chefRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chefAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  chefName: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500" as const,
  },
  contentSection: {
    padding: 20,
    gap: 24,
  },
  statusCard: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeCompleted: {
    backgroundColor: Colors.greenBg,
  },
  statusBadgeProgress: {
    backgroundColor: Colors.primary + "30",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  statusBadgeTextCompleted: {
    color: Colors.green,
  },
  statusBadgeTextProgress: {
    color: Colors.primary,
  },
  statusDate: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  progressSection: {
    marginTop: 16,
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  notesSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 16,
    padding: 14,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: "italic",
    lineHeight: 20,
  },
  stepsSection: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  stepItemCompleted: {
    opacity: 0.7,
  },
  stepItemCurrent: {
    borderColor: Colors.primary + "50",
    backgroundColor: Colors.primary + "10",
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberCompleted: {
    backgroundColor: Colors.primary,
  },
  stepNumberCurrent: {
    backgroundColor: Colors.primary + "30",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.textMuted,
  },
  stepNumberTextCurrent: {
    color: Colors.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 4,
  },
  stepTitleCompleted: {
    textDecorationLine: "line-through",
    color: Colors.textMuted,
  },
  stepDescription: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  stepDuration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  stepDurationText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  stepTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10,
    padding: 10,
    backgroundColor: Colors.yellow + "15",
    borderRadius: 10,
  },
  stepTipText: {
    flex: 1,
    fontSize: 12,
    color: Colors.yellow,
    lineHeight: 16,
  },
  rateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  rateButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: Colors.surfaceDark,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  starsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  notesInput: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    color: Colors.white,
    fontSize: 14,
    textAlignVertical: "top",
    minHeight: 80,
    marginBottom: 20,
  },
  submitButton: {
    width: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menuContent: {
    position: "absolute",
    right: 16,
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 8,
    minWidth: 180,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 10,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  menuItemText: {
    fontSize: 15,
    color: Colors.white,
    fontWeight: "500" as const,
  },
  menuItemTextDanger: {
    color: Colors.red,
  },
});
