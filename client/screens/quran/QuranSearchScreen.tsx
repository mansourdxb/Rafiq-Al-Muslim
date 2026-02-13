import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather, Ionicons } from "@expo/vector-icons";

import { buildQuranSearchIndexOnce, searchQuran, type SearchHit } from "@/src/lib/quran/searchQuran";
import { arabicIndic, getPageForAyah } from "@/src/lib/quran/mushaf";
import type { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteParams = {
  QuranSearch?: { initialQuery?: string };
};

const RESULT_LIMIT = 50;
const AR = {
  cancel: "\u0625\u0644\u063a\u0627\u0621",
  searchPlaceholder: "\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064a\u0645",
  results: "\u0646\u062a\u0627\u0626\u062c \u0627\u0644\u0628\u062d\u062b",
  noResults: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c",
};

export default function QuranSearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<
    CompositeNavigationProp<
      NativeStackNavigationProp<LibraryStackParamList>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();
  const route = useRoute<RouteProp<RouteParams, "QuranSearch">>();
  const [query, setQuery] = useState(route.params?.initialQuery ?? "");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    let mounted = true;
    buildQuranSearchIndexOnce()
      .then(() => {
        if (mounted) setLoadingIndex(false);
      })
      .catch(() => {
        if (mounted) setLoadingIndex(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoadingSearch(false);
      return;
    }
    setLoadingSearch(true);
    const t = setTimeout(() => {
      searchQuran(q, RESULT_LIMIT)
        .then((items) => setResults(items))
        .finally(() => setLoadingSearch(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const showEmpty = useMemo(() => {
    const q = query.trim();
    return q.length >= 2 && !loadingSearch && results.length === 0;
  }, [query, loadingSearch, results.length]);

  const openResult = (hit: SearchHit) => {
    navigation.navigate("QuranReader", {
      sura: hit.sura,
      aya: hit.aya,
      page: getPageForAyah(hit.sura, hit.aya),
      source: "search",
      navToken: Date.now(),
    });
  };

  const renderHighlightedText = (text: string, rawQuery: string) => {
    const q = rawQuery.trim();
    if (q.length < 2) {
      return <Text style={styles.snippet}>{text}</Text>;
    }
    const idx = text.indexOf(q);
    if (idx < 0) {
      return <Text style={styles.snippet}>{text}</Text>;
    }
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + q.length);
    const after = text.slice(idx + q.length);
    return (
      <Text style={styles.snippet}>
        {before}
        <Text style={styles.snippetHighlight}>{match}</Text>
        {after}
      </Text>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <Text style={styles.cancelText}>{AR.cancel}</Text>
          <View style={styles.cancelDot}>
            <Feather name="x" size={14} color="#6E5A46" />
          </View>
        </Pressable>
        <View style={styles.searchWrap}>
          <Feather name="search" size={18} color="#7C6B5A" style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={AR.cancel}
            placeholderTextColor="#9A8C7A"
            style={styles.searchInput}
            textAlign="right"
            writingDirection="rtl"
            autoFocus
          />
        </View>
      </View>

      <View style={styles.resultsHeader}></View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{`${AR.results} (${results.length})`}</Text>
      </View>

      {loadingIndex ? (
        <Text style={styles.loadingText}>جارٍ تجهيز الفهرس...</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.sura}-${item.aya}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable onPress={() => openResult(item)} style={styles.resultRow}>
              <Text style={styles.pageNumber}>{arabicIndic(getPageForAyah(item.sura, item.aya))}</Text>
              <View style={styles.resultBody}>
                <Text style={styles.metaText}>{`${item.surahName}: ${arabicIndic(item.aya)}`}</Text>
                <View style={styles.snippetWrap}>{renderHighlightedText(item.text, query)}</View>
              </View>
            </Pressable>
          )}

          ListEmptyComponent={
            showEmpty ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>لا توجد نتائج</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingSearch ? <Text style={styles.loadingText}>جارٍ البحث...</Text> : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <Pressable style={styles.navItem} onPress={() => {/* Navigate to More */}}>
          <Ionicons name="ellipsis-horizontal" size={26} color="#8B7B6A" />
          <Text style={styles.navText}>المزيد</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => {/* Navigate to Athkar */}}>
          <Ionicons name="color-palette-outline" size={26} color="#8B7B6A" />
          <Text style={styles.navText}>الأذكار</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => {/* Navigate to Hadith */}}>
          <Ionicons name="chatbubbles-outline" size={26} color="#8B7B6A" />
          <Text style={styles.navText}>الحديث</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => {/* Current: Quran */}}>
          <View style={styles.quranIconContainer}>
            <Ionicons name="book" size={26} color="#D4A56A" />
          </View>
          <Text style={[styles.navText, styles.navTextActive]}>القرآن</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => {/* Navigate to Prayer */}}>
          <Ionicons name="moon-outline" size={26} color="#8B7B6A" />
          <Text style={styles.navText}>الصلاة</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F7F1E8",
  },
  topBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 12,
  },
  cancelButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  cancelText: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#2F6E52",
  },
  cancelDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D7D2C9",
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flex: 1,
    backgroundColor: "#F3EEE4",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  searchIcon: {
    marginStart: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Cairo",
    fontSize: 15,
    color: "#1F2A24",
  },
  resultsHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  resultsCount: {
    color: "#1F2A24",
    fontFamily: "CairoBold",
    fontSize: 22,
  },
  filterRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  filterText: {
    color: "#6C7A73",
    fontFamily: "Cairo",
    fontSize: 12,
  },
  list: {
    paddingBottom: 120,
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  resultRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E4D8C8",
    backgroundColor: "transparent",
  },
  resultBody: {
    flex: 1,
    gap: 8,
  },
  pageNumber: {
    minWidth: 36,
    fontFamily: "CairoBold",
    fontSize: 18,
    color: "#A49384",
    textAlign: "left",
  },
  metaText: {
    color: "#1F2A24",
    fontFamily: "CairoBold",
    fontSize: 18,
  },
  snippetWrap: {
    paddingTop: 2,
  },
  snippet: {
    color: "#8B7B6A",
    fontFamily: "UthmanicHafs",
    fontSize: 18,
    lineHeight: 34,
    writingDirection: "rtl",
    textAlign: "right",
  },
  snippetHighlight: {
    color: "#8B7B6A",
    fontFamily: "UthmanicHafs",
  },
  loadingText: {
    color: "#6C7A73",
    fontFamily: "Cairo",
    textAlign: "right",
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  empty: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    color: "#6C7A73",
    fontFamily: "Cairo",
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#F5F1E8",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: "center",
    gap: 2,
  },
  navText: {
    fontFamily: "Cairo",
    fontSize: 11,
    color: "#8B7B6A",
  },
  navTextActive: {
    color: "#D4A56A",
    fontFamily: "CairoBold",
  },
  quranIconContainer: {
    // Match Quran index nav styling
  },
});
