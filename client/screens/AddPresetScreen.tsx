import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, PresetColors, Shadows } from "@/constants/theme";

const TARGET_OPTIONS = [33, 99, 100, 1000];

export default function AddPresetScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { addPreset } = useApp();

  const [name, setName] = useState("");
  const [arabicName, setArabicName] = useState("");
  const [target, setTarget] = useState(33);
  const [customTarget, setCustomTarget] = useState("");
  const [color, setColor] = useState(PresetColors[0]);
  const [showCustomTarget, setShowCustomTarget] = useState(false);

  const isValid = name.trim().length > 0 && (target > 0 || (showCustomTarget && parseInt(customTarget) > 0));

  const handleSave = () => {
    const finalTarget = showCustomTarget ? parseInt(customTarget) || 33 : target;
    addPreset({
      name: name.trim(),
      arabicName: arabicName.trim() || undefined,
      target: finalTarget,
      color,
    });
    navigation.goBack();
  };

  const handleTargetSelect = (value: number | "custom") => {
    if (value === "custom") {
      setShowCustomTarget(true);
    } else {
      setShowCustomTarget(false);
      setTarget(value);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing["2xl"],
        paddingHorizontal: Spacing.xl,
      }}
    >
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
        <ThemedText style={[styles.label, { color: theme.text }]}>Name</ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surfaceElevated,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          value={name}
          onChangeText={setName}
          placeholder="Enter preset name"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="words"
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.section}>
        <ThemedText style={[styles.label, { color: theme.text }]}>
          Arabic Name (Optional)
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surfaceElevated,
              color: theme.text,
              borderColor: theme.border,
              textAlign: "right",
            },
          ]}
          value={arabicName}
          onChangeText={setArabicName}
          placeholder="أدخل الاسم بالعربية"
          placeholderTextColor={theme.textMuted}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
        <ThemedText style={[styles.label, { color: theme.text }]}>Target</ThemedText>
        <View style={styles.targetGrid}>
          {TARGET_OPTIONS.map((option) => (
            <Pressable
              key={option}
              style={({ pressed }) => [
                styles.targetOption,
                { 
                  backgroundColor: !showCustomTarget && target === option 
                    ? `${theme.primary}12` 
                    : theme.surfaceElevated,
                  borderColor: !showCustomTarget && target === option 
                    ? theme.primary 
                    : theme.border,
                },
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => handleTargetSelect(option)}
            >
              <ThemedText
                style={[
                  styles.targetText,
                  { color: !showCustomTarget && target === option ? theme.primary : theme.text },
                ]}
              >
                {option}
              </ThemedText>
            </Pressable>
          ))}
          <Pressable
            style={({ pressed }) => [
              styles.targetOption,
              { 
                backgroundColor: showCustomTarget 
                  ? `${theme.primary}12` 
                  : theme.surfaceElevated,
                borderColor: showCustomTarget ? theme.primary : theme.border,
              },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => handleTargetSelect("custom")}
          >
            <Feather 
              name="edit-2" 
              size={16} 
              color={showCustomTarget ? theme.primary : theme.textSecondary} 
            />
          </Pressable>
        </View>
        {showCustomTarget ? (
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surfaceElevated,
                color: theme.text,
                borderColor: theme.border,
                marginTop: Spacing.md,
              },
            ]}
            value={customTarget}
            onChangeText={setCustomTarget}
            placeholder="Enter target number"
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
            autoFocus
          />
        ) : null}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.section}>
        <ThemedText style={[styles.label, { color: theme.text }]}>Color</ThemedText>
        <View style={styles.colorGrid}>
          {PresetColors.map((c) => (
            <Pressable
              key={c}
              style={[
                styles.colorOption,
                { backgroundColor: c },
                color === c && [styles.colorSelected, Shadows.colored(c)],
              ]}
              onPress={() => setColor(c)}
            >
              {color === c ? (
                <Feather name="check" size={20} color="#FFFFFF" />
              ) : null}
            </Pressable>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.buttonContainer}>
        <Button onPress={handleSave} disabled={!isValid}>
          Save Preset
        </Button>
      </Animated.View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  targetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  targetOption: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    minWidth: 70,
    alignItems: "center",
  },
  targetText: {
    fontSize: 16,
    fontWeight: "600",
  },
  colorGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  buttonContainer: {
    marginTop: Spacing.lg,
  },
});
