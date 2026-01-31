import React from "react";
import { View, StyleSheet, Pressable, Modal } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
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
            entering={SlideInDown.springify().damping(15)}
            exiting={SlideOutDown.duration(200)}
            style={[
              styles.container,
              { backgroundColor: theme.surface },
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
                style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
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
    width: 300,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  buttons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButton: {
    flex: 1,
    height: 48,
  },
});
