import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Award,
  Clock,
  ChefHat,
  ShoppingBag,
  Share2,
  Home,
  RotateCcw,
  CheckCircle,
  TrendingDown,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { ARSessionStats } from '@/types/ar';

interface ARCompletionPanelProps {
  recipeTitle: string;
  stats: ARSessionStats;
  onGoHome: () => void;
  onShare: () => void;
  onRestart: () => void;
  insets: { top: number; bottom: number };
}

export default function ARCompletionPanel({
  recipeTitle,
  stats,
  onGoHome,
  onShare,
  onRestart,
  insets,
}: ARCompletionPanelProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    setTimeout(() => {
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }, 400);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, paddingTop: insets.top },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge */}
        <Animated.View
          style={[
            styles.badgeContainer,
            { transform: [{ scale: badgeScale }] },
          ]}
        >
          <View style={styles.badgeOuter}>
            <View style={styles.badgeInner}>
              <Award size={48} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.completionTitle}>Dish Complete!</Text>
          <Text style={styles.recipeTitle}>{recipeTitle}</Text>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View
          style={[styles.statsGrid, { transform: [{ scale: scaleAnim }] }]}
        >
          <View style={styles.statCard}>
            <Clock size={20} color={Colors.primary} />
            <Text style={styles.statValue}>
              {formatDuration(stats.totalCookTime)}
            </Text>
            <Text style={styles.statLabel}>Cook Time</Text>
          </View>

          <View style={styles.statCard}>
            <CheckCircle size={20} color={Colors.green} />
            <Text style={styles.statValue}>
              {stats.stepsCompleted}/{stats.totalSteps}
            </Text>
            <Text style={styles.statLabel}>Steps Done</Text>
          </View>

          <View style={styles.statCard}>
            <Zap size={20} color={Colors.secondary} />
            <Text style={styles.statValue}>+{stats.xpEarned}</Text>
            <Text style={styles.statLabel}>XP Earned</Text>
          </View>
        </Animated.View>

        {/* Ingredients Used */}
        {stats.ingredientsUsed.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ChefHat size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Ingredients Used</Text>
            </View>
            {stats.ingredientsUsed.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <Text style={styles.ingredientName}>{ing.name}</Text>
                <Text style={styles.ingredientAmount}>
                  {ing.amount} {ing.unit}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Remaining Pantry */}
        {stats.ingredientsRemaining.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ShoppingBag size={18} color={Colors.secondary} />
              <Text style={styles.sectionTitle}>Remaining in Pantry</Text>
            </View>
            {stats.ingredientsRemaining.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <Text style={styles.ingredientName}>{ing.name}</Text>
                <Text
                  style={[
                    styles.ingredientAmount,
                    ing.amount <= 0 && styles.ingredientDepleted,
                  ]}
                >
                  {ing.amount > 0 ? `${ing.amount} ${ing.unit}` : 'Depleted'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={onGoHome}>
            <Home size={20} color={Colors.backgroundDark} />
            <Text style={styles.primaryButtonText}>Done</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onShare}
            >
              <Share2 size={18} color={Colors.white} />
              <Text style={styles.secondaryButtonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onRestart}
            >
              <RotateCcw size={18} color={Colors.white} />
              <Text style={styles.secondaryButtonText}>Cook Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

function Zap(props: any) {
  return <TrendingDown {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(16,34,21,0.95)',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
    gap: 24,
  },
  badgeContainer: {
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  badgeOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(43,238,91,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(43,238,91,0.3)',
  },
  badgeInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(43,238,91,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 8,
  },
  recipeTitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statValue: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  ingredientName: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  ingredientAmount: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  ingredientDepleted: {
    color: Colors.red,
  },
  actions: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryButtonText: {
    color: Colors.backgroundDark,
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  secondaryButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
