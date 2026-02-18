import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  StatusBar,
  Modal,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";

/* ─── Colors ─── */
const HEADER_BG = "#1B4332";
const PAGE_BG = "#F3EEE4";
const CARD_BG = "#FFFFFF";
const PRIMARY = "#1C1714";
const SECONDARY = "#968C80";
const GREEN = "#2D7A4E";
const DARK_GREEN = "#1B4332";
const GOLD = "#D4AF37";
const GOLD_BG = "#F6F0E1";

/* ─── Categories ─── */
const MAIN_CATEGORIES = [
  { title: "أذكار الصباح", icon: "sunny-outline", bg: "#FFF3E0", color: "#F4A340" },
  { title: "أذكار المساء", icon: "moon-outline", bg: "#E8EAF6", color: "#5C6CFA" },
  { title: "أذكار الصلاة", icon: "home-outline", bg: "#E8F5E9", color: "#26A46D" },
  { title: "أذكار النوم", icon: "cloud-outline", bg: "#E3F2FD", color: "#4B8CFF" },
];

const MORE_CATEGORIES = [
  { title: "أذكار الاستيقاظ", icon: "alarm-outline", bg: "#FFF8E1", color: "#F9A825" },
  { title: "أذكار الطعام", icon: "restaurant-outline", bg: "#FBE9E7", color: "#E64A19" },
  { title: "أذكار السفر", icon: "airplane-outline", bg: "#E0F7FA", color: "#0097A7" },
  { title: "أذكار دخول المنزل", icon: "home-outline", bg: "#F3E5F5", color: "#8E24AA" },
  { title: "أذكار دخول المسجد", icon: "star-outline", bg: "#E8F5E9", color: "#388E3C" },
  { title: "أذكار الوضوء", icon: "water-outline", bg: "#E1F5FE", color: "#0288D1" },
  { title: "أدعية متنوعة", icon: "heart-outline", bg: "#FCE4EC", color: "#C62828" },
  { title: "أذكار المطر", icon: "rainy-outline", bg: "#E0F2F1", color: "#00897B" },
];

/* ─── Daily Dhikr ─── */
const DAILY_ADHKAR = [
  { text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", count: 100, reward: "حُطَّت خطاياه وإن كانت مثل زَبَد البحر" },
  { text: "لَا إِلٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ", count: 100, reward: "كانت له عِدل عشر رقاب" },
  { text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ", count: 0, reward: "ثقيلتان في الميزان حبيبتان إلى الرحمن" },
  { text: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", count: 0, reward: "كنزٌ من كنوز الجنة" },
];

/* ─── Notification Settings ─── */
type ReminderKey = "morning" | "evening" | "sleep" | "prayer";
const REMINDER_OPTIONS: { key: ReminderKey; label: string; time: string; icon: string }[] = [
  { key: "morning", label: "أذكار الصباح", time: "بعد صلاة الفجر", icon: "sunny-outline" },
  { key: "evening", label: "أذكار المساء", time: "بعد صلاة العصر", icon: "moon-outline" },
  { key: "sleep", label: "أذكار النوم", time: "10:30 مساءً", icon: "cloud-outline" },
  { key: "prayer", label: "أذكار الصلاة", time: "بعد كل صلاة", icon: "home-outline" },
];

export default function MainZikrScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const topInset = Math.max(insets.top, Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0);

  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [reminders, setReminders] = useState<Record<ReminderKey, boolean>>({
    morning: true, evening: true, sleep: false, prayer: false,
  });

  /* ─── حصن المسلم progress ─── */
  const progress = 0.5;
  const ring = useMemo(() => {
    const size = 42;
    const stroke = 5;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = c * progress;
    return { size, stroke, r, c, dash };
  }, [progress]);

  /* ─── Daily dhikr index ─── */
  const todayIndex = useMemo(() => new Date().getDate() % DAILY_ADHKAR.length, []);
  const todayDhikr = DAILY_ADHKAR[todayIndex];

  /* ─── Navigation ─── */
  const navigateAthkar = useCallback((screen: string, params?: Record<string, any>) => {
    const nestedParams = { screen, params };
    let parent: any = navigation;
    while (parent) {
      const routeNames = parent.getState?.().routeNames ?? [];
      if (routeNames.includes("Main")) {
        parent.navigate("Main", { screen: "AthkarTab", params: nestedParams });
        return;
      }
      parent = parent.getParent?.();
    }
    const routes = navigation.getState?.().routeNames ?? [];
    if (routes.includes("AthkarTab")) {
      navigation.navigate("AthkarTab", nestedParams);
      return;
    }
    navigation.navigate(screen, params);
  }, [navigation]);

  const openPresets = () => navigateAthkar("Presets");
  const openHisnIndex = () => navigateAthkar("HisnAlMuslim");
  const openStats = () => navigateAthkar("Stats");
  const openHisnCategory = (title: string) => navigateAthkar("HisnCategory", { categoryTitle: title });

  const onCategoryPress = useCallback((title: string) => {
    if (title === "أذكار الصباح" || title === "أذكار المساء") {
      openHisnCategory("أذكار الصباح والمساء");
    } else if (title === "أذكار النوم" || title === "أذكار الاستيقاظ") {
      openHisnCategory("أذكار النوم");
    } else if (title === "أذكار الصلاة") {
      openHisnCategory("الأذكار بعد السلام من الصلاة");
    } else if (title === "أذكار الطعام") {
      openHisnCategory("الدعاء قبل الطعام");
    } else if (title === "أذكار السفر") {
      openHisnCategory("دعاء السفر");
    } else if (title === "أذكار دخول المنزل") {
      openHisnCategory("دعاء دخول المنزل");
    } else if (title === "أذكار دخول المسجد") {
      openHisnCategory("دعاء دخول المسجد");
    } else if (title === "أذكار الوضوء") {
      openHisnCategory("الذكر بعد الوضوء");
    } else if (title === "أدعية متنوعة") {
      openHisnIndex();
    } else if (title === "أذكار المطر") {
      openHisnCategory("الدعاء إذا نزل المطر");
    }
  }, []);

  const toggleReminder = (key: ReminderKey) => {
    setReminders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={[s.header, { paddingTop: topInset + 12 }]}>
          <View style={s.headerRow}>
            <Pressable style={s.headerIconBtn} hitSlop={10} onPress={() => setShowReminders(true)}>
              <Ionicons name="notifications-outline" size={20} color="#E9E3D4" />
            </Pressable>
            <Text style={s.headerTitle}>الأذكار</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        {/* ── Daily Dhikr Featured Card ── */}
        <View style={s.dailyCard}>
          <View style={s.dailyBadge}>
            <Ionicons name="sparkles" size={14} color={GOLD} />
            <Text style={s.dailyBadgeText}>ذكر اليوم</Text>
          </View>
          <Text style={s.dailyText}>{todayDhikr.text}</Text>
          <View style={s.dailyDivider} />
          <Text style={s.dailyReward}>{todayDhikr.reward}</Text>
          {todayDhikr.count > 0 && (
            <View style={s.dailyCountRow}>
              <Ionicons name="repeat-outline" size={14} color={GREEN} />
              <Text style={s.dailyCountText}>{todayDhikr.count} مرة</Text>
            </View>
          )}
        </View>

        {/* ── حصن المسلم Compact ── */}
        <Pressable style={s.hisnCard} onPress={openHisnIndex}>
          <View style={s.hisnLeft}>
            <Svg width={ring.size} height={ring.size}>
              <Circle cx={ring.size / 2} cy={ring.size / 2} r={ring.r} stroke="#EFE7D4" strokeWidth={ring.stroke} fill="none" />
              <Circle cx={ring.size / 2} cy={ring.size / 2} r={ring.r} stroke={GOLD} strokeWidth={ring.stroke} fill="none"
                strokeLinecap="round" strokeDasharray={`${ring.dash} ${ring.c - ring.dash}`}
                rotation={-90} originX={ring.size / 2} originY={ring.size / 2} />
            </Svg>
            <Text style={s.hisnPct}>50%</Text>
          </View>
          <View style={s.hisnRight}>
            <Text style={s.hisnTitle}>حصن المسلم</Text>
            <Text style={s.hisnSub}>تم إنجاز 12 من 33</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#C8B99A" />
        </Pressable>

        {/* ── Main Categories ── */}
        <Text style={s.sectionTitle}>الأذكار اليومية</Text>
        <View style={s.catGrid}>
          {MAIN_CATEGORIES.map((cat) => (
            <Pressable key={cat.title} style={s.catCard} onPress={() => onCategoryPress(cat.title)}>
              <View style={[s.catIcon, { backgroundColor: cat.bg }]}>
                <Ionicons name={cat.icon as any} size={22} color={cat.color} />
              </View>
              <Text style={s.catTitle}>{cat.title}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── More Categories ── */}
        <Pressable style={s.moreCatToggle} onPress={() => setShowAllCategories(!showAllCategories)}>
          <Ionicons name={showAllCategories ? "chevron-up" : "chevron-down"} size={16} color={GREEN} />
          <Text style={s.moreCatText}>{showAllCategories ? "إخفاء" : "المزيد من الأذكار"}</Text>
        </Pressable>

        {showAllCategories && (
          <View style={s.catGrid}>
            {MORE_CATEGORIES.map((cat) => (
              <Pressable key={cat.title} style={s.catCard} onPress={() => onCategoryPress(cat.title)}>
                <View style={[s.catIcon, { backgroundColor: cat.bg }]}>
                  <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                </View>
                <Text style={s.catTitle}>{cat.title}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Tasbeeh Card ── */}
        <View style={s.tasbeehCard}>
          <View style={s.tasbeehRow}>
            <View style={s.tasbeehInfo}>
              <Text style={s.tasbeehLabel}>المسبحة الإلكترونية</Text>
              <Text style={s.tasbeehDhikr}>سبحان الله وبحمده</Text>
            </View>
            <View style={s.tasbeehCounter}>
              <Text style={s.tasbeehNumber}>128</Text>
              <Text style={s.tasbeehCountLabel}>عدد</Text>
            </View>
          </View>
          <View style={s.tasbeehProgress}>
            <View style={s.tasbeehBar}>
              <View style={[s.tasbeehBarFill, { width: "38%" }]} />
            </View>
            <Text style={s.tasbeehProgressText}>128 / 333</Text>
          </View>
          <Pressable style={s.tasbeehBtn} onPress={openPresets}>
            <Text style={s.tasbeehBtnText}>متابعة التسبيح</Text>
            <Ionicons name="chevron-back" size={16} color={DARK_GREEN} />
          </Pressable>
        </View>

        {/* ── Quick Actions ── */}
        <Text style={s.sectionTitle}>اختصارات</Text>
        <View style={s.quickGrid}>
          <Pressable style={s.quickCard} onPress={openPresets}>
            <View style={s.quickIcon}>
              <Ionicons name="finger-print-outline" size={24} color={GOLD} />
            </View>
            <Text style={s.quickLabel}>المسبحة</Text>
          </Pressable>
          <Pressable style={s.quickCard} onPress={openHisnIndex}>
            <View style={s.quickIcon}>
              <Ionicons name="book-outline" size={24} color={GOLD} />
            </View>
            <Text style={s.quickLabel}>حصن المسلم</Text>
          </Pressable>
          <Pressable style={s.quickCard} onPress={() => navigateAthkar("Calendar")}>
            <View style={s.quickIcon}>
              <Ionicons name="calendar-outline" size={24} color={GOLD} />
            </View>
            <Text style={s.quickLabel}>التقويم</Text>
          </Pressable>
          <Pressable style={s.quickCard} onPress={openStats}>
            <View style={s.quickIcon}>
              <Ionicons name="stats-chart-outline" size={24} color={GOLD} />
            </View>
            <Text style={s.quickLabel}>الإحصائيات</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Reminder Settings Modal ── */}
      <Modal visible={showReminders} transparent animationType="slide" onRequestClose={() => setShowReminders(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            {/* Handle */}
            <View style={s.modalHandle} />

            <Text style={s.modalTitle}>تنبيهات الأذكار</Text>
            <Text style={s.modalDesc}>اختر الأذكار التي تريد التذكير بها</Text>

            {REMINDER_OPTIONS.map((opt) => (
              <View key={opt.key} style={s.reminderRow}>
                <Switch
                  value={reminders[opt.key]}
                  onValueChange={() => toggleReminder(opt.key)}
                  trackColor={{ false: "#E5E0D6", true: "#A8D5BA" }}
                  thumbColor={reminders[opt.key] ? GREEN : "#FFF"}
                />
                <View style={s.reminderInfo}>
                  <Text style={s.reminderLabel}>{opt.label}</Text>
                  <Text style={s.reminderTime}>{opt.time}</Text>
                </View>
                <View style={s.reminderIcon}>
                  <Ionicons name={opt.icon as any} size={20} color={GREEN} />
                </View>
              </View>
            ))}

            <Pressable style={s.modalCloseBtn} onPress={() => setShowReminders(false)}>
              <Text style={s.modalCloseBtnText}>حفظ</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },
  scroll: { paddingHorizontal: 16 },

  /* Header */
  header: {
    backgroundColor: HEADER_BG,
    paddingBottom: 20,
    paddingHorizontal: 16,
    marginHorizontal: -16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontFamily: "CairoBold", fontSize: 22, color: "#FFF", textAlign: "center", flex: 1 },

  /* Daily Dhikr */
  dailyCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: GOLD,
  },
  dailyBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  dailyBadgeText: { fontFamily: "CairoBold", fontSize: 12, color: GOLD },
  dailyText: {
    fontFamily: "CairoBold", fontSize: 20, color: PRIMARY,
    textAlign: "center", lineHeight: 36, writingDirection: "rtl",
  },
  dailyDivider: {
    height: 1, backgroundColor: "#F0ECE3",
    marginVertical: 12, marginHorizontal: 20,
  },
  dailyReward: {
    fontFamily: "Cairo", fontSize: 13, color: GREEN,
    textAlign: "center", lineHeight: 22,
  },
  dailyCountRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, marginTop: 8,
  },
  dailyCountText: { fontFamily: "Cairo", fontSize: 12, color: SECONDARY },

  /* Hisn Compact */
  hisnCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  hisnLeft: { alignItems: "center", justifyContent: "center", marginLeft: 14 },
  hisnPct: {
    position: "absolute", fontFamily: "CairoBold", fontSize: 10, color: GOLD,
  },
  hisnRight: { flex: 1, alignItems: "flex-end", gap: 2 },
  hisnTitle: { fontFamily: "CairoBold", fontSize: 16, color: PRIMARY },
  hisnSub: { fontFamily: "Cairo", fontSize: 12, color: SECONDARY },

  /* Section Title */
  sectionTitle: {
    fontFamily: "CairoBold", fontSize: 18, color: PRIMARY,
    textAlign: "right", marginTop: 20, marginBottom: 10, paddingHorizontal: 4,
  },

  /* Category Grid */
  catGrid: {
    flexDirection: "row-reverse", flexWrap: "wrap",
    justifyContent: "space-between",
  },
  catCard: {
    width: "48%",
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 10,
  },
  catIcon: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  catTitle: { fontFamily: "CairoBold", fontSize: 14, color: PRIMARY },

  /* More categories toggle */
  moreCatToggle: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 8, marginBottom: 4,
  },
  moreCatText: { fontFamily: "Cairo", fontSize: 13, color: GREEN },

  /* Tasbeeh Card */
  tasbeehCard: {
    backgroundColor: DARK_GREEN,
    borderRadius: 20,
    padding: 18,
    marginTop: 4,
    overflow: "hidden",
  },
  tasbeehRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  tasbeehInfo: { flex: 1, alignItems: "flex-end", gap: 2 },
  tasbeehLabel: { fontFamily: "CairoBold", fontSize: 17, color: "#FFF" },
  tasbeehDhikr: { fontFamily: "Cairo", fontSize: 13, color: "#D6DED7" },
  tasbeehCounter: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(212,175,55,0.4)",
  },
  tasbeehNumber: { fontFamily: "CairoBold", fontSize: 24, color: "#FFF", marginTop: 2 },
  tasbeehCountLabel: { fontFamily: "Cairo", fontSize: 10, color: "#D6DED7", marginTop: -4 },
  tasbeehProgress: {
    flexDirection: "row-reverse", alignItems: "center",
    gap: 10, marginTop: 16,
  },
  tasbeehBar: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  tasbeehBarFill: {
    height: 6, borderRadius: 3, backgroundColor: GOLD,
  },
  tasbeehProgressText: {
    fontFamily: "Cairo", fontSize: 11, color: "#D6DED7",
  },
  tasbeehBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: 14,
    backgroundColor: GOLD, borderRadius: 14,
    paddingVertical: 10,
  },
  tasbeehBtnText: { fontFamily: "CairoBold", fontSize: 14, color: DARK_GREEN },

  /* Quick Actions */
  quickGrid: {
    flexDirection: "row-reverse", justifyContent: "space-between",
  },
  quickCard: {
    width: "23%",
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
  },
  quickIcon: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: GOLD_BG,
    alignItems: "center", justifyContent: "center",
  },
  quickLabel: { fontFamily: "Cairo", fontSize: 11, color: PRIMARY, textAlign: "center" },

  /* Modal */
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#E5E0D6", alignSelf: "center", marginBottom: 16,
  },
  modalTitle: {
    fontFamily: "CairoBold", fontSize: 20, color: PRIMARY,
    textAlign: "center", marginBottom: 4,
  },
  modalDesc: {
    fontFamily: "Cairo", fontSize: 13, color: SECONDARY,
    textAlign: "center", marginBottom: 20,
  },
  reminderRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F0ECE3",
  },
  reminderInfo: { flex: 1, alignItems: "flex-end", marginHorizontal: 12, gap: 2 },
  reminderLabel: { fontFamily: "CairoBold", fontSize: 15, color: PRIMARY },
  reminderTime: { fontFamily: "Cairo", fontSize: 12, color: SECONDARY },
  reminderIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(45,122,78,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  modalCloseBtn: {
    backgroundColor: DARK_GREEN, borderRadius: 14,
    paddingVertical: 12, alignItems: "center",
    marginTop: 20,
  },
  modalCloseBtnText: { fontFamily: "CairoBold", fontSize: 15, color: "#FFF" },
});
