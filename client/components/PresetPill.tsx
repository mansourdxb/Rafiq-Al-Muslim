import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Preset } from "@/types";

interface PresetPillProps {
  preset: Preset;
  onPress: () => void;
  onTargetPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PresetPill({ preset, onPress, onTargetPress }: PresetPillProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.pill,
          { 
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.border,
          },
          Shadows.small,
          animatedStyle,
        ]}
      >
        <View style={[styles.colorDot, { backgroundColor: preset.color }]} />
        <ThemedText style={[styles.label, { color: theme.text }]}>
          {preset.name}
        </ThemedText>
        <Feather name="chevron-down" size={16} color={theme.textSecondary} />
      </AnimatedPressable>

      {onTargetPress ? (
        <Pressable
          onPress={onTargetPress}
          style={({ pressed }) => [
            styles.targetChip,
            { 
              backgroundColor: `${preset.color}15`,
              borderColor: `${preset.color}30`,
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Feather name="target" size={12} color={preset.color} />
          <ThemedText style={[styles.targetText, { color: preset.color }]}>
            {preset.target}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
  targetChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    borderWidth: 1,
  },
  targetText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
