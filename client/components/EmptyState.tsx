import React from "react";
import { View, StyleSheet, Image } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface EmptyStateProps {
  image?: any;
  title: string;
  message: string;
  buttonText?: string;
  onButtonPress?: () => void;
}

export function EmptyState({
  image,
  title,
  message,
  buttonText,
  onButtonPress,
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      style={styles.container}
    >
      {image ? (
        <Animated.View 
          entering={FadeInUp.delay(100).springify()}
          style={[styles.imageContainer, { backgroundColor: theme.backgroundSecondary }]}
        >
          <Image source={image} style={styles.image} resizeMode="contain" />
        </Animated.View>
      ) : null}
      <Animated.View entering={FadeInUp.delay(200).springify()}>
        <ThemedText style={[styles.title, { color: theme.text }]}>{title}</ThemedText>
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(300).springify()}>
        <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
          {message}
        </ThemedText>
      </Animated.View>
      {buttonText && onButtonPress ? (
        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <Button onPress={onButtonPress} style={styles.button}>
            {buttonText}
          </Button>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
    paddingTop: Spacing["4xl"],
  },
  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  image: {
    width: 100,
    height: 100,
    opacity: 0.9,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing["2xl"],
    maxWidth: 280,
  },
  button: {
    paddingHorizontal: Spacing["3xl"],
  },
});
