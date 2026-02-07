import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import QuranSurahDetailsScreen from "@/screens/quran/QuranSurahDetailsScreen";
import { quranFiles } from "@/lib/quran/quranFiles";
import { loadMarks, removeBookmark } from "@/src/lib/quran/ayahMarks";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import QuranIndexScreen from "@/screens/quran/QuranIndexScreen";
import { suraTypeAr } from "@/src/lib/quran/suraMeta";
import { SURAH_META } from "@/constants/quran/surahMeta";
import { getHizbQuarters } from "@/src/lib/quran/hizbQuarters";
import { getPageData, getPageForAyah } from "@/src/lib/quran/mushaf";

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
  const [currentSurahNumber, setCurrentSurahNumber] = useState(1);
  const [currentSurahName, setCurrentSurahName] = useState<string>("القرآن");
  const [initialPageNo, setInitialPageNo] = useState<number | undefined>(undefined);
  const [jumpId, setJumpId] = useState<number | undefined>(undefined);
  const [jumpToPage, setJumpToPage] = useState<number | undefined>(undefined);
  const [indexVisible, setIndexVisible] = useState(false);
  const [currentJuz, setCurrentJuz] = useState<number | null>(null);
  const [highlightAyah, setHighlightAyah] = useState<{ sura: number; aya: number } | null>(null);
  const lastAppliedTokenRef = React.useRef<number | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    const p = route.params as
      | {
          sura?: number;
          aya?: number;
          page?: number;
          navToken?: number;
          source?: "manual" | "resume" | "index";
          openIndex?: boolean;
        }
      | undefined;
    const hasAnyParam = !!p && Object.keys(p).length > 0;
    const sura = p?.sura;
    const aya = p?.aya ?? 1;
    const page = p?.page;
    const token = p?.navToken ?? 0;

    if (hasAnyParam && !sura) {
      console.warn("QuranReader opened with params but missing `sura`:", p);
      setCurrentSurahNumber(1);
      setCurrentSurahName(quranFiles.find((f) => f.number === 1)?.data?.surah ?? "القرآن");
      setInitialPageNo(1);
      setJumpToPage(1);
      setJumpId(Date.now());
      setHighlightAyah({ sura: 1, aya: 1 });
      return () => {
        cancelled = true;
      };
    }

    if (sura) {
      if (token && lastAppliedTokenRef.current === token) {
        return () => {
          cancelled = true;
        };
      }
      if (token) lastAppliedTokenRef.current = token;
      const targetPage = page ?? getMushafPage(sura, aya);
      setCurrentSurahNumber(sura);
      setCurrentSurahName(quranFiles.find((f) => f.number === sura)?.data?.surah ?? "القرآن");
      setInitialPageNo(targetPage);
      setJumpToPage(targetPage);
      setJumpId(token || Date.now());
      setHighlightAyah({ sura, aya });
      console.log("[QuranReader] JUMP", {
        source: p?.source,
        sura,
        aya,
        page: targetPage,
        navToken: token,
      });
      return () => {
        cancelled = true;
      };
    }

    setCurrentSurahNumber(1);
    setCurrentSurahName(quranFiles.find((f) => f.number === 1)?.data?.surah ?? "القرآن");
    setInitialPageNo(1);
    setJumpToPage(1);
    setJumpId(Date.now());
    setHighlightAyah({ sura: 1, aya: 1 });

    return () => {
      cancelled = true;
    };
  }, [route.params?.sura, route.params?.aya, route.params?.page, route.params?.navToken]);

  useEffect(() => {
    if (route.params?.openIndex) {
      setIndexVisible(true);
    }
  }, [route.params?.openIndex, route.params?.navToken]);


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
      const surahName = surah?.data?.surah ?? `سورة ${sura}`;
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
    refreshBookmarks();
  }, [currentSurahNumber, refreshBookmarks]);

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
        name: m.name_ar ?? `سورة ${m.number}`,
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
      const surahName = surah?.data?.surah ?? `سورة ${q.sura}`;
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
      const pageStart = findPageStart(pageNo);
      if (pageStart) {
        setCurrentSurahNumber(pageStart.sura);
        const page = getPageData(pageNo);
        setCurrentSurahName(
          page.surahName || (quranFiles.find((f) => f.number === pageStart.sura)?.data?.surah ?? "القرآن")
        );
        setCurrentJuz(getMushafJuz(pageStart.sura, pageStart.aya));
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
    navigation.setParams({ sura, aya, page, source: "index", navToken });
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
          <Ionicons name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"} size={22} color="#6E5A46" />
        </Pressable>
        <Text style={styles.toolbarTitle}>{surahName}</Text>
        <View style={styles.toolbarActions}>
          <Pressable
            onPress={() => setIndexVisible(true)}
            style={({ pressed }) => [styles.iconButton, pressed ? { opacity: 0.7 } : null]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.iconText}>☰</Text>
          </Pressable>
        </View>
      </View>

      <QuranSurahDetailsScreen
        initialPageNo={initialPageNo}
        highlightAyah={highlightAyah ?? undefined}
        jumpToPage={jumpToPage}
        jumpId={jumpId}
        onPageChange={handlePageChange}
        onVisiblePageChange={(pageNo, sura, name) => {
          setCurrentSurahNumber(sura);
          setCurrentSurahName(name || "القرآن");
        }}
      />

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
    backgroundColor: "#F8F1E6",
  },
  toolbar: {
    height: 54,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontSize: 18,
    color: "#6E5A46",
  },
  toolbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    color: "#6E5A46",
  },
  webOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },
});

