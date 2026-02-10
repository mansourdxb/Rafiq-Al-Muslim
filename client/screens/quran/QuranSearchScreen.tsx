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
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="chevron-right" size={22} color="#F7F4EE" />
          </Pressable>
          <Text style={styles.headerTitle}>{"\u0627\u0644\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064a\u0645"}</Text>
        </View>

        <View style={styles.searchWrap}>
          <Feather name="search" size={18} color="#5E6D64" style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={"\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064a\u0645"}
            placeholderTextColor="#9AA5A1"
            style={styles.searchInput}
            textAlign="right"
            writingDirection="rtl"
            autoFocus
          />
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {query.trim().length >= 2 ? `نتائج البحث (${results.length} نتيجة)` : "نتائج البحث (٠ نتيجة)"}
        </Text>
        <View style={styles.filterRow}>
          <Feather name="sliders" size={16} color="#6C7A73" />
          <Text style={styles.filterText}>تصفية</Text>
        </View>
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
              <View style={styles.metaRow}>
                <View style={styles.ayahBadge}>
                  <Text style={styles.ayahBadgeText}>{`آية ${arabicIndic(item.aya)}`}</Text>
                </View>
                <Text style={styles.metaText}>{item.surahName}</Text>
              </View>
              <View style={styles.snippetWrap}>{renderHighlightedText(item.text, query)}</View>
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
          <Ionicons name="ellipsis-horizontal" size={22} color="#9AA5A1" />
          <Text style={styles.navText}>المزيد</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => {/* Navigate to Athkar */}}>
          <Ionicons name="color-palette-outline" size={22} color="#9AA5A1" />
          <Text style={styles.navText}>الأذكار</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => {/* Navigate to Hadith */}}>
          <Ionicons name="chatbubbles-outline" size={22} color="#9AA5A1" />
          <Text style={styles.navText}>الحديث</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => {/* Current: Quran */}}>
          <View style={styles.quranIconContainer}>
            <Ionicons name="book" size={22} color="#1B4332" />
          </View>
          <Text style={[styles.navText, styles.navTextActive]}>القرآن</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => {/* Navigate to Prayer */}}>
          <Ionicons name="moon-outline" size={22} color="#9AA5A1" />
          <Text style={styles.navText}>الصلاة</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F6F2",
  },
  headerCard: {
    backgroundColor: "#1B4332",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 14,
  },
  headerTop: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    color: "#F7F4EE",
    fontFamily: "CairoBold",
    fontSize: 18,
  },
  searchWrap: {
    backgroundColor: "#F7F4EE",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    color: "#1C2B23",
  },
  resultsHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  resultsCount: {
    color: "#6C7A73",
    fontFamily: "Cairo",
    fontSize: 13,
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
    gap: 16,
    paddingBottom: 110,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  resultRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#EEF2EE",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  metaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaText: {
    color: "#1B4332",
    fontFamily: "CairoBold",
    fontSize: 14,
  },
  ayahBadge: {
    backgroundColor: "#F0F2EE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ayahBadgeText: {
    color: "#1B4332",
    fontFamily: "Cairo",
    fontSize: 12,
  },
  snippetWrap: {
    borderTopWidth: 1,
    borderTopColor: "#EEF2EE",
    paddingTop: 10,
  },
  snippet: {
    color: "#1C2B23",
    fontFamily: "UthmanicHafs",
    fontSize: 18,
    lineHeight: 30,
    writingDirection: "rtl",
    textAlign: "right",
  },
  snippetHighlight: {
    color: "#D4AF37",
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
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  navItem: {
    alignItems: "center",
    gap: 2,
  },
  navText: {
    fontFamily: "Cairo",
    fontSize: 11,
    color: "#9AA5A1",
  },
  navTextActive: {
    color: "#1B4332",
    fontFamily: "CairoBold",
  },
  quranIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9EEE9",
  },
});
