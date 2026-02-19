import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { RECITER_OPTIONS, type ReciterKey } from "@/src/services/quranAudio";

const RECITER_STORAGE_KEY = "quran.reciterKey";
const DEFAULT_KEY = "Abdul_Basit_Murattal_192kbps";

export default function QuranReciterSettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string>(DEFAULT_KEY);
  const [query, setQuery] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(RECITER_STORAGE_KEY).then((v) => { if (v) setSelected(v); });
  }, []);

  const handleSelect = async (key: string) => {
    setSelected(key);
    await AsyncStorage.setItem(RECITER_STORAGE_KEY, key);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RECITER_OPTIONS;
    return RECITER_OPTIONS.filter((r) => r.label.toLowerCase().includes(q) || r.key.toLowerCase().includes(q));
  }, [query]);

  const selectedLabel = RECITER_OPTIONS.find((r) => r.key === selected)?.label ?? "";

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 4, backgroundColor: colors.headerBackground }]}>
        <View style={s.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.headerText} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.headerText }]}>القارئ</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <View style={s.currentWrap}>
        <View style={[s.currentIcon, { backgroundColor: colors.greenLight }]}>
          <Ionicons name="mic" size={22} color={colors.green} />
        </View>
        <Text style={[s.currentLabel, { color: colors.text }]}>{selectedLabel}</Text>
        <Text style={[s.currentSub, { color: colors.textSecondary }]}>القارئ الحالي</Text>
      </View>

      <View style={s.searchWrap}>
        <View style={[s.searchBox, { backgroundColor: colors.searchBg }]}>
          <TextInput value={query} onChangeText={setQuery} placeholder="ابحث عن قارئ..." placeholderTextColor={colors.textSecondary} style={[s.searchInput, { color: colors.text }]} />
          <Feather name="search" size={18} color={colors.textSecondary} />
        </View>
      </View>

      <Text style={[s.countText, { color: colors.textSecondary }]}>{filtered.length} قارئ</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const isSelected = item.key === selected;
          const isFirst = index === 0;
          const isLast = index === filtered.length - 1;
          return (
            <View style={[
              { backgroundColor: colors.cardBackground, overflow: "hidden" as const },
              isFirst && { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
              isLast && { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
            ]}>
              <Pressable style={s.row} onPress={() => handleSelect(item.key)}>
                <Ionicons name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={22} color={isSelected ? colors.green : colors.textSecondary} />
                <Text style={[s.reciterName, { color: isSelected ? colors.green : colors.text }]}>{item.label}</Text>
              </Pressable>
              {!isLast && <View style={[s.divider, { backgroundColor: colors.divider }]} />}
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "CairoBold", fontSize: 20, textAlign: "center", flex: 1 },
  currentWrap: { alignItems: "center", paddingVertical: 18, gap: 4 },
  currentIcon: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  currentLabel: { fontFamily: "CairoBold", fontSize: 18 },
  currentSub: { fontFamily: "Cairo", fontSize: 12 },
  searchWrap: { paddingHorizontal: 14, paddingBottom: 8 },
  searchBox: { flexDirection: "row-reverse", alignItems: "center", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontFamily: "Cairo", fontSize: 15, textAlign: "right", writingDirection: "rtl", paddingVertical: 0 },
  countText: { fontFamily: "Cairo", fontSize: 12, textAlign: "right", paddingHorizontal: 20, marginBottom: 6 },
  row: { flexDirection: "row-reverse", alignItems: "center", paddingVertical: 13, paddingHorizontal: 14, gap: 12 },
  reciterName: { flex: 1, fontFamily: "CairoBold", fontSize: 15, textAlign: "right" },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
});
