import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, PresetColors } from "@/constants/theme";

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
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View style={styles.section}>
        <ThemedText style={[styles.label, { color: theme.text }]}>Name</ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          value={name}
          onChangeText={setName}
          placeholder="Enter preset name"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.label, { color: theme.text }]}>
          Arabic Name (Optional)
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              color: theme.text,
              borderColor: theme.border,
              textAlign: "right",
            },
          ]}
          value={arabicName}
          onChangeText={setArabicName}
          placeholder="أدخل الاسم بالعربية"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.label, { color: theme.text }]}>Target</ThemedText>
        <View style={styles.targetGrid}>
          {TARGET_OPTIONS.map((option) => (
            <Pressable
              key={option}
              style={[
                styles.targetOption,
                { backgroundColor: theme.surface, borderColor: theme.border },
                !showCustomTarget && target === option && {
                  borderColor: theme.primary,
                  backgroundColor: theme.progressBackground,
                },
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
            style={[
              styles.targetOption,
              { backgroundColor: theme.surface, borderColor: theme.border },
              showCustomTarget && {
                borderColor: theme.primary,
                backgroundColor: theme.progressBackground,
              },
            ]}
            onPress={() => handleTargetSelect("custom")}
          >
            <ThemedText
              style={[
                styles.targetText,
                { color: showCustomTarget ? theme.primary : theme.text },
              ]}
            >
              Custom
            </ThemedText>
          </Pressable>
        </View>
        {showCustomTarget ? (
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
                marginTop: Spacing.md,
              },
            ]}
            value={customTarget}
            onChangeText={setCustomTarget}
            placeholder="Enter target number"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
          />
        ) : null}
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.label, { color: theme.text }]}>Color</ThemedText>
        <View style={styles.colorGrid}>
          {PresetColors.map((c) => (
            <Pressable
              key={c}
              style={[
                styles.colorOption,
                { backgroundColor: c },
                color === c && styles.colorSelected,
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button onPress={handleSave} disabled={!isValid}>
          Save Preset
        </Button>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.sm,
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  targetText: {
    fontSize: 15,
    fontWeight: "500",
  },
  colorGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
});
