import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { SettingsScreen, SettingsSection } from "./SettingsUI";

const FONT_SIZE_KEY = "@quran_font_size";
const SAMPLE_AYAH = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿٢﴾";
const MIN_SIZE = 16;
const MAX_SIZE = 36;

export default function QuranFontSettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [fontSize, setFontSize] = useState(22);

  useEffect(() => {
    AsyncStorage.getItem(FONT_SIZE_KEY).then((v) => { if (v) setFontSize(Number(v)); });
  }, []);

  const changeFontSize = (delta: number) => {
    const next = Math.max(MIN_SIZE, Math.min(MAX_SIZE, fontSize + delta));
    setFontSize(next);
    AsyncStorage.setItem(FONT_SIZE_KEY, String(next));
  };

  return (
    <SettingsScreen title="خط المصحف" onBack={() => navigation.goBack()} insetTop={insets.top} bottomPadding={insets.bottom}>
      <View style={[s.preview, { backgroundColor: colors.cardBackground }]}>
        <Text style={[s.previewLabel, { color: colors.textSecondary }]}>معاينة</Text>
        <Text style={[s.previewText, { fontSize, lineHeight: fontSize * 1.8, color: colors.text }]}>{SAMPLE_AYAH}</Text>
      </View>

      <SettingsSection title="حجم الخط">
        <View style={s.sizeRow}>
          <Pressable style={[s.sizeBtn, { backgroundColor: colors.greenLight }, fontSize >= MAX_SIZE && { opacity: 0.4 }]} onPress={() => changeFontSize(2)} disabled={fontSize >= MAX_SIZE}>
            <Ionicons name="add" size={22} color={colors.green} />
          </Pressable>
          <View style={s.sizeCenter}>
            <Text style={[s.sizeValue, { color: colors.green }]}>{fontSize}</Text>
            <Text style={[s.sizeLabel, { color: colors.textSecondary }]}>نقطة</Text>
          </View>
          <Pressable style={[s.sizeBtn, { backgroundColor: colors.greenLight }, fontSize <= MIN_SIZE && { opacity: 0.4 }]} onPress={() => changeFontSize(-2)} disabled={fontSize <= MIN_SIZE}>
            <Ionicons name="remove" size={22} color={colors.green} />
          </Pressable>
        </View>
        <View style={s.barWrap}>
          <Text style={[s.barLabel, { color: colors.textSecondary }]}>صغير</Text>
          <View style={[s.barTrack, { backgroundColor: colors.divider }]}>
            <View style={[s.barFill, { backgroundColor: colors.green, width: `${((fontSize - MIN_SIZE) / (MAX_SIZE - MIN_SIZE)) * 100}%` }]} />
          </View>
          <Text style={[s.barLabel, { color: colors.textSecondary }]}>كبير</Text>
        </View>
      </SettingsSection>

      <SettingsSection title="أحجام سريعة">
        <View style={s.quickRow}>
          {[18, 22, 26, 30, 34].map((size) => (
            <Pressable key={size} style={[s.quickBtn, { backgroundColor: fontSize === size ? colors.green : colors.iconBg }]} onPress={() => { setFontSize(size); AsyncStorage.setItem(FONT_SIZE_KEY, String(size)); }}>
              <Text style={[s.quickText, { color: fontSize === size ? "#FFF" : colors.text }]}>{size}</Text>
            </Pressable>
          ))}
        </View>
      </SettingsSection>
    </SettingsScreen>
  );
}

const s = StyleSheet.create({
  preview: { marginHorizontal: 14, marginTop: 16, borderRadius: 16, padding: 20 },
  previewLabel: { fontFamily: "Cairo", fontSize: 12, textAlign: "center", marginBottom: 10 },
  previewText: { fontFamily: "Cairo", textAlign: "center" },
  sizeRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, paddingHorizontal: 14, gap: 24 },
  sizeBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  sizeCenter: { alignItems: "center", gap: 2 },
  sizeValue: { fontFamily: "CairoBold", fontSize: 28 },
  sizeLabel: { fontFamily: "Cairo", fontSize: 11 },
  barWrap: { flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  barLabel: { fontFamily: "Cairo", fontSize: 11 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  quickRow: { flexDirection: "row-reverse", justifyContent: "center", paddingVertical: 14, paddingHorizontal: 14, gap: 10 },
  quickBtn: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  quickText: { fontFamily: "CairoBold", fontSize: 15 },
});
