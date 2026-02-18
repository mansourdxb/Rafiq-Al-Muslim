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
import { useNavigation } from "@react-navigation/native";
import { Ionicons, Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HadithStackParamList } from "@/navigation/HadithStackNavigator";

/* ─── Data imports ─── */
import bukhariIndex from "@/data/the_9_books/bukhari/index.json";
import muslimIndex from "@/data/the_9_books/muslim/index.json";
import abudawudIndex from "@/data/the_9_books/abudawud/index.json";
import tirmidhiIndex from "@/data/the_9_books/tirmidhi/index.json";
import nasaiIndex from "@/data/the_9_books/nasai/index.json";
import ibnmajahIndex from "@/data/the_9_books/ibnmajah/index.json";
import malikIndex from "@/data/the_9_books/malik/index.json";
import ahmedIndex from "@/data/the_9_books/ahmed/index.json";
import darimiIndex from "@/data/the_9_books/darimi/index.json";

import bukhariChapters from "@/data/the_9_books/bukhari/chapters";
import muslimChapters from "@/data/the_9_books/muslim/chapters";
import abudawudChapters from "@/data/the_9_books/abudawud/chapters";
import tirmidhiChapters from "@/data/the_9_books/tirmidhi/chapters";
import nasaiChapters from "@/data/the_9_books/nasai/chapters";
import ibnmajahChapters from "@/data/the_9_books/ibnmajah/chapters";
import malikChapters from "@/data/the_9_books/malik/chapters";
import ahmedChapters from "@/data/the_9_books/ahmed/chapters";
import darimiChapters from "@/data/the_9_books/darimi/chapters";

/* ─── Constants ─── */
const HEADER_BG = "#1B4332";
const PAGE_BG = "#F3EEE4";
const CARD_BG = "#FFFFFF";
const PRIMARY = "#1C1714";
const SECONDARY = "#968C80";
const GREEN = "#2D7A4E";
const GOLD = "#B38B2D";

type BookConfig = {
  id: string;
  titleAr: string;
  route: keyof HadithStackParamList;
  index: any;
  chapters: any;
};

const BOOKS: BookConfig[] = [
  { id: "bukhari", titleAr: bukhariIndex.titleAr, route: "BukhariChapter", index: bukhariIndex, chapters: bukhariChapters },
  { id: "muslim", titleAr: muslimIndex.titleAr, route: "MuslimChapter", index: muslimIndex, chapters: muslimChapters },
  { id: "abudawud", titleAr: abudawudIndex.titleAr, route: "AbuDawudChapter", index: abudawudIndex, chapters: abudawudChapters },
  { id: "tirmidhi", titleAr: tirmidhiIndex.titleAr, route: "TirmidhiChapter", index: tirmidhiIndex, chapters: tirmidhiChapters },
  { id: "nasai", titleAr: nasaiIndex.titleAr, route: "NasaiChapter", index: nasaiIndex, chapters: nasaiChapters },
  { id: "ibnmajah", titleAr: ibnmajahIndex.titleAr, route: "IbnMajahChapter", index: ibnmajahIndex, chapters: ibnmajahChapters },
  { id: "malik", titleAr: malikIndex.titleAr, route: "MalikChapter", index: malikIndex, chapters: malikChapters },
  { id: "ahmed", titleAr: ahmedIndex.titleAr, route: "AhmedChapter", index: ahmedIndex, chapters: ahmedChapters },
  { id: "darimi", titleAr: darimiIndex.titleAr, route: "DarimiChapter", index: darimiIndex, chapters: darimiChapters },
];

type SearchResult = {
  key: string;
  bookId: string;
  bookTitle: string;
  chapterId: number;
  chapterTitle: string;
  hadithId: number | string;
  text: string;
  route: keyof HadithStackParamList;
};

function cleanText(text: string) { return text.replace(/["']/g, "").trim(); }

const MAX_RESULTS = 100;

/* ─── Highlighted text helper ─── */
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

  // Build mapping: for each char in original text, track its index in stripped text
  // and reverse: for each stripped index, track the original index range
  const origToStripped: number[] = []; // origToStripped[origIdx] = strippedIdx (or -1 if removed)
  const strippedToOrigStart: number[] = [];
  let stripped = "";

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const s = stripArabic(ch);
    if (s.length > 0) {
      origToStripped.push(stripped.length);
      strippedToOrigStart.push(i);
      stripped += s;
    } else {
      origToStripped.push(-1); // tashkeel char, maps to nothing
    }
  }
  strippedToOrigStart.push(text.length); // sentinel

  // Find all match positions in stripped text
  const matchRanges: { start: number; end: number }[] = [];
  let searchPos = 0;
  while (searchPos <= stripped.length - strippedQuery.length) {
    const idx = stripped.indexOf(strippedQuery, searchPos);
    if (idx === -1) break;
    // Map stripped positions back to original positions
    const origStart = strippedToOrigStart[idx];
    const origEnd = strippedToOrigStart[idx + strippedQuery.length] ?? text.length;
    matchRanges.push({ start: origStart, end: origEnd });
    searchPos = idx + 1;
  }

  if (matchRanges.length === 0) return <Text style={hStyles.base}>{text}</Text>;

  // Build parts
  const parts: { text: string; highlight: boolean }[] = [];
  let cursor = 0;
  for (const { start, end } of matchRanges) {
    if (start > cursor) {
      parts.push({ text: text.slice(cursor, start), highlight: false });
    }
    parts.push({ text: text.slice(start, end), highlight: true });
    cursor = end;
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), highlight: false });
  }

  return (
    <Text style={hStyles.base}>
      {parts.map((part, i) =>
        part.highlight ? (
          <Text key={i} style={hStyles.highlight}>{part.text}</Text>
        ) : (
          <Text key={i}>{part.text}</Text>
        )
      )}
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
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set(BOOKS.map((b) => b.id)));
  const [showFilters, setShowFilters] = useState(false);

  const toggleBook = useCallback((bookId: string) => {
    setSelectedBooks((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        if (next.size > 1) next.delete(bookId); // keep at least 1
      } else {
        next.add(bookId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedBooks(new Set(BOOKS.map((b) => b.id)));
  }, []);

  const deselectAll = useCallback(() => {
    // Keep only the first book
    setSelectedBooks(new Set([BOOKS[0].id]));
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim();
    if (q.length < 2) return [];

    const normalizedQuery = stripArabic(q);
    const activeBooks = BOOKS.filter((b) => selectedBooks.has(b.id));
    const perBookLimit = Math.max(20, Math.floor(MAX_RESULTS / Math.max(activeBooks.length, 1)));
    const allItems: SearchResult[] = [];

    for (const book of activeBooks) {
      let bookCount = 0;
      const chapterKeys = Object.keys(book.chapters);

      for (const chKey of chapterKeys) {
        if (bookCount >= perBookLimit) break;
        const ch = (book.chapters as any)[chKey];
        if (!ch?.hadiths) continue;

        const chTitle = ch.chapter?.arabic || ch.metadata?.arabic?.introduction || "";

        for (const hadith of ch.hadiths) {
          if (bookCount >= perBookLimit) break;

          const rawText = hadith.arabic || "";
          const normalizedText = stripArabic(rawText);

          if (normalizedText.includes(normalizedQuery)) {
            allItems.push({
              key: `${book.id}-${chKey}-${hadith.idInBook ?? hadith.id}`,
              bookId: book.id,
              bookTitle: book.titleAr,
              chapterId: Number(chKey),
              chapterTitle: chTitle,
              hadithId: hadith.idInBook ?? hadith.id ?? 0,
              text: rawText.replace(/["']/g, "").trim(),
              route: book.route,
            });
            bookCount++;
          }
        }
      }
    }

    return allItems;
  }, [query, selectedBooks]);

  const selectedCount = selectedBooks.size;
  const allSelected = selectedCount === BOOKS.length;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>{"\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u062d\u062f\u064a\u062b"}</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <View style={{ flex: 1, width: contentWidth, alignSelf: "center" }}>
        {/* Search bar */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder={"\u0627\u0643\u062a\u0628 \u0643\u0644\u0645\u0629 \u0644\u0644\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0623\u062d\u0627\u062f\u064a\u062b..."}
              placeholderTextColor={SECONDARY}
              style={styles.searchInput}
              returnKeyType="search"
              autoFocus
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={10}>
                <Ionicons name="close-circle" size={20} color={SECONDARY} />
              </Pressable>
            )}
            <Feather name="search" size={18} color={SECONDARY} />
          </View>
        </View>

        {/* Filter toggle */}
        <Pressable style={styles.filterToggle} onPress={() => setShowFilters(!showFilters)}>
          <Ionicons name={showFilters ? "chevron-up" : "chevron-down"} size={16} color={GREEN} />
          <Text style={styles.filterToggleText}>
            {allSelected
              ? "\u0627\u0644\u0628\u062d\u062b \u0641\u064a \u062c\u0645\u064a\u0639 \u0627\u0644\u0643\u062a\u0628"
              : `\u0627\u0644\u0628\u062d\u062b \u0641\u064a ${selectedCount} \u0643\u062a\u0628`}
          </Text>
          <Feather name="filter" size={16} color={GREEN} />
        </Pressable>

        {/* Book filter chips */}
        {showFilters && (
          <View style={styles.filterPanel}>
            <View style={styles.filterActions}>
              <Pressable onPress={selectAll} style={styles.filterActionBtn}>
                <Text style={styles.filterActionText}>{"\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0643\u0644"}</Text>
              </Pressable>
              <Pressable onPress={deselectAll} style={styles.filterActionBtn}>
                <Text style={styles.filterActionText}>{"\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0643\u0644"}</Text>
              </Pressable>
            </View>
            <View style={styles.chipGrid}>
              {BOOKS.map((book) => {
                const isActive = selectedBooks.has(book.id);
                return (
                  <Pressable
                    key={book.id}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => toggleBook(book.id)}
                  >
                    <Ionicons
                      name={isActive ? "checkmark-circle" : "ellipse-outline"}
                      size={18}
                      color={isActive ? "#FFF" : GREEN}
                      style={{ marginLeft: 4 }}
                    />
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {book.titleAr}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Results */}
        {query.length < 2 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="search" size={48} color={GREEN} />
            </View>
            <Text style={styles.emptyTitle}>{"\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0623\u062d\u0627\u062f\u064a\u062b"}</Text>
            <Text style={styles.emptyDesc}>{"\u0627\u0643\u062a\u0628 \u0643\u0644\u0645\u062a\u064a\u0646 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0644\u0644\u0628\u062d\u062b"}</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="inbox" size={48} color={SECONDARY} />
            </View>
            <Text style={styles.emptyTitle}>{"\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c"}</Text>
            <Text style={styles.emptyDesc}>{"\u062c\u0631\u0651\u0628 \u0643\u0644\u0645\u0627\u062a \u0623\u062e\u0631\u0649 \u0623\u0648 \u063a\u064a\u0651\u0631 \u0627\u0644\u0643\u062a\u0628 \u0627\u0644\u0645\u062d\u062f\u062f\u0629"}</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ paddingBottom: tabBarHeight + 24, paddingHorizontal: 14, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <Text style={styles.resultsCount}>
                {results.length >= MAX_RESULTS
                  ? `\u0623\u0643\u062b\u0631 \u0645\u0646 ${MAX_RESULTS} \u0646\u062a\u064a\u062c\u0629`
                  : `${results.length} \u0646\u062a\u064a\u062c\u0629`}
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.resultCard}
                onPress={() => {
                  Keyboard.dismiss();
                  navigation.navigate(item.route as any, {
                    chapterId: item.chapterId,
                    highlightId: item.hadithId,
                  });
                }}
              >
                {/* Top: book + hadith number */}
                <View style={styles.resultTop}>
                  <Ionicons name="chevron-back" size={16} color="#C8B99A" />
                  <View style={styles.resultMeta}>
                    <Text style={styles.resultBook}>{item.bookTitle}</Text>
                    <Text style={styles.resultChapter}>{item.chapterTitle}</Text>
                  </View>
                  <View style={styles.resultBadge}>
                    <Text style={styles.resultBadgeText}>{item.hadithId}</Text>
                  </View>
                </View>
                {/* Hadith text preview */}
                <HighlightedText text={item.text} query={query} />
              </Pressable>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },

  /* Header */
  header: { backgroundColor: HEADER_BG, paddingBottom: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "CairoBold", fontSize: 20, color: "#FFF", textAlign: "center", flex: 1 },

  /* Search */
  searchWrap: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 4 },
  searchBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Cairo",
    fontSize: 15,
    color: PRIMARY,
    textAlign: "right",
    writingDirection: "rtl",
    paddingVertical: 0,
  },

  /* Filter toggle */
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  filterToggleText: { fontFamily: "Cairo", fontSize: 13, color: GREEN },

  /* Filter panel */
  filterPanel: {
    marginHorizontal: 14,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginBottom: 10,
  },
  filterActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F0ECE3",
  },
  filterActionText: { fontFamily: "Cairo", fontSize: 12, color: GREEN },
  chipGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: GREEN,
    backgroundColor: "transparent",
  },
  chipActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  chipText: { fontFamily: "Cairo", fontSize: 13, color: GREEN },
  chipTextActive: { color: "#FFF" },

  /* Empty state */
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(45,122,78,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontFamily: "CairoBold", fontSize: 20, color: PRIMARY, marginBottom: 8 },
  emptyDesc: { fontFamily: "Cairo", fontSize: 14, color: SECONDARY, textAlign: "center" },

  /* Results */
  resultsCount: {
    fontFamily: "Cairo",
    fontSize: 13,
    color: SECONDARY,
    textAlign: "right",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  resultCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  resultTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  resultMeta: { flex: 1, gap: 2 },
  resultBook: { fontFamily: "CairoBold", fontSize: 14, color: PRIMARY, textAlign: "right" },
  resultChapter: { fontFamily: "Cairo", fontSize: 12, color: GREEN, textAlign: "right" },
  resultBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E8E3D9",
    alignItems: "center",
    justifyContent: "center",
  },
  resultBadgeText: { fontFamily: "CairoBold", fontSize: 13, color: "#4A4036" },
  resultText: {
    fontFamily: "Cairo",
    fontSize: 15,
    lineHeight: 26,
    color: SECONDARY,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
