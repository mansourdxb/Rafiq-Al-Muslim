import React from "react";
import { View, StyleSheet, Pressable, ScrollView, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>
      <Animated.View
        entering={SlideInDown.springify().damping(18)}
        exiting={SlideOutDown.duration(200)}
        style={[
          styles.container,
          { 
            backgroundColor: theme.surfaceElevated,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: theme.text }]}>
            Select Dhikr
          </ThemedText>
          <Pressable onPress={onClose} hitSlop={12}>
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
                  { 
                    backgroundColor: isActive ? `${preset.color}12` : "transparent",
                    borderColor: isActive ? `${preset.color}40` : theme.borderLight,
                  },
                  pressed && { opacity: 0.8 },
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
                <ThemedText style={[styles.itemCount, { color: theme.textMuted }]}>
                  {preset.count}/{preset.target}
                </ThemedText>
                {isActive ? (
                  <View style={[styles.checkContainer, { backgroundColor: preset.color }]}>
                    <Feather name="check" size={14} color="#FFFFFF" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "70%",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "rgba(128, 128, 128, 0.3)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
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
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
