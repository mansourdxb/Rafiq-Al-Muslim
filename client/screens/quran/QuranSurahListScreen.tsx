import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { SURAH_META } from "@/constants/quran/surahMeta";
import { getPageForAyah } from "@/src/lib/quran/mushaf";
import { loadMarks, type AyahMark } from "@/src/lib/quran/ayahMarks";
import { getRub3Index, type Rub3Item } from "@/src/lib/quran/rub3Index";
import { quranTheme } from "@/ui/quran/theme";
import type { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type TabKey = "index" | "khatma" | "quarters" | "highlights";
type LastRead = { surahNumber: number; ayahNumber: number; page?: number; updatedAt?: string };
type KhatmaData = {
  id: string; typeId: string; startDate: string; targetDays: number;
  quartersPerWird: number; completedWirds: number[];
  completed: boolean; completedDate?: string;
};
type KhatmaType = { id: string; days: number; label: string; wirdLabel: string; quartersPerWird: number };
type WirdInfo = {
  index: number; startSurah: string; startAyah: number; startSurahNum: number;
  endSurah: string; endAyah: number; endSurahNum: number; startPage: number; endPage: number;
};

const LAST_READ_KEY = "quran:lastRead";
const KHATMA_KEY = "quran:khatma";
const KHATMA_HISTORY_KEY = "quran:khatmaHistory";
const TOTAL_PAGES = 604;
const BOOKMARK_COLORS = ["#F08B7E", "#D9B871", "#7BBF94", "#5B7DBE"];
const BOOKMARK_COLOR_NAMES: Record<string, string> = { "#7BBF94": "\u0627\u0644\u0623\u062e\u0636\u0631", "#D9B871": "\u0627\u0644\u0623\u0635\u0641\u0631", "#F08B7E": "\u0627\u0644\u0623\u062d\u0645\u0631", "#5B7DBE": "\u0627\u0644\u0623\u0632\u0631\u0642" };
const AR_DAY_NAMES = ["\u0627\u0644\u0623\u062d\u062f", "\u0627\u0644\u0627\u062b\u0646\u064a\u0646", "\u0627\u0644\u062b\u0644\u0627\u062b\u0627\u0621", "\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621", "\u0627\u0644\u062e\u0645\u064a\u0633", "\u0627\u0644\u062c\u0645\u0639\u0629", "\u0627\u0644\u0633\u0628\u062a"];
const JUZ_INDEX = Array.from({ length: 30 }, (_, i) => i + 1);
const mushafJuz: { index: number; sura: number; aya: number }[] = require("../../data/Quran/mushaf-juz.json");
const AR_JUZ_ORDINAL = [
  "", "\u0627\u0644\u0623\u0648\u0644", "\u0627\u0644\u062b\u0627\u0646\u064a", "\u0627\u0644\u062b\u0627\u0644\u062b",
  "\u0627\u0644\u0631\u0627\u0628\u0639", "\u0627\u0644\u062e\u0627\u0645\u0633", "\u0627\u0644\u0633\u0627\u062f\u0633",
  "\u0627\u0644\u0633\u0627\u0628\u0639", "\u0627\u0644\u062b\u0627\u0645\u0646", "\u0627\u0644\u062a\u0627\u0633\u0639",
  "\u0627\u0644\u0639\u0627\u0634\u0631",
  "\u0627\u0644\u062d\u0627\u062f\u064a \u0639\u0634\u0631", "\u0627\u0644\u062b\u0627\u0646\u064a \u0639\u0634\u0631",
  "\u0627\u0644\u062b\u0627\u0644\u062b \u0639\u0634\u0631", "\u0627\u0644\u0631\u0627\u0628\u0639 \u0639\u0634\u0631",
  "\u0627\u0644\u062e\u0627\u0645\u0633 \u0639\u0634\u0631", "\u0627\u0644\u0633\u0627\u062f\u0633 \u0639\u0634\u0631",
  "\u0627\u0644\u0633\u0627\u0628\u0639 \u0639\u0634\u0631", "\u0627\u0644\u062b\u0627\u0645\u0646 \u0639\u0634\u0631",
  "\u0627\u0644\u062a\u0627\u0633\u0639 \u0639\u0634\u0631", "\u0627\u0644\u0639\u0634\u0631\u0648\u0646",
  "\u0627\u0644\u062d\u0627\u062f\u064a \u0648\u0627\u0644\u0639\u0634\u0631\u0648\u0646",
  "\u0627\u0644\u062b\u0627\u0646\u064a \u0648\u0627\u0644\u0639\u0634\u0631\u0648\u0646",
  "\u0627\u0644\u062b\u0627\u0644\u062b \u0648\u0627\u0644\u0639\u0634\u0631\u0648\u0646",
  "\u0627\u0644\u0631\u0627\u0628\u0639 \u0648\u0627\u0644\u0639\u0634\u0631\u0648\u0646",
  "\u0627\u0644\u062e\u0627\u0645\u0633 \u0648\u0627\u0644\u0639\u0634\u0631\u0648\u0646",
  "\u0627\u0644\u0633\u0627\u062f\u0633 \u0648\u0627\u0644\u0639\u0634\u0631\u0648\u0646",
  "\u0627\u0644\u0633\u0627\u0628\u0639 \u0648\u0627\u0644\u0639\u0634\u0631\u0648\u0646",
  "\u0627\u0644\u062b\u0627\u0645\u0646 \u0648\u0627\u0644\u0639\u0634\u0631\u0648\u0646",
  "\u0627\u0644\u062a\u0627\u0633\u0639 \u0648\u0627\u0644\u0639\u0634\u0631\u0648\u0646",
  "\u0627\u0644\u062b\u0644\u0627\u062b\u0648\u0646",
];

const juzTitle = (j: number) => `\u0627\u0644\u062c\u0632\u0621 ${AR_JUZ_ORDINAL[j] ?? j}`;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function QuranSurahListScreen() {
  const navigation = useNavigation<CompositeNavigationProp<NativeStackNavigationProp<LibraryStackParamList>, NativeStackNavigationProp<RootStackParamList>>>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const baseWidth = Math.min(width, 430);
  const scale = clamp(baseWidth / 390, 0.82, 1.1);
  const fs = useCallback((n: number) => Math.round(clamp(n * scale, n * 0.85, n * 1.05)), [scale]);
  const styles = useMemo(() => createStyles(fs), [fs]);

  const [activeTab, setActiveTab] = useState<TabKey>("index");
  const [activeJuz, setActiveJuz] = useState(1);
  const [rub3ActiveJuz, setRub3ActiveJuz] = useState(1);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [khatma, setKhatma] = useState<KhatmaData | null>(null);
  const [khatmaHistory, setKhatmaHistory] = useState<KhatmaData[]>([]);
  const [khatmaStep, setKhatmaStep] = useState<"active" | "types" | "confirm">("active");
  const [selectedKhatmaType, setSelectedKhatmaType] = useState<KhatmaType | null>(null);
  const [showAllWirds, setShowAllWirds] = useState(false);
  const [marks, setMarks] = useState<Record<string, AyahMark>>({});
  const [activeHighlightFilter, setActiveHighlightFilter] = useState<string | null>(null);
  const sectionListRef = useRef<SectionList<(typeof SURAH_META)[number]>>(null);
  const rub3ListRef = useRef<SectionList<Rub3Item>>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LAST_READ_KEY);
        if (!active) return;
        if (raw) setLastRead(JSON.parse(raw) as LastRead);
        const kRaw = await AsyncStorage.getItem(KHATMA_KEY);
        if (!active) return;
        if (kRaw) {
          const p = JSON.parse(kRaw) as any;
          if (!p.completedWirds) p.completedWirds = [];
          if (!p.quartersPerWird) p.quartersPerWird = 8;
          if (!p.typeId) p.typeId = "juz30";
          setKhatma(p as KhatmaData);
        }
        const hRaw = await AsyncStorage.getItem(KHATMA_HISTORY_KEY);
        if (!active) return;
        if (hRaw) setKhatmaHistory(JSON.parse(hRaw) as KhatmaData[]);
        const lm = await loadMarks();
        if (!active) return;
        setMarks(lm);
      } catch {}
    })();
    return () => { active = false; };
  }, []);

  useFocusEffect(useCallback(() => {
    (async () => { try { setMarks(await loadMarks()); } catch {} })();
  }, []));

  const openSurah = (sura: number, aya = 1, page?: number, source = "manual") => {
    const pageNo = source === "rub3" ? getPageForAyah(sura, aya) : (page ?? getPageForAyah(sura, aya));
    navigation.navigate("QuranReader", { sura, aya, page: pageNo, source, navToken: Date.now() });
  };

  const toArabicDigits = (n: number | string) =>
    String(n).replace(/\d/g, (d) => "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669"[Number(d)] ?? d);

  const juzStartPages = useMemo(() => mushafJuz.map((j) => ({ index: j.index, page: getPageForAyah(j.sura, j.aya) })).sort((a, b) => a.page - b.page), []);
  const getJuzForPage = useCallback((page: number) => { let c = 1; for (const j of juzStartPages) { if (page >= j.page) c = j.index; else break; } return c; }, [juzStartPages]);
  const surahItems = useMemo(() => SURAH_META.map((s) => { const sp = getPageForAyah(s.number, 1); return { ...s, startPage: sp, startJuz: getJuzForPage(sp) }; }), [getJuzForPage]);
  const surahSections = useMemo(() => {
    const map = new Map<number, (typeof surahItems)[number][]>();
    surahItems.forEach((s) => { const j = s.startJuz ?? 1; if (!map.has(j)) map.set(j, []); map.get(j)!.push(s); });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([juz, data]) => ({ juz, title: juzTitle(juz), data }));
  }, [surahItems]);

  const rub3Items = useMemo(() => getRub3Index(), []);
  const rub3Sections = useMemo(() => {
    const map = new Map<number, Rub3Item[]>();
    rub3Items.forEach((item) => { const j = item.juz ?? 1; if (!map.has(j)) map.set(j, []); map.get(j)!.push(item); });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([juz, data]) => ({ juz, title: juzTitle(juz), data }));
  }, [rub3Items]);

  useEffect(() => { if (surahSections.length) setActiveJuz(surahSections[0].juz); }, [surahSections]);
  useEffect(() => { if (rub3Sections.length) setRub3ActiveJuz(rub3Sections[0].juz); }, [rub3Sections]);

  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 10 }), []);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => { const f = viewableItems?.find((v) => v?.section?.juz); if (f?.section?.juz) setActiveJuz(f.section.juz); }).current;
  const onRub3ViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => { const f = viewableItems?.find((v) => v?.section?.juz); if (f?.section?.juz) setRub3ActiveJuz(f.section.juz); }).current;

  const railActiveJuz = useMemo(() => { let c = 1; for (const j of JUZ_INDEX) { if (j <= activeJuz) c = j; else break; } return c; }, [activeJuz]);
  const rub3RailActiveJuz = useMemo(() => { let c = 1; for (const j of JUZ_INDEX) { if (j <= rub3ActiveJuz) c = j; else break; } return c; }, [rub3ActiveJuz]);

  const jumpToJuz = (j: number) => { const i = surahSections.findIndex((s) => s.juz >= j); if (i < 0) return; setActiveJuz(j); requestAnimationFrame(() => { try { sectionListRef.current?.scrollToLocation({ sectionIndex: i, itemIndex: 0, viewPosition: 0, animated: true }); } catch {} }); };
  const jumpToRub3Juz = (j: number) => { const i = rub3Sections.findIndex((s) => s.juz >= j); if (i < 0) return; setRub3ActiveJuz(j); requestAnimationFrame(() => { try { rub3ListRef.current?.scrollToLocation({ sectionIndex: i, itemIndex: 0, viewPosition: 0, animated: true }); } catch {} }); };

  // ── Khatma ──
  const KHATMA_TYPES: KhatmaType[] = [
    { id: "q240", days: 240, label: "\u062e\u062a\u0645\u0629 \u0662\u0664\u0660 \u064a\u0648\u0645\u0627\u064b", wirdLabel: "\u0631\u0628\u0639", quartersPerWird: 1 },
    { id: "q120", days: 120, label: "\u062e\u062a\u0645\u0629 \u0661\u0662\u0660 \u064a\u0648\u0645\u0627\u064b", wirdLabel: "\u0631\u0628\u0639\u0627\u0646", quartersPerWird: 2 },
    { id: "q80", days: 80, label: "\u062e\u062a\u0645\u0629 \u0668\u0660 \u064a\u0648\u0645\u0627\u064b", wirdLabel: "\u0663 \u0623\u0631\u0628\u0627\u0639", quartersPerWird: 3 },
    { id: "q60", days: 60, label: "\u062e\u062a\u0645\u0629 \u0666\u0660 \u064a\u0648\u0645\u0627\u064b", wirdLabel: "\u062d\u0632\u0628 (\u0664 \u0623\u0631\u0628\u0627\u0639)", quartersPerWird: 4 },
    { id: "q40", days: 40, label: "\u062e\u062a\u0645\u0629 \u0664\u0660 \u064a\u0648\u0645\u0627\u064b", wirdLabel: "\u0666 \u0623\u0631\u0628\u0627\u0639", quartersPerWird: 6 },
    { id: "juz30", days: 30, label: "\u062e\u062a\u0645\u0629 \u0663\u0660 \u064a\u0648\u0645\u0627\u064b", wirdLabel: "\u062c\u0632\u0621", quartersPerWird: 8 },
  ];

  const generateWirds = useCallback((qpw: number): WirdInfo[] => {
    if (!rub3Items.length) return [];
    const result: WirdInfo[] = [];
    for (let i = 0; i < rub3Items.length; i += qpw) {
      const first = rub3Items[i];
      const next = i + qpw < rub3Items.length ? rub3Items[i + qpw] : null;
      let eSN = next ? next.surahNumber : 114;
      let eA = next ? next.ayahNumber - 1 : 6;
      let eS = next ? (next.surahName ?? "") : "\u0627\u0644\u0646\u0627\u0633";
      let eP = next ? Math.max(first.page, next.page - 1) : TOTAL_PAGES;
      if (eA < 1 && eSN > 1) { eSN -= 1; const prev = SURAH_META.find((s) => s.number === eSN); eA = prev?.ayahCount ?? 1; eS = prev?.name_ar ?? ""; }
      result.push({ index: result.length + 1, startSurah: first.surahName ?? "", startAyah: first.ayahNumber, startSurahNum: first.surahNumber, endSurah: eS, endAyah: eA, endSurahNum: eSN, startPage: first.page, endPage: Math.max(first.page, eP) });
    }
    return result;
  }, [rub3Items]);

  const wirds = useMemo(() => (khatma ? generateWirds(khatma.quartersPerWird) : []), [khatma, generateWirds]);
  const currentWirdIdx = khatma ? wirds.findIndex((w) => !(khatma.completedWirds ?? []).includes(w.index)) : 0;
  const currentWird = currentWirdIdx >= 0 ? wirds[currentWirdIdx] : null;
  const khatmaDaysLeft = khatma ? Math.max(0, khatma.targetDays - Math.ceil((Date.now() - new Date(khatma.startDate).getTime()) / 86400000)) : 0;

  const startKhatma = async (type: KhatmaType) => {
    const k: KhatmaData = { id: Date.now().toString(), typeId: type.id, startDate: new Date().toISOString(), targetDays: type.days, quartersPerWird: type.quartersPerWird, completedWirds: [], completed: false };
    setKhatma(k); setKhatmaStep("active"); setSelectedKhatmaType(null);
    await AsyncStorage.setItem(KHATMA_KEY, JSON.stringify(k));
  };

  const markWirdComplete = async (idx: number) => {
    if (!khatma) return;
    const u = { ...khatma };
    if (!(u.completedWirds ?? []).includes(idx)) u.completedWirds = [...(u.completedWirds ?? []), idx];
    if ((u.completedWirds ?? []).length >= wirds.length) {
      u.completed = true; u.completedDate = new Date().toISOString();
      const h = [...khatmaHistory, u]; setKhatmaHistory(h);
      await AsyncStorage.setItem(KHATMA_HISTORY_KEY, JSON.stringify(h));
      setKhatma(null); await AsyncStorage.removeItem(KHATMA_KEY);
      Alert.alert("\u0645\u0628\u0627\u0631\u0643!", "\u0644\u0642\u062f \u0623\u062a\u0645\u0645\u062a \u062e\u062a\u0645\u0629 \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064a\u0645 \u0628\u062d\u0645\u062f \u0627\u0644\u0644\u0647");
      return;
    }
    setKhatma(u); await AsyncStorage.setItem(KHATMA_KEY, JSON.stringify(u));
  };

  const resetKhatma = () => {
    Alert.alert("\u062d\u0630\u0641 \u0627\u0644\u062e\u062a\u0645\u0629", "\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0627\u0644\u062e\u062a\u0645\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629\u061f", [
      { text: "\u0625\u0644\u063a\u0627\u0621", style: "cancel" },
      { text: "\u062d\u0630\u0641", style: "destructive", onPress: async () => { setKhatma(null); await AsyncStorage.removeItem(KHATMA_KEY); setKhatmaStep("active"); } },
    ]);
  };

  // ── Marks: split into bookmarks (الفواصل) and highlights (التمييزات) ──
  const allMarkItems = useMemo(() => {
    const items: { key: string; sura: number; aya: number; surahName: string; page: number; bookmarkColor: string | null; highlightColor: string | null }[] = [];
    Object.entries(marks).forEach(([key, mark]) => {
      if (!mark.bookmarkColor && !mark.highlightColor) return;
      const [sS, aS] = key.split(":"); const sura = parseInt(sS, 10); const aya = parseInt(aS, 10);
      const surah = SURAH_META.find((s) => s.number === sura);
      items.push({ key, sura, aya, surahName: surah?.name_ar ?? "", page: getPageForAyah(sura, aya), bookmarkColor: mark.bookmarkColor ?? null, highlightColor: mark.highlightColor ?? null });
    });
    items.sort((a, b) => a.sura - b.sura || a.aya - b.aya);
    return items;
  }, [marks]);

  // الفواصل = latest bookmark per color
  const fawasilLatest = useMemo(() => {
    const latest: Record<string, { sura: number; aya: number; surahName: string; dayName: string }> = {};
    Object.entries(marks).forEach(([key, mark]) => {
      const color = mark?.bookmarkColor ?? null;
      if (!color || !BOOKMARK_COLORS.includes(color)) return;
      const [sS, aS] = key.split(":"); const sura = parseInt(sS, 10); const aya = parseInt(aS, 10);
      if (!sura || !aya) return;
      const nextTime = mark?.updatedAt ? new Date(mark.updatedAt).getTime() : 0;
      const currTime = latest[color] ? (marks[`${latest[color].sura}:${latest[color].aya}`]?.updatedAt ? new Date(marks[`${latest[color].sura}:${latest[color].aya}`].updatedAt!).getTime() : 0) : 0;
      if (!latest[color] || nextTime >= currTime) {
        const surah = SURAH_META.find((s) => s.number === sura);
        const dt = mark?.updatedAt ? new Date(mark.updatedAt) : null;
        const dayName = dt && !Number.isNaN(dt.getTime()) ? AR_DAY_NAMES[dt.getDay()] ?? "" : "";
        latest[color] = { sura, aya, surahName: surah?.name_ar ?? "", dayName };
      }
    });
    return latest;
  }, [marks]);

  // التمييزات = highlights only
  const highlightItems = useMemo(() => allMarkItems.filter((i) => i.highlightColor), [allMarkItems]);
  const highlightColors = useMemo(() => { const c = new Set<string>(); highlightItems.forEach((i) => { if (i.highlightColor) c.add(i.highlightColor); }); return Array.from(c); }, [highlightItems]);
  const filteredHighlights = useMemo(() => { if (!activeHighlightFilter) return highlightItems; return highlightItems.filter((i) => i.highlightColor === activeHighlightFilter); }, [highlightItems, activeHighlightFilter]);

  // ── Renderers ──
  const renderSurah = ({ item }: { item: (typeof surahItems)[number] }) => {
    const page = item.startPage ?? 1; const ayahs = item.ayahCount ?? 0;
    const ayahWord = ayahs >= 3 && ayahs <= 10 ? "\u0622\u064a\u0627\u062a" : "\u0622\u064a\u0629";
    const typeAr = item.revelationType === "meccan" ? "\u0645\u0643\u064a\u0629" : "\u0645\u062f\u0646\u064a\u0629";
    const metaStr = `\u0627\u0644\u0635\u0641\u062d\u0629 ${toArabicDigits(page)} - ${toArabicDigits(ayahs)} ${ayahWord} - ${typeAr}`;
    const isActive = lastRead?.surahNumber === item.number;
    return (
      <Pressable style={styles.row} onPress={() => openSurah(item.number, 1, item.startPage)}>
        <View style={[styles.badge, isActive && styles.badgeActive]}>
          <Text style={[styles.badgeText, isActive && styles.badgeTextActive]} maxFontSizeMultiplier={1.1}>{toArabicDigits(item.number)}</Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.surahName} maxFontSizeMultiplier={1.1}>{item.name_ar ?? ""}</Text>
          <Text style={styles.meta} maxFontSizeMultiplier={1.1}>{metaStr}</Text>
        </View>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}><Text style={styles.sectionHeaderText} maxFontSizeMultiplier={1.1}>{section.title}</Text></View>
  );

  const RubIndicator = ({ rubInJuz, isActive }: { rubInJuz: number; isActive: boolean }) => {
    const sz = fs(30); const half = sz / 2;
    const fill = isActive ? "#3D8B5E" : "#B5AB9C"; const bg = "#DDD4C6";
    const q = (rubInJuz - 1) % 4;
    if (q === 0) return null;
    return (
      <View style={{ width: sz, height: sz, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: sz, height: sz, borderRadius: half, backgroundColor: fill, overflow: "hidden" }}>
          {q === 1 && (<><View style={{ position: "absolute", top: 0, left: 0, width: half, height: sz, backgroundColor: bg }} /><View style={{ position: "absolute", bottom: 0, right: 0, width: half, height: half, backgroundColor: bg }} /></>)}
          {q === 2 && (<View style={{ position: "absolute", top: 0, left: 0, width: half, height: sz, backgroundColor: bg }} />)}
          {q === 3 && (<View style={{ position: "absolute", bottom: 0, left: 0, width: half, height: half, backgroundColor: bg }} />)}
        </View>
      </View>
    );
  };

  const renderRub3Item = ({ item }: { item: Rub3Item }) => {
    const meta = `${item.surahName}: ${toArabicDigits(item.ayahNumber)} - \u0627\u0644\u0635\u0641\u062d\u0629 ${toArabicDigits(item.page)}`;
    const isHizbStart = item.rubInJuz === 1 || item.rubInJuz === 5;
    const hizbNumber = isHizbStart ? ((item.juz ?? 1) - 1) * 2 + (item.rubInJuz === 1 ? 1 : 2) : 0;
    const isActive = lastRead != null && lastRead.surahNumber === item.surahNumber && lastRead.ayahNumber === item.ayahNumber;
    return (
      <Pressable style={styles.rub3Row} onPress={() => openSurah(item.surahNumber, item.ayahNumber, item.page, "rub3")}>
        {isHizbStart ? (
          <View style={[styles.rub3Chip, isActive && styles.rub3ChipActive]}><Text style={[styles.rub3ChipText, isActive && styles.rub3ChipTextActive]} maxFontSizeMultiplier={1.1}>{toArabicDigits(hizbNumber)}</Text></View>
        ) : (<RubIndicator rubInJuz={item.rubInJuz} isActive={isActive} />)}
        <View style={styles.rub3Body}>
          <Text style={styles.rub3Text} numberOfLines={1} ellipsizeMode="tail" maxFontSizeMultiplier={1.1}>{item.text}</Text>
          <Text style={styles.rub3Meta} maxFontSizeMultiplier={1.1}>{meta}</Text>
        </View>
      </Pressable>
    );
  };

  const TAB_CONFIG: { key: TabKey; label: string; icon: string }[] = [
    { key: "index", label: "\u0627\u0644\u0641\u0647\u0631\u0633", icon: "list" },
    { key: "khatma", label: "\u0627\u0644\u062e\u062a\u0645\u0629", icon: "book-open" },
    { key: "quarters", label: "\u0627\u0644\u0641\u0648\u0627\u0635\u0644", icon: "grid" },
    { key: "highlights", label: "\u0627\u0644\u062a\u0645\u064a\u064a\u0632\u0627\u062a", icon: "bookmark" },
  ];
  const pageTitles: Record<TabKey, string> = { index: "\u0627\u0644\u0641\u0647\u0631\u0633", khatma: "\u0627\u0644\u062e\u062a\u0645\u0629", quarters: "\u0627\u0644\u0641\u0648\u0627\u0635\u0644", highlights: "\u0627\u0644\u062a\u0645\u064a\u064a\u0632\u0627\u062a" };

  return (
    <View style={styles.gradient}>
      <View style={[styles.container, { paddingTop: insets.top + fs(8) }]}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={fs(26)} color="#2D7A4E" />
          </Pressable>
          <Text style={styles.headerTitle}>{pageTitles[activeTab]}</Text>
        </View>
        <Text style={styles.pageTitle}>{pageTitles[activeTab]}</Text>

        <View style={styles.content}>
          {activeTab === "index" && (
            <View style={styles.contentRow}>
              <View style={styles.juzRail}>{JUZ_INDEX.map((j) => (<Pressable key={`j${j}`} style={styles.juzRailItem} hitSlop={{ top: 2, bottom: 2, left: 8, right: 8 }} onPress={() => jumpToJuz(j)}><Text style={[styles.juzRailText, j === railActiveJuz && styles.juzRailTextActive]} maxFontSizeMultiplier={1.0}>{toArabicDigits(j)}</Text></Pressable>))}</View>
              <SectionList ref={sectionListRef} sections={surahSections} keyExtractor={(item) => String(item.number)} renderItem={renderSurah} renderSectionHeader={renderSectionHeader} stickySectionHeadersEnabled={false} style={styles.sectionList} contentContainerStyle={[styles.listContentNoLeft, { paddingBottom: insets.bottom + 90 }]} showsVerticalScrollIndicator={false} viewabilityConfig={viewabilityConfig} onViewableItemsChanged={onViewableItemsChanged} ItemSeparatorComponent={() => <View style={styles.divider} />} initialNumToRender={150} maxToRenderPerBatch={50} onScrollToIndexFailed={() => {}} />
            </View>
          )}

          {activeTab === "khatma" && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: fs(4) }}>
              {!khatma && khatmaStep === "types" && (
                <View style={styles.khatmaActive}>
                  <View style={styles.khatmaStepHeader}><Pressable onPress={() => setKhatmaStep("active")}><Text style={styles.khatmaStepBack}>✕</Text></Pressable><Text style={styles.khatmaStepTitle}>{"\u062e\u062a\u0645\u0629 \u062c\u062f\u064a\u062f\u0629"}</Text><View style={{ width: fs(30) }} /></View>
                  {KHATMA_TYPES.map((t) => (<Pressable key={t.id} style={styles.khatmaTypeRow} onPress={() => { setSelectedKhatmaType(t); setKhatmaStep("confirm"); }}><View style={styles.khatmaTypeInfo}><Text style={styles.khatmaTypeLabel}>{t.label}</Text><Text style={styles.khatmaTypeDesc}>{"\u0627\u0644\u0648\u0631\u062f \u0627\u0644\u064a\u0648\u0645\u064a: "}{t.wirdLabel}</Text></View><Ionicons name="chevron-back" size={fs(18)} color="#968C80" /></Pressable>))}
                </View>
              )}
              {!khatma && khatmaStep === "confirm" && selectedKhatmaType && (
                <View style={styles.khatmaActive}>
                  <View style={styles.khatmaStepHeader}><Pressable onPress={() => setKhatmaStep("types")}><Ionicons name="chevron-forward" size={fs(22)} color="#2D7A4E" /></Pressable><Text style={styles.khatmaStepTitle}>{"\u0628\u062f\u0627\u064a\u0629 \u0627\u0644\u062e\u062a\u0645\u0629"}</Text><Pressable onPress={() => { setKhatmaStep("active"); setSelectedKhatmaType(null); }}><Text style={styles.khatmaStepBack}>✕</Text></Pressable></View>
                  <Text style={styles.khatmaConfirmType}>{selectedKhatmaType.label}</Text>
                  <Text style={styles.khatmaConfirmDesc}>{"\u0627\u0644\u0648\u0631\u062f \u0627\u0644\u064a\u0648\u0645\u064a: "}{selectedKhatmaType.wirdLabel}</Text>
                  <Pressable style={styles.khatmaStartOption} onPress={() => startKhatma(selectedKhatmaType)}><View style={styles.khatmaStartOptionInfo}><Text style={styles.khatmaStartOptionLabel}>{"\u0628\u062f\u0627\u064a\u0629 \u0627\u0644\u0645\u0635\u062d\u0641"}</Text></View><Ionicons name="chevron-back" size={fs(18)} color="#968C80" /></Pressable>
                </View>
              )}
              {!khatma && khatmaStep === "active" && (
                <View style={styles.khatmaEmpty}>
                  <View style={styles.khatmaIconWrap}><Feather name="book-open" size={48} color="#2D7A4E" /></View>
                  <Text style={styles.khatmaEmptyTitle}>{"\u0627\u0644\u062e\u062a\u0645\u0629"}</Text>
                  <Text style={styles.khatmaEmptyDesc}>{"\u0627\u0628\u062f\u0623 \u062e\u062a\u0645\u0629 \u062c\u062f\u064a\u062f\u0629 \u0644\u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064a\u0645 \u0643\u0627\u0645\u0644\u0627\u064b"}</Text>
                  <Pressable style={styles.wirdCompleteBtn} onPress={() => setKhatmaStep("types")}><Feather name="plus" size={22} color="#FFF" /><Text style={styles.wirdCompleteText}>{"\u062e\u062a\u0645\u0629 \u062c\u062f\u064a\u062f\u0629"}</Text></Pressable>
                  {khatmaHistory.length > 0 && (<View style={{ marginTop: fs(24), width: "100%" }}><Text style={styles.khatmaHistoryTitle}>{"\u0627\u0644\u062e\u062a\u0645\u0627\u062a \u0627\u0644\u0633\u0627\u0628\u0642\u0629"} ({toArabicDigits(khatmaHistory.length)})</Text>{khatmaHistory.map((h, i) => (<View key={h.id} style={styles.khatmaHistoryRow}><Feather name="check-circle" size={20} color="#2D7A4E" /><Text style={styles.khatmaHistoryText}>{"\u062e\u062a\u0645\u0629 "}{toArabicDigits(i + 1)} — {new Date(h.startDate).toLocaleDateString("ar-SA")}</Text></View>))}</View>)}
                </View>
              )}
              {khatma && currentWird && (
                <View style={styles.khatmaActive}>
                  <View style={styles.wirdHeader}><Text style={styles.wirdHeaderRight}>{"\u0648\u0631\u062f \u0627\u0644\u064a\u0648\u0645 "}{toArabicDigits(currentWird.index)}</Text><Text style={styles.wirdHeaderLeft}>{"\u0628\u0639\u062f "}{toArabicDigits(khatmaDaysLeft)} {khatmaDaysLeft === 1 ? "\u064a\u0648\u0645" : "\u0623\u064a\u0627\u0645"}</Text></View>
                  <View style={styles.wirdCard}>
                    <Pressable style={styles.wirdPageRow} onPress={() => openSurah(currentWird.startSurahNum, currentWird.startAyah, currentWird.startPage, "khatma")}><View style={styles.wirdPageInfo}><Text style={styles.wirdPageLabel}>{"\u0645\u0646 "}{currentWird.startSurah}: {toArabicDigits(currentWird.startAyah)}</Text></View><View style={styles.wirdPageRight}><Text style={styles.wirdPageNum}>{toArabicDigits(currentWird.startPage)}</Text><Ionicons name="chevron-back" size={fs(18)} color="#968C80" /></View></Pressable>
                    <View style={styles.wirdDivider} />
                    <Pressable style={styles.wirdPageRow} onPress={() => openSurah(currentWird.endSurahNum, currentWird.endAyah, currentWird.endPage, "khatma")}><View style={styles.wirdPageInfo}><Text style={styles.wirdPageLabel}>{"\u0625\u0644\u0649 "}{currentWird.endSurah}: {toArabicDigits(currentWird.endAyah)}</Text></View><View style={styles.wirdPageRight}><Text style={styles.wirdPageNum}>{toArabicDigits(currentWird.endPage)}</Text><Ionicons name="chevron-back" size={fs(18)} color="#968C80" /></View></Pressable>
                  </View>
                  <Pressable style={styles.wirdCompleteBtn} onPress={() => markWirdComplete(currentWird.index)}><Feather name="check-circle" size={22} color="#FFF" /><Text style={styles.wirdCompleteText}>{"\u062a\u0645\u064a\u064a\u0632 \u0643\u0645\u0643\u062a\u0645\u0644"}</Text></Pressable>
                  <Pressable style={styles.allWirdsRow} onPress={() => setShowAllWirds(!showAllWirds)}><Text style={styles.allWirdsLabel}>{"\u0643\u0644 \u0627\u0644\u0623\u0648\u0631\u0627\u062f"}</Text><View style={styles.allWirdsRight}><Text style={styles.allWirdsCount}>{toArabicDigits(wirds.length)}</Text><Ionicons name={showAllWirds ? "chevron-down" : "chevron-back"} size={fs(18)} color="#968C80" /></View></Pressable>
                  {showAllWirds && (<View style={styles.allWirdsList}>{wirds.map((w) => { const done = (khatma.completedWirds ?? []).includes(w.index); const isCur = w.index === currentWird.index; return (<Pressable key={w.index} style={[styles.wirdListItem, isCur && styles.wirdListItemCurrent]} onPress={() => openSurah(w.startSurahNum, w.startAyah, w.startPage, "khatma")}><View style={styles.wirdListLeft}>{done ? <Feather name="check-circle" size={20} color="#2D7A4E" /> : <View style={styles.wirdListCircle} />}<View><Text style={[styles.wirdListText, done && styles.wirdListTextDone]}>{"\u0648\u0631\u062f \u0627\u0644\u064a\u0648\u0645 "}{toArabicDigits(w.index)}</Text><Text style={styles.wirdListPages}>{"\u0645\u0646 "}{w.startSurah}: {toArabicDigits(w.startAyah)} {"\u0625\u0644\u0649 "}{w.endSurah}: {toArabicDigits(w.endAyah)}</Text></View></View><Ionicons name="chevron-back" size={fs(16)} color="#C8B99A" /></Pressable>); })}</View>)}
                  <Pressable style={styles.khatmaDeleteBtn} onPress={resetKhatma}><Text style={styles.khatmaDeleteText}>{"\u062d\u0630\u0641 \u0627\u0644\u062e\u062a\u0645\u0629"}</Text></Pressable>
                </View>
              )}
            </ScrollView>
          )}

          {activeTab === "quarters" && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: fs(4) }}>
              <View style={styles.fwCard}>
                {BOOKMARK_COLORS.map((color, idx) => {
                  const entry = fawasilLatest[color];
                  const colorName = BOOKMARK_COLOR_NAMES[color] ?? "";
                  const hasData = !!entry;
                  return (
                    <React.Fragment key={color}>
                      {idx > 0 && <View style={styles.fwDivider} />}
                      <Pressable
                        style={styles.fwRow}
                        disabled={!hasData}
                        onPress={() => hasData && openSurah(entry.sura, entry.aya)}
                      >
                        {hasData ? (
                          <Ionicons name="chevron-back" size={fs(18)} color="#C8B99A" />
                        ) : <View style={{ width: fs(18) }} />}
                        <View style={styles.fwInfo}>
                          <Text style={styles.fwColorName}>{colorName}</Text>
                          {hasData && (
                            <Text style={styles.fwMeta}>
                              {entry.dayName ? `${entry.dayName}  ` : ""}{entry.surahName}: {toArabicDigits(entry.aya)}
                            </Text>
                          )}
                        </View>
                        <Ionicons
                          name={hasData ? "bookmark" : "bookmark-outline"}
                          size={fs(28)}
                          color={color}
                        />
                      </Pressable>
                    </React.Fragment>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {activeTab === "highlights" && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: fs(4) }}>
              {highlightItems.length === 0 ? (
                <View style={styles.khatmaEmpty}><View style={styles.khatmaIconWrap}><Feather name="edit-3" size={48} color="#2D7A4E" /></View><Text style={styles.khatmaEmptyTitle}>{"\u0627\u0644\u062a\u0645\u064a\u064a\u0632\u0627\u062a"}</Text><Text style={styles.khatmaEmptyDesc}>{"\u0639\u0646\u062f \u062a\u0645\u064a\u064a\u0632 \u0622\u064a\u0629 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0633\u062a\u0638\u0647\u0631 \u0647\u0646\u0627"}</Text></View>
              ) : (
                <View style={styles.khatmaActive}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hlFilterRow} style={{ marginBottom: fs(14) }}>
                    <Pressable style={[styles.hlFilterPill, !activeHighlightFilter && styles.hlFilterPillActive]} onPress={() => setActiveHighlightFilter(null)}><Text style={[styles.hlFilterText, !activeHighlightFilter && styles.hlFilterTextActive]}>{"\u0627\u0644\u0643\u0644"} ({toArabicDigits(highlightItems.length)})</Text></Pressable>
                    {highlightColors.map((color) => { const cnt = highlightItems.filter((i) => i.highlightColor === color).length; return (<Pressable key={color} style={[styles.hlFilterPill, activeHighlightFilter === color && styles.hlFilterPillActive]} onPress={() => setActiveHighlightFilter(activeHighlightFilter === color ? null : color)}><View style={[styles.hlColorDot, { backgroundColor: color }]} /><Text style={[styles.hlFilterText, activeHighlightFilter === color && styles.hlFilterTextActive]}>{toArabicDigits(cnt)}</Text></Pressable>); })}
                  </ScrollView>
                  {filteredHighlights.map((item) => (
                    <Pressable key={item.key} style={styles.hlRow} onPress={() => openSurah(item.sura, item.aya, item.page)}>
                      <View style={[styles.hlColorStrip, { backgroundColor: item.highlightColor ?? "#2D7A4E" }]} />
                      <View style={styles.hlInfo}>
                        <Text style={styles.hlSurah}>{item.surahName}: {toArabicDigits(item.aya)}</Text>
                        <Text style={styles.hlPage}>{"\u0627\u0644\u0635\u0641\u062d\u0629 "}{toArabicDigits(item.page)}</Text>
                      </View>
                      <Ionicons name="chevron-back" size={fs(16)} color="#C8B99A" />
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>

        <View style={[styles.footerWrap, { paddingBottom: insets.bottom + fs(4) }]}>
          <View style={styles.footer}>
            {TAB_CONFIG.map((t) => { const isAct = activeTab === t.key; return (<Pressable key={t.key} style={styles.footerTab} onPress={() => setActiveTab(t.key)}><Feather name={t.icon as any} size={fs(20)} color={isAct ? "#2D7A4E" : "#968C80"} /><Text style={[styles.footerTabText, isAct && styles.footerTabTextActive]}>{t.label}</Text></Pressable>); })}
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (fs: (n: number) => number) => StyleSheet.create({
  gradient: { flex: 1, backgroundColor: "#F3EEE4" },
  container: { flex: 1, width: "100%", maxWidth: 430, alignSelf: "center", paddingHorizontal: fs(12) },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: fs(4), position: "relative", zIndex: 10 },
  backButton: { position: "absolute", left: 0, width: fs(40), height: fs(40), borderRadius: fs(20), alignItems: "center", justifyContent: "center", zIndex: 1 },
  headerTitle: { fontFamily: "CairoBold", fontSize: fs(16), color: "#1C1714" },
  pageTitle: { textAlign: "right", fontSize: fs(38), fontWeight: "900", color: "#1C1714", fontFamily: "KFGQPCUthmanicScript", marginTop: fs(2), marginBottom: fs(4), paddingHorizontal: fs(4) },
  content: { flex: 1 },
  contentRow: { flex: 1, flexDirection: "row" },
  sectionList: { flex: 1 },
  listContentNoLeft: { paddingRight: fs(0), paddingTop: fs(0) },
  sectionHeader: { paddingHorizontal: fs(12), paddingTop: fs(18), paddingBottom: fs(4) },
  sectionHeaderText: { textAlign: "right", fontSize: clamp(fs(21), 18, 24), fontWeight: "700", color: "#3A3028", fontFamily: "KFGQPCUthmanicScript" },
  row: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: fs(12), paddingVertical: fs(8), minHeight: fs(56) },
  rowBody: { flex: 1, paddingHorizontal: fs(10) },
  surahName: { textAlign: "right", fontSize: clamp(fs(26), 22, 28), fontWeight: "900", color: "#1C1714", fontFamily: "KFGQPCUthmanicScript", lineHeight: clamp(fs(38), 34, 42) },
  meta: { textAlign: "right", marginTop: fs(1), fontSize: clamp(fs(14), 13, 16), color: "#968C80", fontFamily: "Cairo", lineHeight: clamp(fs(20), 18, 22) },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#DCD4C8", marginHorizontal: fs(12) },
  badge: { width: fs(42), height: fs(42), borderRadius: fs(21), backgroundColor: "#DDD8CE", alignItems: "center", justifyContent: "center" },
  badgeActive: { backgroundColor: "#3D8B5E" },
  badgeText: { fontSize: fs(16), fontWeight: "700", color: "#4A4036", fontFamily: "CairoBold" },
  badgeTextActive: { color: "#FFF" },
  juzRail: { width: fs(24), paddingTop: fs(4), justifyContent: "flex-start", alignItems: "center" },
  juzRailItem: { paddingVertical: 1, paddingHorizontal: fs(4), minWidth: fs(24), minHeight: fs(16), alignItems: "center", justifyContent: "center" },
  juzRailText: { fontSize: clamp(fs(12), 11, 13), fontWeight: "700", color: "#2D7A4E", opacity: 0.9, fontFamily: "CairoBold", lineHeight: clamp(fs(18), 17, 19), textAlign: "center" },
  juzRailTextActive: { opacity: 1, textDecorationLine: "underline" },
  rub3Row: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: fs(12), paddingVertical: fs(10), minHeight: fs(80) },
  rub3Body: { flex: 1, paddingHorizontal: fs(10) },
  rub3Text: { textAlign: "right", fontSize: fs(20), lineHeight: fs(44), color: "#1C1714", fontFamily: "KFGQPCUthmanicScript", writingDirection: "rtl" },
  rub3Meta: { textAlign: "right", fontSize: fs(13), color: "#6B8C5E", fontFamily: "Cairo" },
  rub3Chip: { width: fs(30), height: fs(30), borderRadius: fs(15), backgroundColor: "#B5AB9C", alignItems: "center", justifyContent: "center" },
  rub3ChipActive: { backgroundColor: "#3D8B5E" },
  rub3ChipText: { fontSize: fs(13), fontWeight: "800", color: "#FFF", fontFamily: "CairoBold" },
  rub3ChipTextActive: { color: "#FFF" },
  footerWrap: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#F3EEE4", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#DCD4C8", paddingTop: fs(8), paddingHorizontal: fs(12) },
  footer: { flexDirection: "row-reverse", justifyContent: "space-around", alignItems: "center" },
  footerTab: { alignItems: "center", justifyContent: "center", paddingVertical: fs(4), minWidth: fs(60), gap: fs(4) },
  footerTabText: { fontFamily: "Cairo", fontSize: fs(11), color: "#968C80" },
  footerTabTextActive: { fontFamily: "CairoBold", color: "#2D7A4E" },
  khatmaEmpty: { alignItems: "center", paddingTop: fs(60), paddingHorizontal: fs(20) },
  khatmaIconWrap: { width: fs(90), height: fs(90), borderRadius: fs(45), backgroundColor: "rgba(45,122,78,0.08)", alignItems: "center", justifyContent: "center", marginBottom: fs(20) },
  khatmaEmptyTitle: { fontFamily: "CairoBold", fontSize: fs(22), color: "#1C1714", marginBottom: fs(8) },
  khatmaEmptyDesc: { fontFamily: "Cairo", fontSize: fs(14), color: "#968C80", textAlign: "center", lineHeight: fs(22), marginBottom: fs(28) },
  khatmaHistoryTitle: { fontFamily: "CairoBold", fontSize: fs(16), color: "#1C1714", textAlign: "right", marginBottom: fs(10) },
  khatmaHistoryRow: { flexDirection: "row-reverse", alignItems: "center", gap: fs(10), paddingVertical: fs(8) },
  khatmaHistoryText: { fontFamily: "Cairo", fontSize: fs(14), color: "#4A4036" },
  khatmaActive: { paddingTop: fs(8), paddingHorizontal: fs(4) },
  khatmaStepHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingVertical: fs(10), marginBottom: fs(8) },
  khatmaStepTitle: { fontFamily: "CairoBold", fontSize: fs(16), color: "#1C1714" },
  khatmaStepBack: { fontSize: fs(20), color: "#968C80", paddingHorizontal: fs(4) },
  khatmaTypeRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFF", borderRadius: fs(14), paddingVertical: fs(16), paddingHorizontal: fs(16), marginBottom: fs(8) },
  khatmaTypeInfo: { flex: 1, gap: fs(2) },
  khatmaTypeLabel: { fontFamily: "CairoBold", fontSize: fs(16), color: "#1C1714", textAlign: "right" },
  khatmaTypeDesc: { fontFamily: "Cairo", fontSize: fs(13), color: "#968C80", textAlign: "right" },
  khatmaConfirmType: { fontFamily: "CairoBold", fontSize: fs(22), color: "#1C1714", textAlign: "center", marginBottom: fs(4) },
  khatmaConfirmDesc: { fontFamily: "Cairo", fontSize: fs(14), color: "#968C80", textAlign: "center", marginBottom: fs(24) },
  khatmaStartOption: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFF", borderRadius: fs(14), paddingVertical: fs(18), paddingHorizontal: fs(16), marginBottom: fs(10) },
  khatmaStartOptionInfo: { flex: 1 },
  khatmaStartOptionLabel: { fontFamily: "CairoBold", fontSize: fs(16), color: "#1C1714", textAlign: "right" },
  wirdHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: fs(14) },
  wirdHeaderRight: { fontFamily: "CairoBold", fontSize: fs(18), color: "#1C1714" },
  wirdHeaderLeft: { fontFamily: "Cairo", fontSize: fs(14), color: "#968C80" },
  wirdCard: { backgroundColor: "#F0EBE2", borderRadius: fs(16), padding: fs(16), marginBottom: fs(18) },
  wirdPageRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingVertical: fs(8) },
  wirdPageInfo: { flex: 1, paddingEnd: fs(10) },
  wirdPageLabel: { fontFamily: "CairoBold", fontSize: fs(15), color: "#1C1714", textAlign: "right", writingDirection: "rtl", marginBottom: fs(4) },
  wirdPageRight: { flexDirection: "row", alignItems: "center", gap: fs(4) },
  wirdPageNum: { fontFamily: "CairoBold", fontSize: fs(16), color: "#968C80" },
  wirdDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#D5CFC4", marginVertical: fs(4) },
  wirdCompleteBtn: { flexDirection: "row-reverse", backgroundColor: "#2D7A4E", borderRadius: fs(30), paddingVertical: fs(16), alignItems: "center", justifyContent: "center", gap: fs(10), marginBottom: fs(28) },
  wirdCompleteText: { fontFamily: "CairoBold", fontSize: fs(17), color: "#FFF" },
  allWirdsRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingVertical: fs(14), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#DCD4C8", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#DCD4C8" },
  allWirdsLabel: { fontFamily: "CairoBold", fontSize: fs(16), color: "#1C1714" },
  allWirdsRight: { flexDirection: "row", alignItems: "center", gap: fs(6) },
  allWirdsCount: { fontFamily: "Cairo", fontSize: fs(15), color: "#968C80" },
  allWirdsList: { marginTop: fs(8), marginBottom: fs(16) },
  wirdListItem: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingVertical: fs(12), paddingHorizontal: fs(8), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#EAE5DC" },
  wirdListItemCurrent: { backgroundColor: "rgba(45,122,78,0.06)", borderRadius: fs(10) },
  wirdListLeft: { flexDirection: "row-reverse", alignItems: "center", gap: fs(10) },
  wirdListCircle: { width: fs(20), height: fs(20), borderRadius: fs(10), borderWidth: 2, borderColor: "#C8B99A" },
  wirdListText: { fontFamily: "CairoBold", fontSize: fs(14), color: "#1C1714" },
  wirdListTextDone: { color: "#968C80", textDecorationLine: "line-through" },
  wirdListPages: { fontFamily: "Cairo", fontSize: fs(13), color: "#968C80" },
  khatmaDeleteBtn: { marginTop: fs(24), borderWidth: 1.5, borderColor: "#E74C3C", borderRadius: fs(30), paddingVertical: fs(14), alignItems: "center", marginBottom: fs(20) },
  khatmaDeleteText: { fontFamily: "CairoBold", fontSize: fs(16), color: "#E74C3C" },
  hlFilterRow: { flexDirection: "row-reverse", gap: fs(8), paddingVertical: fs(4), paddingHorizontal: fs(2) },
  hlFilterPill: { flexDirection: "row-reverse", alignItems: "center", gap: fs(6), paddingVertical: fs(8), paddingHorizontal: fs(14), borderRadius: fs(20), backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5E0D6" },
  hlFilterPillActive: { backgroundColor: "#2D7A4E", borderColor: "#2D7A4E" },
  hlFilterText: { fontFamily: "CairoBold", fontSize: fs(13), color: "#4A4036" },
  hlFilterTextActive: { color: "#FFF" },
  hlColorDot: { width: fs(14), height: fs(14), borderRadius: fs(7) },
  hlRow: { flexDirection: "row-reverse", alignItems: "center", paddingVertical: fs(14), paddingHorizontal: fs(10), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#EAE5DC" },
  hlColorBar: { width: fs(24), alignItems: "center", justifyContent: "center", gap: fs(4) },
  hlColorStrip: { width: fs(4), height: fs(28), borderRadius: fs(2) },
  hlBookmarkDot: { width: fs(10), height: fs(10), borderRadius: fs(5) },
  // الفواصل card
  fwCard: { backgroundColor: "#FFF", borderRadius: fs(16), marginTop: fs(12), overflow: "hidden" },
  fwRow: { flexDirection: "row-reverse", alignItems: "center", paddingVertical: fs(16), paddingHorizontal: fs(16), gap: fs(12) },
  fwDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E5E0D6", marginHorizontal: fs(16) },
  fwInfo: { flex: 1, gap: fs(2) },
  fwColorName: { fontFamily: "CairoBold", fontSize: fs(16), color: "#1C1714", textAlign: "right" },
  fwMeta: { fontFamily: "Cairo", fontSize: fs(13), color: "#968C80", textAlign: "right" },
  hlInfo: { flex: 1, paddingHorizontal: fs(10), gap: fs(2) },
  hlSurah: { fontFamily: "CairoBold", fontSize: fs(15), color: "#1C1714", textAlign: "right" },
  hlPage: { fontFamily: "Cairo", fontSize: fs(12), color: "#968C80", textAlign: "right" },
});
