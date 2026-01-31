import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
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
      <View
        style={[
          styles.statCard,
          { backgroundColor: theme.surface },
          Shadows.small,
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.progressBackground }]}>
          <Feather name="sun" size={16} color={theme.primary} />
        </View>
        <View style={styles.textContainer}>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Today
          </ThemedText>
          <ThemedText style={[styles.statValue, { color: theme.text }]}>
            {todayTotal.toLocaleString()}
          </ThemedText>
        </View>
      </View>

      <View
        style={[
          styles.statCard,
          { backgroundColor: theme.surface },
          Shadows.small,
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${theme.accent}20` }]}>
          <Feather name="bar-chart-2" size={16} color={theme.accent} />
        </View>
        <View style={styles.textContainer}>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            All Time
          </ThemedText>
          <ThemedText style={[styles.statValue, { color: theme.text }]}>
            {allTimeTotal.toLocaleString()}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
  },
});
