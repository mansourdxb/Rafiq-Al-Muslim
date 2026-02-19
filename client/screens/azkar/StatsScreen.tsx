import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useApp } from "@/context/AppContext";
import adhkarData from "@/assets/data/adhkar.json";

/* ─── Colors ─── */
const HEADER_BG = "#1B4332";
const PAGE_BG = "#F3EEE4";
const CARD_BG = "#FFFFFF";
const PRIMARY = "#1C1714";
const SECONDARY = "#968C80";
const GREEN = "#2D7A4E";
const GOLD = "#D4AF37";
const GOLD_BG = "#F6F0E1";

const AR_TITLE: Record<string, string> = {
  "Allahu Akbar": "تكبير",
  SubhanAllah: "تسبيح",
  Alhamdulillah: "تحميد",
  "La ilaha illa Allah": "تهليل",
  Astaghfirullah: "استغفار",
};

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0
  );

  const { presets } = useApp();
  const [athkarCompleted, setAthkarCompleted] = useState(0);

  const totalCategories = (adhkarData as any[]).length;

  // Load athkar progress
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("athkar:categoryProgress")
        .then((val) => {
          if (val) {
            const map = JSON.parse(val);
            setAthkarCompleted(Object.values(map).filter(Boolean).length);
          }
        })
        .catch(() => {});
    }, [])
  );

  // Calculate tasbeeh stats
  const tasbeehStats = useMemo(() => {
    if (!presets || presets.length === 0) return { items: [], totalCount: 0, totalTarget: 0 };

    const items = presets.map((p: any) => ({
      name: p.arabicName || AR_TITLE[p.name] || p.name || "ذكر",
      count: p.count || 0,
      target: p.target || 33,
    }));

    const totalCount = items.reduce((sum: number, i: any) => sum + i.count, 0);
    const totalTarget = items.reduce((sum: number, i: any) => sum + i.target, 0);

    return { items, totalCount, totalTarget };
  }, [presets]);

  const maxBarValue = useMemo(() => {
    if (tasbeehStats.items.length === 0) return 1;
    return Math.max(...tasbeehStats.items.map((i: any) => i.count), 1);
  }, [tasbeehStats]);

  // Summary cards data
  const summaryCards = [
    {
      icon: "finger-print-outline" as const,
      label: "إجمالي التسبيح",
      value: tasbeehStats.totalCount,
      color: GREEN,
      bg: "#E8F5E9",
    },
    {
      icon: "book-outline" as const,
      label: "أبواب حصن المسلم",
      value: `${athkarCompleted} / ${totalCategories}`,
      color: GOLD,
      bg: GOLD_BG,
    },
    {
      icon: "list-outline" as const,
      label: "عدد الأذكار",
      value: tasbeehStats.items.length,
      color: "#4B8CFF",
      bg: "#E3F2FD",
    },
    {
      icon: "checkmark-done-outline" as const,
      label: "أذكار مكتملة",
      value: tasbeehStats.items.filter((i: any) => i.count >= i.target).length,
      color: GREEN,
      bg: "#E8F5E9",
    },
  ];

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <View style={s.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </Pressable>
          <Text style={s.headerTitle}>الإحصائيات</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Grid */}
        <View style={s.summaryGrid}>
          {summaryCards.map((card) => (
            <View key={card.label} style={s.summaryCard}>
              <View style={[s.summaryIcon, { backgroundColor: card.bg }]}>
                <Ionicons name={card.icon} size={22} color={card.color} />
              </View>
              <Text style={s.summaryValue}>{card.value}</Text>
              <Text style={s.summaryLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Tasbeeh Chart */}
        {tasbeehStats.items.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>إحصائيات المسبحة</Text>
            <Text style={s.cardSub}>التقدم في الأذكار</Text>

            <View style={s.chartArea}>
              {tasbeehStats.items.map((item: any, idx: number) => {
                const pct = maxBarValue > 0 ? item.count / maxBarValue : 0;
                const completed = item.count >= item.target;
                return (
                  <View key={idx} style={s.barRow}>
                    <Text style={s.barCount}>{item.count}</Text>
                    <View style={s.barTrack}>
                      <View
                        style={[
                          s.barFill,
                          {
                            width: `${Math.max(5, pct * 100)}%`,
                            backgroundColor: completed ? GREEN : GOLD,
                          },
                        ]}
                      />
                    </View>
                    <Text style={s.barLabel} numberOfLines={1}>{item.name}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Hisn Al Muslim Progress */}
        <View style={s.card}>
          <Text style={s.cardTitle}>حصن المسلم</Text>
          <Text style={s.cardSub}>تقدم القراءة</Text>

          <View style={s.hisnProgressWrap}>
            <View style={s.hisnBarOuter}>
              <View
                style={[
                  s.hisnBarFill,
                  { width: `${totalCategories > 0 ? (athkarCompleted / totalCategories) * 100 : 0}%` },
                ]}
              />
            </View>
            <View style={s.hisnStats}>
              <View style={s.hisnStat}>
                <Ionicons name="checkmark-circle" size={18} color={GREEN} />
                <Text style={s.hisnStatNum}>{athkarCompleted}</Text>
                <Text style={s.hisnStatLabel}>مكتمل</Text>
              </View>
              <View style={s.hisnStat}>
                <Ionicons name="ellipse-outline" size={18} color={SECONDARY} />
                <Text style={s.hisnStatNum}>{totalCategories - athkarCompleted}</Text>
                <Text style={s.hisnStatLabel}>متبقي</Text>
              </View>
              <View style={s.hisnStat}>
                <Ionicons name="library-outline" size={18} color={GOLD} />
                <Text style={s.hisnStatNum}>{totalCategories}</Text>
                <Text style={s.hisnStatLabel}>إجمالي</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={s.card}>
          <Text style={s.cardTitle}>الإنجازات</Text>

          <View style={s.achieveGrid}>
            {[
              {
                title: "أول تسبيح",
                icon: "star-outline" as const,
                done: tasbeehStats.totalCount > 0,
              },
              {
                title: "١٠٠ ذكر",
                icon: "ribbon-outline" as const,
                done: tasbeehStats.totalCount >= 100,
              },
              {
                title: "١٠٠٠ ذكر",
                icon: "trophy-outline" as const,
                done: tasbeehStats.totalCount >= 1000,
              },
              {
                title: "٥ أبواب",
                icon: "book-outline" as const,
                done: athkarCompleted >= 5,
              },
              {
                title: "١٠ أبواب",
                icon: "medal-outline" as const,
                done: athkarCompleted >= 10,
              },
              {
                title: "ختم الحصن",
                icon: "shield-checkmark-outline" as const,
                done: athkarCompleted >= totalCategories,
              },
            ].map((a) => (
              <View key={a.title} style={[s.achieveCard, a.done && s.achieveCardDone]}>
                <View style={[s.achieveIcon, a.done ? s.achieveIconDone : s.achieveIconLocked]}>
                  <Ionicons name={a.icon} size={22} color={a.done ? GREEN : SECONDARY} />
                </View>
                <Text style={[s.achieveTitle, a.done && s.achieveTitleDone]}>{a.title}</Text>
                {a.done ? (
                  <View style={s.achieveBadge}>
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                  </View>
                ) : (
                  <Ionicons name="lock-closed-outline" size={14} color="#C8B99A" style={{ marginTop: 4 }} />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },

  /* Header */
  header: {
    backgroundColor: HEADER_BG,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "CairoBold", fontSize: 22, color: "#FFF", textAlign: "center", flex: 1 },

  scroll: { paddingHorizontal: 14, paddingTop: 16 },

  /* Summary Grid */
  summaryGrid: {
    flexDirection: "row-reverse", flexWrap: "wrap",
    gap: 10, marginBottom: 16,
  },
  summaryCard: {
    width: "48%", flexGrow: 1,
    backgroundColor: CARD_BG,
    borderRadius: 18, padding: 16,
    alignItems: "center", gap: 6,
  },
  summaryIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  summaryValue: { fontFamily: "CairoBold", fontSize: 22, color: PRIMARY },
  summaryLabel: { fontFamily: "Cairo", fontSize: 12, color: SECONDARY, textAlign: "center" },

  /* Card */
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20, padding: 18,
    marginBottom: 14,
  },
  cardTitle: { fontFamily: "CairoBold", fontSize: 18, color: PRIMARY, textAlign: "right" },
  cardSub: { fontFamily: "Cairo", fontSize: 13, color: SECONDARY, textAlign: "right", marginTop: 2 },

  /* Horizontal bar chart */
  chartArea: { marginTop: 16, gap: 12 },
  barRow: {
    flexDirection: "row-reverse",
    alignItems: "center", gap: 10,
  },
  barLabel: { fontFamily: "Cairo", fontSize: 12, color: SECONDARY, width: 70, textAlign: "right" },
  barTrack: {
    flex: 1, height: 22, borderRadius: 11,
    backgroundColor: "#F0EBE0",
    overflow: "hidden",
  },
  barFill: { height: 22, borderRadius: 11 },
  barCount: { fontFamily: "CairoBold", fontSize: 13, color: PRIMARY, width: 40, textAlign: "center" },

  /* Hisn progress */
  hisnProgressWrap: { marginTop: 16, gap: 14 },
  hisnBarOuter: {
    height: 12, borderRadius: 6,
    backgroundColor: "#E8E3D9",
    overflow: "hidden",
  },
  hisnBarFill: { height: 12, borderRadius: 6, backgroundColor: GREEN },
  hisnStats: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
  },
  hisnStat: { alignItems: "center", gap: 4 },
  hisnStatNum: { fontFamily: "CairoBold", fontSize: 18, color: PRIMARY },
  hisnStatLabel: { fontFamily: "Cairo", fontSize: 11, color: SECONDARY },

  /* Achievements */
  achieveGrid: {
    flexDirection: "row-reverse", flexWrap: "wrap",
    gap: 10, marginTop: 14,
  },
  achieveCard: {
    width: "30%", flexGrow: 1,
    backgroundColor: "#F8F5ED",
    borderRadius: 16, padding: 12,
    alignItems: "center", gap: 4,
    borderWidth: 1.5, borderColor: "transparent",
  },
  achieveCardDone: {
    backgroundColor: "#EFF8F2",
    borderColor: GREEN,
  },
  achieveIcon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
  achieveIconDone: { backgroundColor: "#D9F0E3" },
  achieveIconLocked: { backgroundColor: "#EDE8DD" },
  achieveTitle: { fontFamily: "Cairo", fontSize: 11, color: SECONDARY, textAlign: "center" },
  achieveTitleDone: { color: GREEN, fontFamily: "CairoBold" },
  achieveBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: GREEN,
    alignItems: "center", justifyContent: "center",
    marginTop: 2,
  },
});
