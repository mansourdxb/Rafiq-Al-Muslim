import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { SURAH_META } from "@/constants/quran/surahMeta";
import { getPageForAyah, arabicIndic } from "@/src/lib/quran/mushaf";
import { quranTheme } from "@/ui/quran/theme";
import QuranSearchBar from "@/ui/quran/QuranSearchBar";
import ContinueReadingCard from "@/ui/quran/ContinueReadingCard";
import QuranSegmentTabs from "@/ui/quran/QuranSegmentTabs";
import SurahRow from "@/ui/quran/SurahRow";
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

export default function QuranSurahListScreen() {
  const navigation = useNavigation<
    CompositeNavigationProp<
      NativeStackNavigationProp<LibraryStackParamList>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>("surah");
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

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

  const renderSurah = ({ item }: { item: (typeof SURAH_META)[number] }) => {
    const typeLabel = item.revelationType === "meccan" ? "مكية" : "مدنية";
    return (
      <SurahRow
        number={item.number}
        name={item.name_ar}
        typeLabel={typeLabel}
        onPress={() => openSurah(item.number, 1)}
      />
    );
  };

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
        <QuranSearchBar editable={false} onPress={() => navigation.navigate("QuranSearch")} />


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
            <FlatList
              data={SURAH_META}
              keyExtractor={(item) => String(item.number)}
              renderItem={renderSurah}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
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
  content: {
    flex: 1,
  },
  list: {
    gap: quranTheme.spacing.md,
    paddingVertical: quranTheme.spacing.sm,
    paddingBottom: 30,
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
