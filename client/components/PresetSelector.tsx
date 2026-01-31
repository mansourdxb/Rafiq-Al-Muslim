import React from "react";
import { View, StyleSheet, Pressable, ScrollView, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Preset } from "@/types";

interface PresetSelectorProps {
  visible: boolean;
  presets: Preset[];
  currentPresetId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function PresetSelector({
  visible,
  presets,
  currentPresetId,
  onSelect,
  onClose,
}: PresetSelectorProps) {
  const { theme, isDark } = useTheme();

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.container,
            { backgroundColor: theme.surface },
            Shadows.large,
          ]}
        >
          <View style={styles.header}>
            <ThemedText style={[styles.title, { color: theme.text }]}>
              Select Dhikr
            </ThemedText>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {presets.map((preset) => {
              const isActive = preset.id === currentPresetId;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => handleSelect(preset.id)}
                  style={({ pressed }) => [
                    styles.item,
                    { backgroundColor: pressed ? theme.backgroundSecondary : "transparent" },
                    isActive && { backgroundColor: theme.progressBackground },
                  ]}
                >
                  <View style={[styles.colorDot, { backgroundColor: preset.color }]} />
                  <View style={styles.itemContent}>
                    <ThemedText style={[styles.itemName, { color: theme.text }]}>
                      {preset.name}
                    </ThemedText>
                    {preset.arabicName ? (
                      <ThemedText style={[styles.itemArabic, { color: theme.textSecondary }]}>
                        {preset.arabicName}
                      </ThemedText>
                    ) : null}
                  </View>
                  <ThemedText style={[styles.itemCount, { color: theme.textSecondary }]}>
                    {preset.count}/{preset.target}
                  </ThemedText>
                  {isActive ? (
                    <Feather name="check" size={20} color={theme.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  container: {
    width: "100%",
    maxHeight: "70%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.sm,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemArabic: {
    fontSize: 14,
    marginTop: 2,
  },
  itemCount: {
    fontSize: 14,
    marginRight: Spacing.md,
  },
});
