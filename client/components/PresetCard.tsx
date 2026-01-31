import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Preset } from "@/types";

interface PresetCardProps {
  preset: Preset;
  isActive: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PresetCard({ preset, isActive, onPress, onLongPress }: PresetCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const progress = preset.target > 0 ? Math.min(preset.count / preset.target, 1) : 0;

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.surface },
        Shadows.small,
        animatedStyle,
        isActive && { borderColor: preset.color, borderWidth: 2 },
      ]}
    >
      <View style={[styles.colorStripe, { backgroundColor: preset.color }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <ThemedText style={[styles.name, { color: theme.text }]}>
              {preset.name}
            </ThemedText>
            {preset.arabicName ? (
              <ThemedText style={[styles.arabicName, { color: theme.textSecondary }]}>
                {preset.arabicName}
              </ThemedText>
            ) : null}
          </View>
          {isActive ? (
            <View style={[styles.activeIndicator, { backgroundColor: preset.color }]}>
              <Feather name="check" size={12} color="#FFFFFF" />
            </View>
          ) : null}
        </View>
        <View style={styles.statsRow}>
          <ThemedText style={[styles.count, { color: theme.text }]}>
            {preset.count.toLocaleString()}
          </ThemedText>
          <ThemedText style={[styles.target, { color: theme.textSecondary }]}>
            / {preset.target.toLocaleString()}
          </ThemedText>
        </View>
        <View style={[styles.progressBackground, { backgroundColor: theme.progressBackground }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: preset.color,
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  colorStripe: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  arabicName: {
    fontSize: 14,
    marginTop: 2,
  },
  activeIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.sm,
  },
  count: {
    fontSize: 20,
    fontWeight: "700",
  },
  target: {
    fontSize: 14,
    marginLeft: 4,
  },
  progressBackground: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
});
