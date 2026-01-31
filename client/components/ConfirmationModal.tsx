import React from "react";
import { View, StyleSheet, Pressable, Modal } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable>
          <Animated.View
            entering={SlideInDown.springify().damping(18)}
            exiting={SlideOutDown.duration(200)}
            style={[
              styles.container,
              { 
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.borderLight,
              },
              Shadows.large,
            ]}
          >
            <ThemedText style={[styles.title, { color: theme.text }]}>
              {title}
            </ThemedText>
            <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
              {message}
            </ThemedText>
            <View style={styles.buttons}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton, 
                  { backgroundColor: theme.backgroundSecondary },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={onCancel}
              >
                <ThemedText style={[styles.cancelText, { color: theme.text }]}>
                  {cancelText}
                </ThemedText>
              </Pressable>
              <Button
                onPress={onConfirm}
                style={[
                  styles.confirmButton,
                  confirmColor ? { backgroundColor: confirmColor } : null,
                ]}
              >
                {confirmText}
              </Button>
            </View>
          </Animated.View>
        </Pressable>
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
    width: 320,
    borderRadius: BorderRadius.xl,
    padding: Spacing["2xl"],
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: Spacing["2xl"],
    lineHeight: 22,
  },
  buttons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    height: 52,
  },
});
