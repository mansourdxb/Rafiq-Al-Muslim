import React, { useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ProgressRing } from "@/components/ProgressRing";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius, Shadows } from "@/constants/theme";

interface CounterDisplayProps {
  count: number;
  target: number;
  color: string;
  onTap: () => void;
}

export function CounterDisplay({ count, target, color, onTap }: CounterDisplayProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const counterScale = useSharedValue(1);
  const ringScale = useSharedValue(1);

  const progress = target > 0 ? count / target : 0;
  const isComplete = count >= target && target > 0;

  useEffect(() => {
    counterScale.value = withSequence(
      withSpring(1.06, { damping: 6, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    ringScale.value = withSequence(
      withSpring(1.02, { damping: 8, stiffness: 250 }),
      withSpring(1, { damping: 12, stiffness: 180 })
    );
  }, [count]);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const counterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: counterScale.value }],
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const ringSize = 300;

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onTap}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
          <Animated.View style={[styles.ringContainer, ringAnimatedStyle]}>
            <ProgressRing
              progress={progress}
              size={ringSize}
              strokeWidth={14}
              color={color}
            />
            <View style={styles.counterContainer}>
              <Animated.View style={counterAnimatedStyle}>
                <ThemedText
                  style={[
                    styles.counter,
                    { color: isComplete ? theme.success : theme.text },
                  ]}
                >
                  {count}
                </ThemedText>
              </Animated.View>
              <View style={styles.targetContainer}>
                <ThemedText style={[styles.targetLabel, { color: theme.textMuted }]}>
                  of
                </ThemedText>
                <ThemedText style={[styles.targetValue, { color: theme.textSecondary }]}>
                  {target}
                </ThemedText>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </Pressable>
      
      <Pressable
        onPress={onTap}
        style={({ pressed }) => [
          styles.plusButton,
          { 
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.borderLight,
          },
          Shadows.medium,
          pressed && { transform: [{ scale: 0.95 }], opacity: 0.9 },
        ]}
      >
        <Feather name="plus" size={24} color={theme.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pressable: {
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  ringContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  counterContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  counter: {
    fontSize: Typography.counter.fontSize,
    fontWeight: Typography.counter.fontWeight,
    letterSpacing: Typography.counter.letterSpacing,
    textAlign: "center",
  },
  targetContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  targetLabel: {
    fontSize: 15,
    fontWeight: "400",
  },
  targetValue: {
    fontSize: 17,
    fontWeight: "600",
  },
  plusButton: {
    position: "absolute",
    bottom: 0,
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});
