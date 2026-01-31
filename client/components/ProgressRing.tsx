import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  interpolate,
  useDerivedValue,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number;
  size: number;
  strokeWidth?: number;
  color?: string;
}

export function ProgressRing({
  progress,
  size,
  strokeWidth = 8,
  color,
}: ProgressRingProps) {
  const { theme } = useTheme();
  const animatedProgress = useSharedValue(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  useEffect(() => {
    animatedProgress.value = withSpring(Math.min(progress, 1), {
      damping: 15,
      stiffness: 80,
    });
  }, [progress]);

  const animatedStrokeDashoffset = useDerivedValue(() => {
    return interpolate(
      animatedProgress.value,
      [0, 1],
      [circumference, 0]
    );
  });

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedStrokeDashoffset.value,
  }));

  const ringColor = color || theme.primary;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={ringColor} stopOpacity={1} />
            <Stop offset="100%" stopColor={theme.accent} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.progressBackground}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  svg: {
    position: "absolute",
  },
});
