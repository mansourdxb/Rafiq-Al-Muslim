import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface StatsRowProps {
  todayTotal: number;
  allTimeTotal: number;
}

export function StatsRow({ todayTotal, allTimeTotal }: StatsRowProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={[
          styles.statCard,
          { 
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.borderLight,
          },
          Shadows.medium,
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}15` }]}>
          <Feather name="sun" size={18} color={theme.primary} />
        </View>
        <View style={styles.textContainer}>
          <ThemedText style={[styles.statValue, { color: theme.text }]}>
            {todayTotal.toLocaleString()}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>
            Today
          </ThemedText>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(200).springify()}
        style={[
          styles.statCard,
          { 
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.borderLight,
          },
          Shadows.medium,
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${theme.accent}15` }]}>
          <Feather name="trending-up" size={18} color={theme.accent} />
        </View>
        <View style={styles.textContainer}>
          <ThemedText style={[styles.statValue, { color: theme.text }]}>
            {allTimeTotal.toLocaleString()}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>
            All Time
          </ThemedText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
});
