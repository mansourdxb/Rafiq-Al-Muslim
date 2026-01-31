import React from "react";
import { StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Shadows, BorderRadius } from "@/constants/theme";

interface FloatingButtonProps {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  color?: string;
  size?: number;
  bottom?: number;
  right?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FloatingButton({
  icon,
  onPress,
  color,
  size = 56,
  bottom = 16,
  right = 16,
}: FloatingButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const buttonColor = color || theme.primary;

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 12, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.button,
        Shadows.colored(buttonColor),
        {
          backgroundColor: buttonColor,
          width: size,
          height: size,
          borderRadius: BorderRadius.lg,
          bottom,
          right,
        },
        animatedStyle,
      ]}
    >
      <Feather name={icon} size={22} color="#FFFFFF" />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
});
