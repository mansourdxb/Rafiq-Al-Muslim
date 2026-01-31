import React, { useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { ProgressRing } from "@/components/ProgressRing";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";

interface CounterDisplayProps {
  count: number;
  target: number;
  color: string;
  onTap: () => void;
}

export function CounterDisplay({ count, target, color, onTap }: CounterDisplayProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const counterScale = useSharedValue(1);

  const progress = target > 0 ? count / target : 0;
  const isComplete = count >= target && target > 0;

  useEffect(() => {
    counterScale.value = withSequence(
      withSpring(1.08, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 150 })
    );
  }, [count]);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
    opacity.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    opacity.value = withSpring(1);
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const counterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: counterScale.value }],
  }));

  const ringSize = 280;

  return (
    <Pressable
      onPress={onTap}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.pressable}
    >
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        <View style={styles.ringContainer}>
          <ProgressRing
            progress={progress}
            size={ringSize}
            strokeWidth={10}
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
            <ThemedText style={[styles.target, { color: theme.textSecondary }]}>
              of {target}
            </ThemedText>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
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
    lineHeight: Typography.counter.lineHeight,
    textAlign: "center",
  },
  target: {
    fontSize: Typography.body.fontSize,
    marginTop: Spacing.xs,
  },
});
