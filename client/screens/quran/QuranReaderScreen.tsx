import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import QuranSurahDetailsScreen from "@/screens/quran/QuranSurahDetailsScreen";
import { quranFiles } from "@/lib/quran/quranFiles";
import { loadMarks, removeBookmark } from "@/src/lib/quran/ayahMarks";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import QuranIndexScreen from "@/screens/quran/QuranIndexScreen";
import { suraTypeAr } from "@/src/lib/quran/suraMeta";
import { SURAH_META } from "@/constants/quran/surahMeta";
import { getHizbQuarters } from "@/src/lib/quran/hizbQuarters";
import { getPageData, getPageForAyah, arabicIndic } from "@/src/lib/quran/mushaf";

const DEBUG_QURAN_NAV = true;

type Params = {
  QuranReader: {
    sura: number;
    aya?: number;
    page?: number;
    source?: "manual" | "resume" | "index";
    navToken?: number;
    openIndex?: boolean;
  };
};

const mushafPages: { index: number; sura: number; aya: number }[] = require("../../data/Quran/mushaf-pages.json");
const mushafJuz: { index: number; sura: number; aya: number }[] = require("../../data/Quran/mushaf-juz.json");

function compareAyahRef(a: { sura: number; aya: number }, b: { sura: number; aya: number }) {
  if (a.sura !== b.sura) return a.sura - b.sura;
  return a.aya - b.aya;
}

function getMushafPage(sura: number, aya: number) {
  let lo = 0;
  let hi = mushafPages.length - 1;
  let best = mushafPages[0]?.index ?? 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const ref = mushafPages[mid];
    const cmp = compareAyahRef({ sura, aya }, { sura: ref.sura, aya: ref.aya });
    if (cmp >= 0) {
      best = ref.index;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

function getMushafJuz(sura: number, aya: number) {
  let lo = 0;
  let hi = mushafJuz.length - 1;
  let best = mushafJuz[0]?.index ?? 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const ref = mushafJuz[mid];
    const cmp = compareAyahRef({ sura, aya }, { sura: ref.sura, aya: ref.aya });
    if (cmp >= 0) {
      best = ref.index;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

function findPageStart(pageNo: number) {
  return mushafPages.find((p) => p.index === pageNo);
}

export default function QuranReaderScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<Params, "QuranReader">>();
  const rawParams = (route.params as any)?.params ?? route.params;
  const hasRawParams = !!(rawParams && Object.keys(rawParams).length > 0);
  const [currentSurahNumber, setCurrentSurahNumber] = useState(1);
  const [currentSurahName, setCurrentSurahName] = useState<string>("القرآن");
  const [initialPageNo, setInitialPageNo] = useState<number | undefined>(undefined);
  const [jumpId, setJumpId] = useState<number | undefined>(undefined);
  const [jumpToPage, setJumpToPage] = useState<number | undefined>(undefined);
  const [indexVisible, setIndexVisible] = useState(false);
  const [currentJuz, setCurrentJuz] = useState<number | null>(null);
  const [highlightAyah, setHighlightAyah] = useState<{ sura: number; aya: number } | null>(null);
  const [trimBeforeSura, setTrimBeforeSura] = useState<number | undefined>(undefined);
  const [jumpLockMs, setJumpLockMs] = useState(1200);
  const [disableAutoScroll, setDisableAutoScroll] = useState(false);
  const lastAppliedTokenRef = React.useRef<number | null>(null);
  const hasExplicitNavRef = React.useRef(false);
  const [renderReady, setRenderReady] = useState(!hasRawParams);
  const [optionsToken, setOptionsToken] = useState(0);
  const [bookmarks, setBookmarks] = useState<
    {
      key: string;
      sura: number;
      ayah: number;
      surahName: string;
      pageNo: number;
      juzNo: number;
      snippet: string;
      createdAt: string;
    }[]
  >([]);
  
  function normalizeDigits(value: string) {
    const map: Record<string, string> = {
      "\u0660": "0",
      "\u0661": "1",
      "\u0662": "2",
      "\u0663": "3",
      "\u0664": "4",
      "\u0665": "5",
      "\u0666": "6",
      "\u0667": "7",
      "\u0668": "8",
      "\u0669": "9",
      "\u06F0": "0",
      "\u06F1": "1",
      "\u06F2": "2",
      "\u06F3": "3",
      "\u06F4": "4",
      "\u06F5": "5",
      "\u06F6": "6",
      "\u06F7": "7",
      "\u06F8": "8",
      "\u06F9": "9",
    };
    return value.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => map[d] ?? d);
  }

  function parseMaybeNumber(value: unknown, fallback: number) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const normalized = normalizeDigits(value);
      const digitsOnly = normalized.replace(/[^\d]/g, "");
      const parsed = Number.parseInt(digitsOnly, 10);
      if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
  }



  
  const normalizeIncomingParams = () => {
    const rawParams = (route.params as any)?.params ?? route.params;
    if (DEBUG_QURAN_NAV) {
      console.log("[QuranReader][debug] rawParams", rawParams);
    }
    const p = rawParams as
      | {
          sura?: number;
          aya?: number;
          surahNumber?: number;
          ayahNumber?: number;
          page?: number;
          navToken?: number;
          source?: "manual" | "resume" | "index" | "search" | "juz";
          openIndex?: boolean;
        }
      | undefined;

    if (!p || Object.keys(p).length === 0) {
      if (DEBUG_QURAN_NAV) {
        console.log("[QuranReader][debug] empty params");
      }
      return null;
    }
    const sura = parseMaybeNumber(p.sura ?? p.surahNumber, 0);
    const aya = parseMaybeNumber(p.aya ?? p.ayahNumber, 1);
    const page = parseMaybeNumber(p.page, 0);
    const navToken = typeof p.navToken === "number" ? p.navToken : 0;

    const pageStart = page > 0 ? findPageStart(page) : undefined;
    const resolvedSura = sura || pageStart?.sura || 0;
    const resolvedAya = sura ? aya : pageStart?.aya ?? aya;
    const resolvedPage = page > 0 ? page : resolvedSura ? getMushafPage(resolvedSura, resolvedAya) : 0;

    if (!resolvedSura) {
      if (DEBUG_QURAN_NAV) {
        console.log("[QuranReader][debug] unresolved params", { sura, aya, page, navToken });
      }
      return null;
    }
    // If we've already applied an explicit navigation, ignore param updates without a navToken.
    if (hasExplicitNavRef.current && !navToken) {
      if (DEBUG_QURAN_NAV) {
        console.log("[QuranReader][debug] ignoring params without navToken after explicit nav");
      }
      return null;
    }
    return { sura: resolvedSura, aya: resolvedAya, page: resolvedPage, navToken, source: p.source };
  };

  useEffect(() => {
    let cancelled = false;
    if (rawParams && Object.keys(rawParams).length > 0) {
      hasExplicitNavRef.current = true;
      if (DEBUG_QURAN_NAV) {
        console.log("[QuranReader][debug] saw non-empty rawParams, mark explicit");
      }
    }
    const incoming = normalizeIncomingParams();
    console.log("[QuranReader] incoming params", incoming);

    if (incoming) {
      const { sura, aya, page, navToken, source } = incoming;
      hasExplicitNavRef.current = true;
      if (DEBUG_QURAN_NAV) {
        console.log("[QuranReader][debug] applying incoming", { sura, aya, page, navToken });
      }
      if (navToken && lastAppliedTokenRef.current === navToken) {
        return () => {
          cancelled = true;
        };
      }
      if (navToken) lastAppliedTokenRef.current = navToken;
      setCurrentSurahNumber(sura);
      setCurrentSurahName(quranFiles.find((f) => f.number === sura)?.data?.surah ?? "????");
      setInitialPageNo(page);
      if (source === "juz") {
        setJumpToPage(undefined);
        setJumpId(undefined);
      } else {
        setJumpToPage(page);
        setJumpId(navToken || Date.now());
      }
      const shouldHighlight = source === "search" || source === "resume" || (aya && aya !== 1);
      setHighlightAyah(shouldHighlight ? { sura, aya } : null);
      setTrimBeforeSura(source === "manual" && aya === 1 ? sura : undefined);
      setJumpLockMs(source === "juz" ? 3000 : 1200);
      setDisableAutoScroll(source === "juz");
      setRenderReady(true);
      return () => {
        cancelled = true;
      };
    }

    const loadLastRead = async () => {
      try {
        const raw = await AsyncStorage.getItem("quran:lastRead");
        if (!raw || cancelled) return;
        // If we navigated here with explicit params, do not override with last read.
        if (hasExplicitNavRef.current) return;
        const lastRead = JSON.parse(raw) as { surahNumber: number; ayahNumber: number; page?: number };
        console.log("[QuranReader] applying lastRead", lastRead);
        if (DEBUG_QURAN_NAV) {
          console.log("[QuranReader][debug] lastRead page", lastRead.page);
        }
        const targetSura = lastRead.surahNumber || 1;
        const targetAya = lastRead.ayahNumber || 1;
        const targetPage = lastRead.page || getMushafPage(targetSura, targetAya);
        setCurrentSurahNumber(targetSura);
        setCurrentSurahName(quranFiles.find((f) => f.number === targetSura)?.data?.surah ?? "????");
        setInitialPageNo(targetPage);
        setJumpToPage(targetPage);
        setJumpId(Date.now());
        setHighlightAyah(null);
        setTrimBeforeSura(undefined);
        setJumpLockMs(1200);
        setDisableAutoScroll(false);
        setRenderReady(true);
      } catch (err) {
        console.warn("Failed to load quran:lastRead", err);
        setRenderReady(true);
      }
    };
    loadLastRead();

    return () => {
      cancelled = true;
    };
  }, [
    rawParams?.sura,
    rawParams?.surahNumber,
    rawParams?.aya,
    rawParams?.ayahNumber,
    rawParams?.page,
    rawParams?.navToken,
    rawParams?.source,
  ]);

  useEffect(() => {
    if (!hasRawParams) return;
    if (jumpToPage || initialPageNo) {
      setRenderReady(true);
    }
  }, [hasRawParams, initialPageNo, jumpToPage]);

  const refreshBookmarks = useCallback(async () => {
    const marks = await loadMarks();
    const items: typeof bookmarks = [];
    Object.entries(marks).forEach(([key, value]) => {
      if (!value?.bookmarkColor) return;
      const [suraStr, ayahStr] = key.split(":");
      const sura = Number(suraStr);
      const ayah = Number(ayahStr);
      if (!sura || !ayah) return;
      const surah = quranFiles.find((f) => f.number === sura);
      const surahName = surah?.data?.surah ?? `???? ${sura}`;
      const pageNo = getMushafPage(sura, ayah);
      const juzNo = getMushafJuz(sura, ayah);
      const snippet =
        surah?.data?.ayahs?.find((a: any) => a.ayah_number === ayah)?.text ?? "";
      items.push({
        key,
        sura,
        ayah,
        surahName,
        pageNo,
        juzNo,
        snippet: snippet.slice(0, 120),
        createdAt: value.updatedAt ?? new Date().toISOString(),
      });
    });
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    setBookmarks(items);
  }, []);

  useEffect(() => {
    if (indexVisible) {
      refreshBookmarks();
    }
  }, [indexVisible, refreshBookmarks]);

  const surahName = currentSurahName;

  const surahList = useMemo(() => {
    const list = SURAH_META.map((m) => {
      const typeLabel = suraTypeAr(m.revelationType);
      return {
        number: m.number,
        name: m.name_ar ?? `???? ${m.number}`,
        ayahsCount: m.ayahCount,
        typeLabel,
        startPage: m.pageStart,
      };
    });
    console.log(
      "[QURAN INDEX]",
      "surahCount=",
      list.length,
      "numbers=",
      list.map((s) => s.number).slice(0, 10),
      "...",
      list.map((s) => s.number).slice(-5)
    );
    return list;
  }, []);

  const quarters = useMemo(() => {
    const quarterRefs = getHizbQuarters();
    let lastJuz: number | null = null;
    return quarterRefs.map((q, idx) => {
      const surah = quranFiles.find((f) => f.number === q.sura);
      const surahName = surah?.data?.surah ?? `???? ${q.sura}`;
      const ayahText =
        surah?.data?.ayahs?.find((a: any) => a.ayah_number === q.aya)?.text ?? "";
      const snippet = ayahText
        .replace(/\s*\n+\s*/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim()
        .slice(0, 45);
      const pageNo = getMushafPage(q.sura, q.aya);
      const juzNo = getMushafJuz(q.sura, q.aya);
      const showJuzBadge = lastJuz === null || lastJuz !== juzNo;
      lastJuz = juzNo;
      return {
        key: `${q.sura}:${q.aya}:${idx}`,
        sura: q.sura,
        aya: q.aya,
        surahName,
        pageNo,
        juzNo,
        snippet,
        showJuzBadge,
      };
    });
  }, []);

  const handlePageChange = useCallback(
    async (pageNo: number) => {
      if (DEBUG_QURAN_NAV) {
        console.log("[QuranReader][debug] onPageChange", pageNo);
      }
      const pageStart = findPageStart(pageNo);
      if (pageStart) {
        setCurrentSurahNumber(pageStart.sura);
        const page = getPageData(pageNo);
        setCurrentSurahName(
          page.surahName || (quranFiles.find((f) => f.number === pageStart.sura)?.data?.surah ?? "القرآن")
        );
        setCurrentJuz(getMushafJuz(pageStart.sura, pageStart.aya));
        const firstAyah = page.ayahs?.[0];
        if (firstAyah) {
          await AsyncStorage.setItem(
            "quran:lastRead",
            JSON.stringify({
              surahNumber: firstAyah.sura,
              ayahNumber: firstAyah.aya,
              page: pageNo,
              updatedAt: new Date().toISOString(),
            })
          );
        }
      }
    },
    []
  );

  const handleSelectSurah = (sura: number) => {
    const page = getMushafPage(sura, 1);
    const navToken = Date.now();
    navigation.setParams({ sura, aya: 1, page, source: "index", navToken });
    setIndexVisible(false);
  };

  const handleSelectJuz = (sura: number, aya: number) => {
    const page = getMushafPage(sura, aya);
    const navToken = Date.now();
    navigation.setParams({ sura, aya, page, source: "juz", navToken });
    setIndexVisible(false);
  };

  const handleSelectBookmark = (sura: number, aya: number) => {
    const page = getMushafPage(sura, aya);
    const navToken = Date.now();
    navigation.setParams({ sura, aya, page, source: "index", navToken });
    setIndexVisible(false);
  };


  const handleDeleteBookmark = async (sura: number, aya: number) => {
    await removeBookmark(sura, aya);
    await refreshBookmarks();
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.toolbar}>
        <Pressable
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }
            (navigation as any).navigate("Library");
          }}
          style={({ pressed }) => [styles.toolbarButton, pressed ? { opacity: 0.7 } : null]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"} size={22} color="#E8F2EC" />
        </Pressable>
        <Text style={styles.toolbarTitle}>{surahName}</Text>
        <View style={styles.toolbarActions}>
          <Pressable
            onPress={() => (navigation as any).navigate("QuranSearch")}
            style={({ pressed }) => [styles.iconButton, pressed ? { opacity: 0.7 } : null]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="search" size={22} color="#E8F2EC" />
          </Pressable>
          <Pressable
            onPress={() => setIndexVisible(true)}
            style={({ pressed }) => [styles.iconButton, pressed ? { opacity: 0.7 } : null]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu" size={22} color="#E8F2EC" />
          </Pressable>
        </View>
      </View>
      {renderReady ? (
        <QuranSurahDetailsScreen
          initialPageNo={initialPageNo}
          highlightAyah={highlightAyah ?? undefined}
          jumpToPage={jumpToPage}
          jumpId={jumpId}
          jumpLockMs={jumpLockMs}
          trimBeforeSura={trimBeforeSura}
          disableAutoScroll={disableAutoScroll || !!trimBeforeSura}
          onPageChange={handlePageChange}
        onVisiblePageChange={(pageNo, sura, name) => {
          if (DEBUG_QURAN_NAV) {
            console.log("[QuranReader][debug] onVisiblePageChange", { pageNo, sura, name });
          }
          setCurrentSurahNumber(sura);
          setCurrentSurahName(name || "القرآن");
          setCurrentJuz(getMushafJuz(sura, 1));
          const page = getPageData(pageNo);
          const firstAyah = page.ayahs?.[0];
          if (firstAyah) {
            void AsyncStorage.setItem(
              "quran:lastRead",
              JSON.stringify({
                surahNumber: firstAyah.sura,
                ayahNumber: firstAyah.aya,
                page: pageNo,
                updatedAt: new Date().toISOString(),
              })
            );
          }
        }}
          openOptionsToken={optionsToken}
        />
      ) : (
        <View style={{ flex: 1 }} />
      )}

      {indexVisible && Platform.OS === "web" ? (
        <View style={styles.webOverlay}>
          <QuranIndexScreen
            inline
            visible={indexVisible}
            onClose={() => setIndexVisible(false)}
            surahs={surahList}
            juzList={mushafJuz.map((j) => ({ ...j, startPage: getMushafPage(j.sura, j.aya) }))}
            bookmarks={bookmarks}
            currentSurah={currentSurahNumber}
            currentJuz={currentJuz}
            quarters={quarters}
            onSelectSurah={handleSelectSurah}
            onSelectJuz={handleSelectJuz}
            onSelectBookmark={handleSelectBookmark}
            onDeleteBookmark={handleDeleteBookmark}
          />
        </View>
      ) : (
        <QuranIndexScreen
          visible={indexVisible}
          onClose={() => setIndexVisible(false)}
          surahs={surahList}
          juzList={mushafJuz.map((j) => ({ ...j, startPage: getMushafPage(j.sura, j.aya) }))}
          bookmarks={bookmarks}
          currentSurah={currentSurahNumber}
          currentJuz={currentJuz}
          quarters={quarters}
          onSelectSurah={handleSelectSurah}
          onSelectJuz={handleSelectJuz}
          onSelectBookmark={handleSelectBookmark}
          onDeleteBookmark={handleDeleteBookmark}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#EFE8DD",
  },
  toolbar: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2F5B4F",
  },
  toolbarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbarTitle: {
    fontFamily: "CairoBold",
    fontSize: 20,
    color: "#E8F2EC",
    textAlign: "center",
  },
  toolbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  juzText: {
    fontFamily: "Cairo",
    fontSize: 13,
    color: "#CFE0D6",
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: "#E8F2EC",
  },
  webOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },
});
