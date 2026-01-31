import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
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
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PresetCard({ preset, isActive, onPress, onLongPress, index = 0 }: PresetCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const progress = preset.target > 0 ? Math.min(preset.count / preset.target, 1) : 0;

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <AnimatedPressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.container,
          { 
            backgroundColor: theme.surfaceElevated,
            borderColor: isActive ? preset.color : theme.borderLight,
          },
          Shadows.medium,
          animatedStyle,
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
            <ThemedText style={[styles.target, { color: theme.textMuted }]}>
              / {preset.target.toLocaleString()}
            </ThemedText>
          </View>
          <View style={[styles.progressBackground, { backgroundColor: theme.progressTrack }]}>
            <Animated.View
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
  },
  colorStripe: {
    width: 5,
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
    fontSize: 17,
    fontWeight: "600",
  },
  arabicName: {
    fontSize: 15,
    marginTop: 3,
  },
  activeIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.md,
  },
  count: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  target: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 4,
  },
  progressBackground: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
});
