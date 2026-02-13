import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  I18nManager,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { buildQuranSearchIndexOnce, searchQuran, type SearchHit } from "@/src/lib/quran/searchQuran";
import { arabicIndic, getPageForAyah } from "@/src/lib/quran/mushaf";
import { SURAH_META } from "@/constants/quran/surahMeta";
import type { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteParams = {
  QuranSearch?: { initialQuery?: string };
};

const RESULT_LIMIT = 50;
const AR = {
  title: "\u0646\u062a\u0627\u0626\u062c \u0627\u0644\u0628\u062d\u062b",
  results: "\u0646\u062a\u064a\u062c\u0629",
  searchPlaceholder: "\u0627\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0642\u0631\u0622\u0646",
  noResults: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c",
  loadingIndex: "\u062c\u0627\u0631\u064d \u062a\u062c\u0647\u064a\u0632 \u0627\u0644\u0641\u0647\u0631\u0633...",
  loadingSearch: "\u062c\u0627\u0631\u064d \u0627\u0644\u0628\u062d\u062b...",
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getRevelationArabic(sura: number) {
  const surah = SURAH_META.find((s) => s.number === sura);
  return surah?.revelationType === "meccan"
    ? "\u0645\u0643\u064a\u0629"
    : "\u0645\u062f\u0646\u064a\u0629";
}

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
      return <Text style={styles.resultSnippet}>{text}</Text>;
    }

    const regex = new RegExp(`(${escapeRegExp(q)})`, "gi");
    const chunks = text.split(regex);

    return (
      <Text style={styles.resultSnippet}>
        {chunks.map((chunk, index) => {
          const isMatch = chunk.toLowerCase() === q.toLowerCase();
          return (
            <Text key={`${chunk}-${index}`} style={isMatch ? styles.resultSnippetHighlight : undefined}>
              {chunk}
            </Text>
          );
        })}
      </Text>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={I18nManager.isRTL ? "chevron-forward" : "chevron-back"}
            size={22}
            color="#FFFFFF"
          />
        </Pressable>

        <Text style={styles.headerTitle}>{AR.title}</Text>

        <View style={styles.headerCountWrap}>
          <Text style={styles.headerCount}>{`${arabicIndic(results.length)} ${AR.results}`}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9B958C" style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={AR.searchPlaceholder}
          placeholderTextColor="#A7A198"
          style={styles.searchInput}
          textAlign="right"
          writingDirection="rtl"
          autoFocus
          returnKeyType="search"
        />
      </View>

      {loadingIndex ? (
        <Text style={styles.loadingText}>{AR.loadingIndex}</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.sura}-${item.aya}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable onPress={() => openResult(item)} style={styles.resultCard}>
              <View style={styles.resultHeaderRow}>
                <Text style={styles.resultType}>{getRevelationArabic(item.sura)}</Text>
                <Text style={styles.resultMeta}>
                  <Text style={styles.resultSurah}>{`\u0633\u0648\u0631\u0629 ${item.surahName}`}</Text>
                  <Text style={styles.resultBullet}>{" \u2022 "}</Text>
                  <Text style={styles.resultAyahNo}>{arabicIndic(item.aya)}</Text>
                </Text>
              </View>

              <View style={styles.resultDivider} />

              {renderHighlightedText(item.text, query)}
            </Pressable>
          )}
          ListEmptyComponent={
            showEmpty ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{AR.noResults}</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingSearch ? <Text style={styles.loadingText}>{AR.loadingSearch}</Text> : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F6F4F0",
  },
  header: {
    backgroundColor: "#174A3D",
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBack: {
    width: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontFamily: "CairoBold",
    fontSize: 29,
    textAlign: "center",
  },
  headerCountWrap: {
    width: 76,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerCount: {
    color: "#EAF2EE",
    fontFamily: "Cairo",
    fontSize: 14,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DAD5CC",
    backgroundColor: "#F6F4F0",
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginStart: 6,
  },
  searchInput: {
    flex: 1,
    color: "#26362F",
    fontSize: 24,
    fontFamily: "Cairo",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 130,
    gap: 14,
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  resultHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultType: {
    color: "#B4AEA5",
    fontFamily: "Cairo",
    fontSize: 13,
  },
  resultMeta: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  resultSurah: {
    color: "#1B4F3E",
    fontFamily: "CairoBold",
    fontSize: 16,
  },
  resultBullet: {
    color: "#B4AEA5",
    fontFamily: "Cairo",
    fontSize: 16,
  },
  resultAyahNo: {
    color: "#C8A44C",
    fontFamily: "CairoBold",
    fontSize: 18,
  },
  resultDivider: {
    marginTop: 10,
    marginBottom: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#EEEAE4",
  },
  resultSnippet: {
    textAlign: "center",
    writingDirection: "rtl",
    color: "#1F4E3B",
    fontFamily: "KFGQPCUthmanicScript",
    fontSize: 22,
    lineHeight: 40,
  },
  resultSnippetHighlight: {
    color: "#C8A44C",
    fontFamily: "KFGQPCUthmanicScript",
  },
  loadingText: {
    textAlign: "center",
    color: "#6E6A64",
    fontFamily: "Cairo",
    paddingVertical: 16,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    color: "#7E776F",
    fontFamily: "Cairo",
    fontSize: 16,
  },
});
