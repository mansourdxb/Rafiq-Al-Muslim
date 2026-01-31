import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

const COMMON_TARGETS = [33, 99, 100, 500, 1000];

interface TargetSheetProps {
  visible: boolean;
  currentTarget: number;
  onSelect: (target: number) => void;
  onClose: () => void;
}

export function TargetSheet({
  visible,
  currentTarget,
  onSelect,
  onClose,
}: TargetSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [customValue, setCustomValue] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelect = (target: number) => {
    onSelect(target);
    onClose();
  };

  const handleCustomSubmit = () => {
    const value = parseInt(customValue);
    if (value > 0) {
      handleSelect(value);
      setCustomValue("");
      setShowCustomInput(false);
    }
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
          styles.sheet,
          { 
            backgroundColor: theme.surfaceElevated,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: theme.text }]}>
            Set Target
          </ThemedText>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={24} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.targetsGrid}>
          {COMMON_TARGETS.map((target) => (
            <Pressable
              key={target}
              onPress={() => handleSelect(target)}
              style={({ pressed }) => [
                styles.targetButton,
                { 
                  backgroundColor: currentTarget === target 
                    ? `${theme.primary}15` 
                    : theme.backgroundSecondary,
                  borderColor: currentTarget === target 
                    ? theme.primary 
                    : theme.border,
                },
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}
            >
              <ThemedText
                style={[
                  styles.targetButtonText,
                  { color: currentTarget === target ? theme.primary : theme.text },
                ]}
              >
                {target}
              </ThemedText>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setShowCustomInput(true)}
            style={({ pressed }) => [
              styles.targetButton,
              { 
                backgroundColor: showCustomInput 
                  ? `${theme.primary}15` 
                  : theme.backgroundSecondary,
                borderColor: showCustomInput ? theme.primary : theme.border,
              },
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Feather 
              name="edit-2" 
              size={16} 
              color={showCustomInput ? theme.primary : theme.textSecondary} 
            />
          </Pressable>
        </View>

        {showCustomInput ? (
          <View style={styles.customInputContainer}>
            <TextInput
              style={[
                styles.customInput,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={customValue}
              onChangeText={setCustomValue}
              placeholder="Enter custom target"
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
              autoFocus
            />
            <Button 
              onPress={handleCustomSubmit}
              disabled={!customValue || parseInt(customValue) <= 0}
              style={styles.customButton}
            >
              Set
            </Button>
          </View>
        ) : null}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
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
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  targetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  targetButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    minWidth: 70,
    alignItems: "center",
  },
  targetButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  customInputContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  customInput: {
    flex: 1,
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  customButton: {
    width: 80,
  },
});
