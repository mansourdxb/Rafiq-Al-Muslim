import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
        alignItems: "center",
      }}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.surface },
          Shadows.medium,
        ]}
      >
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>

      <ThemedText style={[styles.appName, { color: theme.text }]}>Tasbih</ThemedText>
      <ThemedText style={[styles.version, { color: theme.textSecondary }]}>
        Version 1.0.0
      </ThemedText>

      <View style={[styles.card, { backgroundColor: theme.surface }, Shadows.small]}>
        <ThemedText style={[styles.description, { color: theme.text }]}>
          A beautiful digital tasbeeh counter to help you track your dhikr and stay
          connected with your daily remembrance of Allah.
        </ThemedText>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }, Shadows.small]}>
        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
          Features
        </ThemedText>
        <ThemedText style={[styles.featureItem, { color: theme.textSecondary }]}>
          Track multiple dhikr presets
        </ThemedText>
        <ThemedText style={[styles.featureItem, { color: theme.textSecondary }]}>
          Beautiful progress animations
        </ThemedText>
        <ThemedText style={[styles.featureItem, { color: theme.textSecondary }]}>
          Daily and weekly statistics
        </ThemedText>
        <ThemedText style={[styles.featureItem, { color: theme.textSecondary }]}>
          Create custom presets
        </ThemedText>
        <ThemedText style={[styles.featureItem, { color: theme.textSecondary }]}>
          Haptic feedback for mindful counting
        </ThemedText>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }, Shadows.small]}>
        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
          Privacy
        </ThemedText>
        <ThemedText style={[styles.privacyText, { color: theme.textSecondary }]}>
          All your data is stored locally on your device. We do not collect or
          transmit any personal information.
        </ThemedText>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  icon: {
    width: "100%",
    height: "100%",
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  version: {
    fontSize: 15,
    marginBottom: Spacing["3xl"],
  },
  card: {
    width: "100%",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  featureItem: {
    fontSize: 15,
    lineHeight: 28,
  },
  privacyText: {
    fontSize: 15,
    lineHeight: 24,
  },
});
