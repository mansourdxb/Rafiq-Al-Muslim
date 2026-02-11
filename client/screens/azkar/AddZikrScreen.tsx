import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { typography } from "@/theme/typography";

type CategoryKey = "general" | "morning" | "evening" | "tasbeeh" | "istighfar" | "custom";

const CATEGORIES: { key: CategoryKey; label: string; dashed?: boolean }[] = [
  { key: "general", label: "عام" },
  { key: "morning", label: "صباح" },
  { key: "evening", label: "مساء" },
  { key: "tasbeeh", label: "تسبيح" },
  { key: "istighfar", label: "استغفار" },
  { key: "custom", label: "مخصص +", dashed: true },
];

export default function AddZikrScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { addPreset } = useApp();
  const { isDarkMode } = useTheme();
  const { width } = useWindowDimensions();

  const maxW = 420;
  const contentWidth = Math.min(width, maxW);

  const pageBackground = isDarkMode ? "#0F1215" : "#F7F4EE";
  const inputBg = isDarkMode ? "#1B1E22" : "#F3F5F6";
  const chipBg = isDarkMode ? "#1C2A26" : "#E9F1EE";
  const gold = "#C79B3B";

  const [title, setTitle] = useState("");
  const [zikr, setZikr] = useState("");
  const [target, setTarget] = useState("33");
  const [category, setCategory] = useState<CategoryKey>("general");
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => {
    const t = parseInt(target, 10);
    return title.trim().length > 0 && Number.isFinite(t) && t > 0;
  }, [title, target]);

  const onSave = () => {
    const t = parseInt(target, 10);

    if (!title.trim()) return setError("أدخل العنوان");
    if (!Number.isFinite(t) || t <= 0) return setError("أدخل رقم صحيح للعدد");

    setError(null);

    addPreset({
      name: title.trim(),
      text: zikr.trim(),
      target: t,
      color: "#F1C56B",
    } as any);

    navigation.goBack();
  };

  return (
    <View style={[styles.root, { backgroundColor: pageBackground, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.85 }]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="إغلاق"
        >
          <Feather name="x" size={22} color="#F7F4EE" />
        </Pressable>
        <Text style={styles.headerTitle}>إضافة ذكر جديد</Text>
      </View>

      <View style={styles.centerWrap}>
        <View style={[styles.contentContainer, { width: contentWidth }]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              style={styles.sheet}
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.label}>عنوان الذكر</Text>
              <View style={[styles.inputRow, { backgroundColor: inputBg }]}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={"مثلا أذكار الصباح"}
                  placeholderTextColor="#9AA5A1"
                  style={[styles.input, styles.inputTitle]}
                  textAlign="right"
                  writingDirection="rtl"
                />
              </View>

              <Text style={styles.label}>نص الذكر</Text>
              <View style={[styles.inputRow, styles.textAreaRow, { backgroundColor: inputBg }]}>
                <TextInput
                  value={zikr}
                  onChangeText={setZikr}
                  placeholder={"أكتب نص الذكر هنا"}
                  placeholderTextColor="#9AA5A1"
                  style={[styles.input, styles.inputBody, styles.textArea]}
                  textAlign="right"
                  writingDirection="rtl"
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <Text style={styles.label}>العدد</Text>
              <View style={[styles.countRow, { backgroundColor: inputBg }]}>
                <Text style={styles.countSuffix}>مرة</Text>
                <TextInput
                  value={target}
                  onChangeText={setTarget}
                  keyboardType="number-pad"
                  style={styles.countInput}
                  textAlign="center"
                />
                <View style={styles.countSpacer} />
              </View>

              <View style={styles.sectionDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.sectionTitle}>الصنف</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.chipsWrap}>
                {CATEGORIES.map((c) => {
                  const active = c.key === category;
                  return (
                    <Pressable
                      key={c.key}
                      onPress={() => setCategory(c.key)}
                      style={({ pressed }) => [
                        styles.chip,
                        { backgroundColor: active ? gold : chipBg },
                        c.dashed ? styles.chipDashed : null,
                        pressed && { opacity: 0.9 },
                      ]}
                      accessibilityRole="button"
                      hitSlop={8}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {c.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                onPress={onSave}
                disabled={!canSave}
                style={({ pressed }) => [
                  styles.saveBtn,
                  !canSave && { opacity: 0.45 },
                  pressed && canSave && { opacity: 0.9 },
                ]}
              >
                <Text style={styles.saveText}>حفظ</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    backgroundColor: "#1F4B3B",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.itemTitle,
    color: "#F7F4EE",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  closeBtn: {
    position: "absolute",
    right: 18,
    top: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  label: {
    ...typography.itemSubtitle,
    fontSize: 13,
    fontWeight: "600",
    color: "#1B1F22",
    textAlign: "right",
    marginBottom: 8,
  },
  inputRow: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  input: {
    color: "#1B1F22",
    writingDirection: "rtl",
  },
  inputTitle: {
    ...typography.itemTitle,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "right",
  },
  inputBody: {
    ...typography.itemSubtitle,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  textAreaRow: {
    minHeight: 120,
  },
  textArea: {
    minHeight: 90,
  },
  countRow: {
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 18,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countInput: {
    ...typography.itemTitle,
    fontSize: 20,
    fontWeight: "800",
    color: "#1B1F22",
    flex: 1,
    textAlign: "center",
  },
  countSuffix: {
    ...typography.itemSubtitle,
    color: "#6B6F6E",
    fontSize: 13,
    fontWeight: "600",
    minWidth: 44,
    textAlign: "right",
  },
  countSpacer: {
    minWidth: 44,
  },
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E3DE",
  },
  sectionTitle: {
    ...typography.itemSubtitle,
    fontSize: 13,
    fontWeight: "600",
    color: "#1B1F22",
  },
  chipsWrap: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-start",
    marginBottom: 18,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  chipDashed: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C7D0C9",
    backgroundColor: "transparent",
  },
  chipText: {
    ...typography.itemSubtitle,
    fontSize: 13,
    fontWeight: "600",
    color: "#2E3A35",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  error: {
    color: "#D64545",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  saveBtn: {
    marginTop: 4,
    backgroundColor: "#C79B3B",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  saveText: {
    ...typography.itemTitle,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
