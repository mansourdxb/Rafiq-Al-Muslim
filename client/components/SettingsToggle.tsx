import React from "react";
import { View, StyleSheet, Switch, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface SettingsToggleProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function SettingsToggle({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: SettingsToggleProps) {
  const { theme } = useTheme();

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.surfaceElevated,
        borderColor: theme.borderLight,
      },
      Shadows.small,
    ]}>
      <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}12` }]}>
        <Feather name={icon} size={18} color={theme.primary} />
      </View>
      <View style={styles.textContainer}>
        <ThemedText style={[styles.title, { color: theme.text }]}>{title}</ThemedText>
        {subtitle ? (
          <ThemedText style={[styles.subtitle, { color: theme.textMuted }]}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: `${theme.primary}90` }}
        thumbColor={value ? theme.primary : "#FFFFFF"}
        ios_backgroundColor={theme.border}
      />
    </View>
  );
}

interface SettingsButtonProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
}

export function SettingsButton({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
}: SettingsButtonProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { 
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.borderLight,
        },
        Shadows.small,
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}12` }]}>
        <Feather name={icon} size={18} color={theme.primary} />
      </View>
      <View style={styles.textContainer}>
        <ThemedText style={[styles.title, { color: theme.text }]}>{title}</ThemedText>
        {subtitle ? (
          <ThemedText style={[styles.subtitle, { color: theme.textMuted }]}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {showChevron ? (
        <Feather name="chevron-right" size={20} color={theme.textMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
