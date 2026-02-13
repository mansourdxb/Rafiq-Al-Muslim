import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { SURAH_META } from "@/constants/quran/surahMeta";
import { getPageForAyah, arabicIndic } from "@/src/lib/quran/mushaf";
import { quranTheme } from "@/ui/quran/theme";
import ContinueReadingCard from "@/ui/quran/ContinueReadingCard";
import QuranSegmentTabs from "@/ui/quran/QuranSegmentTabs";
import type { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type TabKey = "surah" | "juz" | "favorites";
type LastRead = {
  surahNumber: number;
  ayahNumber: number;
  page?: number;
  updatedAt?: string;
};
type FavoriteItem = {
  surahNumber: number;
  ayahNumber: number;
  createdAt?: string;
};

const LAST_READ_KEY = "quran:lastRead";
const FAVORITES_KEY = "quran:favorites";
const TOTAL_PAGES = 604;
const mushafJuz: { index: number; sura: number; aya: number }[] = require("../../data/Quran/mushaf-juz.json");
const AR_JUZ_ORDINAL = [
  "",
  "الأول",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
  "السابع",
  "الثامن",
  "التاسع",
  "العاشر",
  "الحادي عشر",
  "الثاني عشر",
  "الثالث عشر",
  "الرابع عشر",
  "الخامس عشر",
  "السادس عشر",
  "السابع عشر",
  "الثامن عشر",
  "التاسع عشر",
  "العشرون",
  "الحادي والعشرون",
  "الثاني والعشرون",
  "الثالث والعشرون",
  "الرابع والعشرون",
  "الخامس والعشرون",
  "السادس والعشرون",
  "السابع والعشرون",
  "الثامن والعشرون",
  "التاسع والعشرون",
  "الثلاثون",
];

const juzTitle = (j: number) => `الجزء ${AR_JUZ_ORDINAL[j] ?? j}`;

export default function QuranSurahListScreen() {
  const navigation = useNavigation<
    CompositeNavigationProp<
      NativeStackNavigationProp<LibraryStackParamList>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>("surah");
  const [activeJuz, setActiveJuz] = useState(1);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const sectionListRef = useRef<SectionList<(typeof SURAH_META)[number]>>(null);

  useEffect(() => {
    console.log("QURAN TAB ENTRY:", "QuranSurahListScreen");
  }, []);


  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LAST_READ_KEY);
        const favRaw = await AsyncStorage.getItem(FAVORITES_KEY);
        if (!active) return;
        if (raw) setLastRead(JSON.parse(raw) as LastRead);
        if (favRaw) setFavorites(JSON.parse(favRaw) as FavoriteItem[]);
      } catch {
        // ignore storage errors
      }
    })();
    return () => {
      active = false;
    };
  }, []);

const openSurah = (sura: number, aya = 1, page?: number) => {
  const pageNo = page ?? getPageForAyah(sura, aya);
  
  console.log("🔵 OPENING SURAH:", sura, "PAGE:", pageNo);
  
  navigation.navigate("QuranReader", {
    sura,
    aya,
    page: pageNo,
    source: "manual",
    navToken: Date.now(),
  });
};


  const lastReadMeta = useMemo(() => {
    if (!lastRead) return null;
    return SURAH_META.find((s) => s.number === lastRead.surahNumber) ?? null;
  }, [lastRead]);

  const progress = useMemo(() => {
    if (!lastRead?.page) return 0;
    return Math.min(1, Math.max(0, lastRead.page / TOTAL_PAGES));
  }, [lastRead]);

  const juzItems = useMemo(() => {
    const map = new Map<number, { sura: number; aya: number }>();
    mushafJuz.forEach((j) => {
      if (!map.has(j.index)) map.set(j.index, { sura: j.sura, aya: j.aya });
    });
    return Array.from({ length: 30 }, (_, i) => {
      const idx = i + 1;
      const entry = map.get(idx) ?? { sura: 1, aya: 1 };
      return { index: idx, ...entry };
    });
  }, []);

  const juzStartPages = useMemo(
    () =>
      mushafJuz
        .map((j) => ({ index: j.index, page: getPageForAyah(j.sura, j.aya) }))
        .sort((a, b) => a.page - b.page),
    []
  );

  const getJuzForPage = (page: number) => {
    let current = 1;
    for (const j of juzStartPages) {
      if (page >= j.page) current = j.index;
      else break;
    }
    return current;
  };

  const surahItems = useMemo(() => {
    return SURAH_META.map((s) => {
      const startPage = getPageForAyah(s.number, 1);
      const startJuz = getJuzForPage(startPage);
      return {
        ...s,
        startPage,
        startJuz,
      };
    });
  }, [getJuzForPage]);

  const surahSections = useMemo(() => {
    const map = new Map<number, (typeof surahItems)[number][]>();
    surahItems.forEach((s) => {
      const j = s.startJuz ?? 1;
      if (!map.has(j)) map.set(j, []);
      map.get(j)!.push(s);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([juz, data]) => ({ juz, title: juzTitle(juz), data }));
  }, [surahItems]);

  useEffect(() => {
    if (!surahSections.length) return;
    setActiveJuz(surahSections[0].juz);
  }, [surahSections]);

  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 10 }), []);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    const first = viewableItems?.find((v) => v?.section?.juz);
    if (first?.section?.juz) setActiveJuz(first.section.juz);
  }).current;

  const jumpToJuz = (j: number) => {
    const sectionIndex = surahSections.findIndex((s) => s.juz === j);
    if (sectionIndex < 0) return;
    requestAnimationFrame(() => {
      try {
        sectionListRef.current?.scrollToLocation({
          sectionIndex,
          itemIndex: 0,
          viewPosition: 0,
        });
      } catch {
        // ignore scroll errors
      }
    });
  };

  const renderSurah = ({ item }: { item: (typeof surahItems)[number] }) => {
    const typeLabel = item.revelationType === "meccan" ? "??" : "???";
    const isActive = lastRead?.surahNumber === item.number;
    return (
      <Pressable
        style={styles.row}
        onPress={() => openSurah(item.number, 1, item.startPage)}
      >
        <View style={styles.rowRight}>
          <Text style={styles.surahName}>{item.name_ar}</Text>
          <Text style={styles.meta}>{`? ${arabicIndic(item.startPage)} - ${arabicIndic(item.ayahCount)} ? - ${typeLabel}`}</Text>
        </View>
        <View style={[styles.badge, isActive && styles.badgeActive]}>
          <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>{arabicIndic(item.number)}</Text>
        </View>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  const renderJuz = ({ item }: { item: { index: number; sura: number; aya: number } }) => (
    <Pressable onPress={() => openSurah(item.sura, item.aya)}>
      <View style={styles.juzRow}>
        <Text style={styles.juzTitle}>{`الجزء ${arabicIndic(item.index)}`}</Text>
        <Text style={styles.juzMeta}>{`سورة ${arabicIndic(item.sura)} • آية ${arabicIndic(
          item.aya
        )}`}</Text>
      </View>
    </Pressable>
  );

  const renderFavorite = ({ item }: { item: FavoriteItem }) => {
    const meta = SURAH_META.find((s) => s.number === item.surahNumber);
    return (
      <Pressable onPress={() => openSurah(item.surahNumber, item.ayahNumber)}>
        <View style={styles.favoriteRow}>
          <Text style={styles.favoriteTitle}>{meta?.name_ar ?? "سورة"}</Text>
          <Text style={styles.favoriteMeta}>{`آية ${arabicIndic(item.ayahNumber)}`}</Text>
        </View>
      </Pressable>
    );
  };

  const lastReadTitle = "استمرار القراءة";
  const lastReadSubtitle = lastRead
    ? `سورة ${lastReadMeta?.name_ar ?? ""} آية ${arabicIndic(lastRead.ayahNumber)}`
    : "ابدأ القراءة الآن";

  return (
    <LinearGradient colors={quranTheme.colors.bgGradient} style={styles.gradient}>
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        {activeTab === "surah" ? (
          <View style={styles.topHeader}>
            <Text style={styles.title}>?</Text>
            <Text style={styles.subtitle}>{juzTitle(activeJuz)}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => {
            if (!lastRead) return;
            openSurah(lastRead.surahNumber, lastRead.ayahNumber, lastRead.page);
          }}
        >
          <ContinueReadingCard surahName={lastReadTitle} ayahText={lastReadSubtitle} progress={progress} />
        </Pressable>

        <QuranSegmentTabs value={activeTab} onChange={setActiveTab} />

        <View style={styles.content}>
          {activeTab === "surah" ? (
            <View style={styles.surahListWrap}>
              <SectionList
                ref={sectionListRef}
                sections={surahSections}
                keyExtractor={(item) => String(item.number)}
                renderItem={renderSurah}
                renderSectionHeader={renderSectionHeader}
                contentContainerStyle={styles.sectionListContent}
                showsVerticalScrollIndicator={false}
                viewabilityConfig={viewabilityConfig}
                onViewableItemsChanged={onViewableItemsChanged}
              />
              <View style={styles.juzRail}>
                {Array.from({ length: 30 }, (_, i) => {
                  const j = i + 1;
                  const active = j === activeJuz;
                  return (
                    <Pressable key={`juz-${j}`} style={styles.juzRailItem} onPress={() => jumpToJuz(j)}>
                      <Text style={[styles.juzRailText, active && styles.juzRailTextActive]}>
                        {arabicIndic(j)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {activeTab === "juz" ? (
            <FlatList
              data={juzItems}
              keyExtractor={(item) => String(item.index)}
              renderItem={renderJuz}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          ) : null}

          {activeTab === "favorites" ? (
            favorites.length ? (
              <FlatList
                data={favorites}
                keyExtractor={(item) => `${item.surahNumber}-${item.ayahNumber}`}
                renderItem={renderFavorite}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>لا يوجد مفضلات حالياً</Text>
              </View>
            )
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: quranTheme.spacing.lg,
    gap: quranTheme.spacing.md,
  },
  topHeader: {
    paddingTop: 14,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  title: {
    textAlign: "right",
    fontSize: 40,
    fontWeight: "900",
    color: "#111",
    fontFamily: "CairoBold",
  },
  subtitle: {
    textAlign: "right",
    marginTop: 6,
    fontSize: 18,
    fontWeight: "700",
    color: "#8A7B67",
    fontFamily: "CairoBold",
  },
  content: {
    flex: 1,
  },
  list: {
    gap: quranTheme.spacing.md,
    paddingVertical: quranTheme.spacing.sm,
    paddingBottom: 30,
  },
  surahListWrap: {
    flex: 1,
  },
  sectionListContent: {
    paddingLeft: 40,
    paddingBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  sectionHeaderText: {
    textAlign: "right",
    fontSize: 18,
    fontWeight: "800",
    color: "#A58F78",
    fontFamily: "CairoBold",
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2D7C9",
  },
  rowRight: {
    flex: 1,
    paddingLeft: 12,
  },
  surahName: {
    textAlign: "right",
    fontSize: 26,
    fontWeight: "900",
    color: "#111",
    fontFamily: "CairoBold",
  },
  meta: {
    textAlign: "right",
    marginTop: 6,
    fontSize: 16,
    color: "#9C8B78",
    fontFamily: "Cairo",
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E7DED1",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeActive: {
    backgroundColor: "#1C6B50",
  },
  badgeText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3A332A",
    fontFamily: "CairoBold",
  },
  badgeTextActive: {
    color: "#fff",
  },
  juzRail: {
    position: "absolute",
    left: 8,
    top: 190,
    bottom: 110,
    justifyContent: "center",
  },
  juzRailItem: {
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  juzRailText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1C6B50",
    opacity: 0.9,
    fontFamily: "CairoBold",
  },
  juzRailTextActive: {
    opacity: 1,
    textDecorationLine: "underline",
  },
  juzRow: {
    backgroundColor: quranTheme.colors.row,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "flex-end",
    gap: 6,
  },
  juzTitle: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: quranTheme.colors.textOnDark,
  },
  juzMeta: {
    fontFamily: "Cairo",
    fontSize: 13,
    color: quranTheme.colors.textOnDark,
    opacity: 0.8,
  },
  favoriteRow: {
    backgroundColor: quranTheme.colors.row,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "flex-end",
  },
  favoriteTitle: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: quranTheme.colors.textOnDark,
  },
  favoriteMeta: {
    fontFamily: "Cairo",
    fontSize: 13,
    color: quranTheme.colors.textOnDark,
    opacity: 0.8,
    marginTop: 4,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontFamily: "Cairo",
    fontSize: 14,
    color: quranTheme.colors.textOnDark,
  },
});
