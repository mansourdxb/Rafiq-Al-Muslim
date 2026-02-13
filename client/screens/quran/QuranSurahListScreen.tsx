import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { SURAH_META } from "@/constants/quran/surahMeta";
import { getPageForAyah } from "@/src/lib/quran/mushaf";
import { getRub3Index, type Rub3Item } from "@/src/lib/quran/rub3Index";
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
const JUZ_INDEX = Array.from({ length: 30 }, (_, i) => i + 1);
const mushafJuz: { index: number; sura: number; aya: number }[] = require("../../data/Quran/mushaf-juz.json");
const AR_JUZ_ORDINAL = [
  "",
  "\u0627\u0644\u0623\u0648\u0644",
  "\u0627\u0644\u062b\u0627\u0646\u064a",
  "\u0627\u0644\u062b\u0627\u0644\u062b",
  "\u0627\u0644\u0631\u0627\u0628\u0639",
  "\u0627\u0644\u062e\u0627\u0645\u0633",
  "\u0627\u0644\u0633\u0627\u062f\u0633",
  "\u0627\u0644\u0633\u0627\u0628\u0639",
  "\u0627\u0644\u062b\u0627\u0645\u0646",
  "\u0627\u0644\u062a\u0627\u0633\u0639",
  "\u0627\u0644\u0639\u0627\u0634\u0631",
  "\u0627\u0644\u062d\u0627\u062f\u064a \u0639\u0634\u0631",
  "\u0627\u0644\u062b\u0627\u0646\u064a \u0639\u0634\u0631",
  "\u0627\u0644\u062b\u0627\u0644\u062b \u0639\u0634\u0631",
  "\u0627\u0644\u0631\u0627\u0628\u0639 \u0639\u0634\u0631",
  "\u0627\u0644\u062e\u0627\u0645\u0633 \u0639\u0634\u0631",
  "\u0627\u0644\u0633\u0627\u062f\u0633 \u0639\u0634\u0631",
  "\u0627\u0644\u0633\u0627\u0628\u0639 \u0639\u0634\u0631",
  "\u0627\u0644\u062b\u0627\u0645\u0646 \u0639\u0634\u0631",
  "\u0627\u0644\u062a\u0627\u0633\u0639 \u0639\u0634\u0631",
  "\u0627\u0644\u0639\u0634\u0631\u0648\u0646",
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
  const [rub3ActiveJuz, setRub3ActiveJuz] = useState(1);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const sectionListRef = useRef<SectionList<(typeof SURAH_META)[number]>>(null);
  const rub3ListRef = useRef<SectionList<Rub3Item>>(null);

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

  const rub3Items = useMemo(() => getRub3Index(), []);

  const rub3Sections = useMemo(() => {
    const map = new Map<number, Rub3Item[]>();
    rub3Items.forEach((item) => {
      const j = item.juz ?? 1;
      if (!map.has(j)) map.set(j, []);
      map.get(j)!.push(item);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([juz, data]) => ({ juz, title: juzTitle(juz), data }));
  }, [rub3Items]);

  useEffect(() => {
    if (!surahSections.length) return;
    setActiveJuz(surahSections[0].juz);
  }, [surahSections]);

  useEffect(() => {
    if (!rub3Sections.length) return;
    setRub3ActiveJuz(rub3Sections[0].juz);
  }, [rub3Sections]);

  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 10 }), []);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    const first = viewableItems?.find((v) => v?.section?.juz);
    if (first?.section?.juz) setActiveJuz(first.section.juz);
  }).current;

  const onRub3ViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    const first = viewableItems?.find((v) => v?.section?.juz);
    if (first?.section?.juz) setRub3ActiveJuz(first.section.juz);
  }).current;

  const railActiveJuz = useMemo(() => {
    let closest = 1;
    for (const j of JUZ_INDEX) {
      if (j <= activeJuz) closest = j;
      else break;
    }
    return closest;
  }, [activeJuz]);

  const rub3RailActiveJuz = useMemo(() => {
    let closest = 1;
    for (const j of JUZ_INDEX) {
      if (j <= rub3ActiveJuz) closest = j;
      else break;
    }
    return closest;
  }, [rub3ActiveJuz]);

  const jumpToJuz = (j: number) => {
    let sectionIndex = surahSections.findIndex((s) => s.juz >= j);
    if (sectionIndex < 0) sectionIndex = surahSections.length - 1;
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

  const jumpToRub3Juz = (j: number) => {
    let sectionIndex = rub3Sections.findIndex((s) => s.juz >= j);
    if (sectionIndex < 0) sectionIndex = rub3Sections.length - 1;
    if (sectionIndex < 0) return;
    requestAnimationFrame(() => {
      try {
        rub3ListRef.current?.scrollToLocation({
          sectionIndex,
          itemIndex: 0,
          viewPosition: 0,
        });
      } catch {
        // ignore scroll errors
      }
    });
  };

  const toArabicDigits = (n: number | string) =>
    String(n).replace(/\d/g, (d) => "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669"[Number(d)] ?? d);

  const renderSurah = ({ item }: { item: (typeof surahItems)[number] }) => {
    const isMeccan = item.revelationType === "meccan";
    const page = item.startPage ?? 1;
    const ayahs = item.ayahCount ?? 0;
    const ayahWord = ayahs === 1 ? "\u0622\u064a\u0629" : "\u0622\u064a\u0627\u062a";
    const typeArabic = isMeccan ? "\u0645\u0643\u064a\u0629" : "\u0645\u062f\u0646\u064a\u0629";
    const metaString = `\u0627\u0644\u0635\u0641\u062d\u0629 ${toArabicDigits(page)} - ${toArabicDigits(ayahs)} ${ayahWord} - ${typeArabic}`;
    return (
      <Pressable style={styles.row} onPress={() => openSurah(item.number, 1, item.startPage)}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{toArabicDigits(item.number)}</Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.surahName}>{item.name_ar ?? ""}</Text>
          <Text style={styles.meta}>{metaString}</Text>
        </View>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  const renderRub3SectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  const renderRub3Item = ({ item }: { item: Rub3Item }) => {
    const meta = `${item.surahName}: ${toArabicDigits(item.ayahNumber)} - \u0627\u0644\u0635\u0641\u062d\u0629 ${toArabicDigits(item.page)}`;
    return (
      <Pressable style={styles.rub3Row} onPress={() => openSurah(item.surahNumber, item.ayahNumber, item.page)}>
        <View style={styles.rub3Chip}>
          <Text style={styles.rub3ChipText}>{toArabicDigits(item.rubInJuz)}</Text>
        </View>
        <View style={styles.rub3Body}>
          <Text style={styles.rub3Text} numberOfLines={2} ellipsizeMode="tail">
            {item.text}
          </Text>
          <Text style={styles.rub3Meta}>{meta}</Text>
        </View>
      </Pressable>
    );
  };

  const renderJuz = ({ item }: { item: { index: number; sura: number; aya: number } }) => (
    <Pressable onPress={() => openSurah(item.sura, item.aya)}>
      <View style={styles.juzRow}>
        <Text style={styles.juzTitle}>{`\u0627\u0644\u062c\u0632\u0621 ${toArabicDigits(item.index)}`}</Text>
        <Text style={styles.juzMeta}>{`\u0633\u0648\u0631\u0629 ${toArabicDigits(item.sura)} \u2022 \u0622\u064a\u0629 ${toArabicDigits(
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
          <Text style={styles.favoriteMeta}>{`\u0622\u064a\u0629 ${toArabicDigits(item.ayahNumber)}`}</Text>
        </View>
      </Pressable>
    );
  };

  const lastReadTitle = "استمرار القراءة";
  const lastReadSubtitle = lastRead
    ? `\u0633\u0648\u0631\u0629 ${lastReadMeta?.name_ar ?? ""} \u0622\u064a\u0629 ${toArabicDigits(lastRead.ayahNumber)}`
    : "ابدأ القراءة الآن";

  return (
    <LinearGradient colors={quranTheme.colors.bgGradient} style={styles.gradient}>
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        

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
            <View style={styles.sheet}>
              <SectionList
                ref={sectionListRef}
                sections={surahSections}
                keyExtractor={(item) => String(item.number)}
                renderItem={renderSurah}
                renderSectionHeader={renderSectionHeader}
                style={styles.sectionList}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                viewabilityConfig={viewabilityConfig}
                onViewableItemsChanged={onViewableItemsChanged}
              />
              <View style={styles.juzRail}>
                {JUZ_INDEX.map((j) => {
                  const active = j === railActiveJuz;
                  return (
                    <Pressable key={`juz-${j}`} style={styles.juzRailItem} onPress={() => jumpToJuz(j)}>
                      <Text style={[styles.juzRailText, active && styles.juzRailTextActive]}>
                        {toArabicDigits(j)}
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
            <View style={styles.sheet}>
              <SectionList
                ref={rub3ListRef}
                sections={rub3Sections}
                keyExtractor={(item) => String(item.hizbQuarter)}
                renderItem={renderRub3Item}
                renderSectionHeader={renderRub3SectionHeader}
                style={styles.sectionList}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                viewabilityConfig={viewabilityConfig}
                onViewableItemsChanged={onRub3ViewableItemsChanged}
              />
              <View style={styles.juzRail}>
                {JUZ_INDEX.map((j) => {
                  const active = j === rub3RailActiveJuz;
                  return (
                    <Pressable key={`rub3-juz-${j}`} style={styles.juzRailItem} onPress={() => jumpToRub3Juz(j)}>
                      <Text style={[styles.juzRailText, active && styles.juzRailTextActive]}>
                        {toArabicDigits(j)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
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
  sheet: {
    backgroundColor: "#F2EADF",
    borderRadius: 24,
    marginTop: 12,
    paddingTop: 10,
    paddingBottom: 18,
    overflow: "hidden",
    flex: 1,
  },
  sectionList: {
    flex: 1,
  },
  listContent: {
    paddingLeft: 46,
    paddingBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 18,
    paddingVertical: 12,
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
  rowBody: {
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
  rub3Row: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2D7C9",
  },
  rub3Body: {
    flex: 1,
    paddingLeft: 12,
  },
  rub3Text: {
    textAlign: "right",
    fontSize: 22,
    lineHeight: 34,
    color: "#1F1A12",
    fontFamily: "Uthmani",
  },
  rub3Meta: {
    marginTop: 6,
    textAlign: "right",
    fontSize: 14,
    color: "#9C8B78",
    fontFamily: "Cairo",
  },
  rub3Chip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E7DED1",
    alignItems: "center",
    justifyContent: "center",
  },
  rub3ChipText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3A332A",
    fontFamily: "CairoBold",
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
    top: 16,
    bottom: 16,
    justifyContent: "flex-start",
  },
  juzRailItem: {
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  juzRailText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1C6B50",
    opacity: 0.9,
    fontFamily: "CairoBold",
    lineHeight: 13,
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
