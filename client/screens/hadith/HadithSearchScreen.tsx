import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons, Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HadithStackParamList } from "@/navigation/HadithStackNavigator";
import { HADITH_BOOKS, isBookCached, loadBookData, type BookKey } from "@/utils/hadithBookCache";

const HEADER_BG = "#1B4332";
const PAGE_BG = "#F3EEE4";
const CARD_BG = "#FFFFFF";
const PRIMARY = "#1C1714";
const SECONDARY = "#968C80";
const GREEN = "#2D7A4E";

const CHAPTER_ROUTE: Record<BookKey, keyof HadithStackParamList> = {
  bukhari: "BukhariChapter", muslim: "MuslimChapter", abudawud: "AbuDawudChapter",
  tirmidhi: "TirmidhiChapter", ibnmajah: "IbnMajahChapter", nasai: "NasaiChapter",
  malik: "MalikChapter", darimi: "DarimiChapter", ahmed: "AhmedChapter",
};

type LoadedBook = { key: BookKey; titleAr: string; route: keyof HadithStackParamList; chapters: Record<string, any> };
type SearchResult = { key: string; bookTitle: string; chapterId: number; chapterTitle: string; hadithId: number | string; text: string; route: keyof HadithStackParamList };

const MAX_RESULTS = 100;
const TASHKEEL = /[\u064B-\u065F\u0670\u0640]/g;
const ALEF_VARIANTS = /[\u0622\u0623\u0625]/g;
const TAA_MARBOUTA = /\u0629/g;

function stripArabic(s: string): string {
  return s.replace(TASHKEEL, "").replace(ALEF_VARIANTS, "\u0627").replace(TAA_MARBOUTA, "\u0647");
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <Text style={hStyles.base}>{text}</Text>;
  const strippedQuery = stripArabic(query.trim());
  if (!strippedQuery) return <Text style={hStyles.base}>{text}</Text>;

  const strippedToOrigStart: number[] = [];
  let stripped = "";
  for (let i = 0; i < text.length; i++) {
    const ch = stripArabic(text[i]);
    if (ch.length > 0) { strippedToOrigStart.push(i); stripped += ch; }
  }
  strippedToOrigStart.push(text.length);

  const matchRanges: { start: number; end: number }[] = [];
  let pos = 0;
  while (pos <= stripped.length - strippedQuery.length) {
    const idx = stripped.indexOf(strippedQuery, pos);
    if (idx === -1) break;
    matchRanges.push({ start: strippedToOrigStart[idx], end: strippedToOrigStart[idx + strippedQuery.length] ?? text.length });
    pos = idx + 1;
  }
  if (matchRanges.length === 0) return <Text style={hStyles.base}>{text}</Text>;

  const parts: { text: string; hl: boolean }[] = [];
  let cursor = 0;
  for (const { start, end } of matchRanges) {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), hl: false });
    parts.push({ text: text.slice(start, end), hl: true });
    cursor = end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hl: false });

  return (
    <Text style={hStyles.base}>
      {parts.map((p, i) => p.hl ? <Text key={i} style={hStyles.highlight}>{p.text}</Text> : <Text key={i}>{p.text}</Text>)}
    </Text>
  );
}

const hStyles = StyleSheet.create({
  base: { fontFamily: "Cairo", fontSize: 15, lineHeight: 26, color: PRIMARY, textAlign: "right", writingDirection: "rtl" },
  highlight: { color: "#D4841A", fontFamily: "CairoBold", backgroundColor: "rgba(212,132,26,0.12)" },
});

export default function HadithSearchScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<HadithStackParamList>>();
  const contentWidth = Math.min(width, 430);
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState("");
  const [loadedBooks, setLoadedBooks] = useState<LoadedBook[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoadingBooks(true);
        const loaded: LoadedBook[] = [];
        for (const book of HADITH_BOOKS) {
          if (await isBookCached(book.key)) {
            const data = await loadBookData(book.key);
            if (data) loaded.push({ key: book.key, titleAr: data.index?.titleAr ?? book.arabicName, route: CHAPTER_ROUTE[book.key], chapters: data.chapters ?? {} });
          }
        }
        if (!cancelled) { setLoadedBooks(loaded); setSelectedBooks(new Set(loaded.map((b) => b.key))); setLoadingBooks(false); }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const toggleBook = useCallback((id: string) => {
    setSelectedBooks((prev) => { const n = new Set(prev); if (n.has(id)) { if (n.size > 1) n.delete(id); } else n.add(id); return n; });
  }, []);
  const selectAll = useCallback(() => setSelectedBooks(new Set(loadedBooks.map((b) => b.key))), [loadedBooks]);
  const deselectAll = useCallback(() => { if (loadedBooks.length > 0) setSelectedBooks(new Set([loadedBooks[0].key])); }, [loadedBooks]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim();
    if (q.length < 2) return [];
    const nq = stripArabic(q);
    const active = loadedBooks.filter((b) => selectedBooks.has(b.key));
    const limit = Math.max(20, Math.floor(MAX_RESULTS / Math.max(active.length, 1)));
    const items: SearchResult[] = [];
    for (const book of active) {
      let cnt = 0;
      for (const chKey of Object.keys(book.chapters)) {
        if (cnt >= limit) break;
        const ch = book.chapters[chKey];
        if (!ch?.hadiths) continue;
        const chTitle = ch.chapter?.arabic || ch.metadata?.arabic?.introduction || "";
        for (const h of ch.hadiths) {
          if (cnt >= limit) break;
          const raw = h.arabic || "";
          if (stripArabic(raw).includes(nq)) {
            items.push({ key: `${book.key}-${chKey}-${h.idInBook ?? h.id}`, bookTitle: book.titleAr, chapterId: Number(chKey), chapterTitle: chTitle, hadithId: h.idInBook ?? h.id ?? 0, text: raw.replace(/["']/g, "").trim(), route: book.route });
            cnt++;
          }
        }
      }
    }
    return items;
  }, [query, selectedBooks, loadedBooks]);

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 4 }]}>
        <View style={s.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </Pressable>
          <Text style={s.headerTitle}>بحث في الحديث</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <View style={{ flex: 1, width: contentWidth, alignSelf: "center" }}>
        <View style={s.searchWrap}>
          <View style={s.searchBox}>
            <TextInput ref={inputRef} value={query} onChangeText={setQuery} placeholder="اكتب كلمة للبحث في الأحاديث..." placeholderTextColor={SECONDARY} style={s.searchInput} returnKeyType="search" autoFocus onSubmitEditing={() => Keyboard.dismiss()} />
            {query.length > 0 && <Pressable onPress={() => setQuery("")} hitSlop={10}><Ionicons name="close-circle" size={20} color={SECONDARY} /></Pressable>}
            <Feather name="search" size={18} color={SECONDARY} />
          </View>
        </View>

        {loadingBooks ? (
          <View style={s.empty}><ActivityIndicator size="large" color={GREEN} /><Text style={s.emptyDesc}>جاري تحميل الكتب...</Text></View>
        ) : loadedBooks.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}><Ionicons name="cloud-download-outline" size={48} color={SECONDARY} /></View>
            <Text style={s.emptyTitle}>لا توجد كتب محملة</Text>
            <Text style={s.emptyDesc}>قم بتحميل الكتب أولاً من شاشة كتب الحديث</Text>
          </View>
        ) : (
          <>
            <Pressable style={s.filterToggle} onPress={() => setShowFilters(!showFilters)}>
              <Ionicons name={showFilters ? "chevron-up" : "chevron-down"} size={16} color={GREEN} />
              <Text style={s.filterText}>{selectedBooks.size === loadedBooks.length ? "البحث في جميع الكتب" : `البحث في ${selectedBooks.size} كتب`}</Text>
              <Feather name="filter" size={16} color={GREEN} />
            </Pressable>

            {showFilters && (
              <View style={s.filterPanel}>
                <View style={s.filterActions}>
                  <Pressable onPress={selectAll} style={s.filterBtn}><Text style={s.filterBtnText}>تحديد الكل</Text></Pressable>
                  <Pressable onPress={deselectAll} style={s.filterBtn}><Text style={s.filterBtnText}>إلغاء الكل</Text></Pressable>
                </View>
                <View style={s.chipGrid}>
                  {loadedBooks.map((b) => {
                    const on = selectedBooks.has(b.key);
                    return (
                      <Pressable key={b.key} style={[s.chip, on && s.chipOn]} onPress={() => toggleBook(b.key)}>
                        <Ionicons name={on ? "checkmark-circle" : "ellipse-outline"} size={18} color={on ? "#FFF" : GREEN} style={{ marginLeft: 4 }} />
                        <Text style={[s.chipText, on && s.chipTextOn]}>{b.titleAr}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {query.length < 2 ? (
              <View style={s.empty}><View style={s.emptyIcon}><Feather name="search" size={48} color={GREEN} /></View><Text style={s.emptyTitle}>بحث في الأحاديث</Text><Text style={s.emptyDesc}>اكتب كلمتين على الأقل للبحث</Text></View>
            ) : results.length === 0 ? (
              <View style={s.empty}><View style={s.emptyIcon}><Feather name="inbox" size={48} color={SECONDARY} /></View><Text style={s.emptyTitle}>لا توجد نتائج</Text><Text style={s.emptyDesc}>جرّب كلمات أخرى أو غيّر الكتب المحددة</Text></View>
            ) : (
              <FlatList
                data={results} keyExtractor={(i) => i.key}
                contentContainerStyle={{ paddingBottom: tabBarHeight + 24, paddingHorizontal: 14, paddingTop: 8 }}
                showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
                ListHeaderComponent={<Text style={s.count}>{results.length >= MAX_RESULTS ? `أكثر من ${MAX_RESULTS} نتيجة` : `${results.length} نتيجة`}</Text>}
                renderItem={({ item }) => (
                  <Pressable style={s.resultCard} onPress={() => { Keyboard.dismiss(); navigation.navigate(item.route as any, { chapterId: item.chapterId, highlightId: item.hadithId }); }}>
                    <View style={s.resultTop}>
                      <Ionicons name="chevron-back" size={16} color="#C8B99A" />
                      <View style={s.resultMeta}><Text style={s.resultBook}>{item.bookTitle}</Text><Text style={s.resultChap}>{item.chapterTitle}</Text></View>
                      <View style={s.badge}><Text style={s.badgeText}>{item.hadithId}</Text></View>
                    </View>
                    <HighlightedText text={item.text} query={query} />
                  </Pressable>
                )}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },
  header: { backgroundColor: HEADER_BG, paddingBottom: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "CairoBold", fontSize: 20, color: "#FFF", textAlign: "center", flex: 1 },
  searchWrap: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 4 },
  searchBox: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: CARD_BG, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontFamily: "Cairo", fontSize: 15, color: PRIMARY, textAlign: "right", writingDirection: "rtl", paddingVertical: 0 },
  filterToggle: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 14 },
  filterText: { fontFamily: "Cairo", fontSize: 13, color: GREEN },
  filterPanel: { marginHorizontal: 14, backgroundColor: CARD_BG, borderRadius: 16, padding: 14, marginBottom: 8 },
  filterActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginBottom: 10 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: "#F0ECE3" },
  filterBtnText: { fontFamily: "Cairo", fontSize: 12, color: GREEN },
  chipGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row-reverse", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5, borderColor: GREEN },
  chipOn: { backgroundColor: GREEN, borderColor: GREEN },
  chipText: { fontFamily: "Cairo", fontSize: 13, color: GREEN },
  chipTextOn: { color: "#FFF" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(45,122,78,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontFamily: "CairoBold", fontSize: 20, color: PRIMARY, marginBottom: 8 },
  emptyDesc: { fontFamily: "Cairo", fontSize: 14, color: SECONDARY, textAlign: "center" },
  count: { fontFamily: "Cairo", fontSize: 13, color: SECONDARY, textAlign: "right", marginBottom: 10, paddingHorizontal: 4 },
  resultCard: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, marginBottom: 10 },
  resultTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  resultMeta: { flex: 1, gap: 2 },
  resultBook: { fontFamily: "CairoBold", fontSize: 14, color: PRIMARY, textAlign: "right" },
  resultChap: { fontFamily: "Cairo", fontSize: 12, color: GREEN, textAlign: "right" },
  badge: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#E8E3D9", alignItems: "center", justifyContent: "center" },
  badgeText: { fontFamily: "CairoBold", fontSize: 13, color: "#4A4036" },
});
