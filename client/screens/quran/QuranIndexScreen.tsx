import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { loadKhatmah, saveKhatmah, type KhatmahState } from "@/src/lib/quran/khatmah";
import { quranFiles } from "@/lib/quran/quranFiles";

type SurahItem = {
  number: number;
  name: string;
  ayahsCount: number;
  typeLabel: string;
  startPage: number;
};
type JuzItem = { index: number; sura: number; aya: number; startPage: number };
type BookmarkItem = {
  key: string;
  sura: number;
  ayah: number;
  surahName: string;
  pageNo: number;
  juzNo: number;
  snippet: string;
  createdAt: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  surahs: SurahItem[];
  juzList: JuzItem[];
  bookmarks: BookmarkItem[];
  currentSurah?: number | null;
  currentJuz?: number | null;
  quarters?: Array<{
    key: string;
    sura: number;
    aya: number;
    surahName: string;
    juzNo: number;
    pageNo: number;
    snippet: string;
    showJuzBadge: boolean;
  }>;
  onSelectSurah: (sura: number) => void;
  onSelectJuz: (sura: number, aya: number) => void;
  onSelectBookmark: (sura: number, aya: number) => void;
  onDeleteBookmark?: (sura: number, aya: number) => void;
  inline?: boolean;
};

const mushafPages: { index: number; sura: number; aya: number }[] = require("../../data/Quran/mushaf-pages.json");

const BOTTOM_TABS = [
  { key: "tafseer", label: "التفسير", icon: "book-outline" },
  { key: "marks", label: "الفواصل", icon: "bookmark-outline" },
  { key: "khatma", label: "الختمة", icon: "checkmark-circle-outline" },
  { key: "index", label: "الفهرس", icon: "list" },
] as const;

const SEGMENT_TABS = [
  { key: "surah", label: "السور" },
  { key: "quarters", label: "الأرباع" },
] as const;

const JUZ_NAMES = [
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

function arabicIndic(value: number) {
  const map = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
  return String(value)
    .split("")
    .map((c) => map[Number(c)] ?? c)
    .join("");
}

const KHATMA_DAY_OPTIONS = [7, 15, 30, 60] as const;
const LAST_READ_KEY = "@tasbeeh/quranLastRead";

export default function QuranIndexScreen({
  visible,
  onClose,
  surahs,
  juzList,
  bookmarks,
  currentSurah,
  currentJuz,
  quarters = [],
  onSelectSurah,
  onSelectJuz,
  onSelectBookmark,
  onDeleteBookmark,
  inline = false,
}: Props) {
  const navigation = useNavigation<any>();
  const [activeSegment, setActiveSegment] = useState<(typeof SEGMENT_TABS)[number]["key"]>("surah");
  const [activeBottom, setActiveBottom] = useState<(typeof BOTTOM_TABS)[number]["key"]>("index");
  const listRef = useRef<FlatList<any>>(null);
  const quartersRef = useRef<FlatList<any>>(null);
  const juzQuick = useMemo(() => Array.from({ length: 30 }, (_, i) => i + 1), []);
  const [khatmah, setKhatmah] = useState<KhatmahState | null>(null);

  useEffect(() => {
    if (!visible) return;
    const init = async () => {
      const stored = await loadKhatmah();
      if (stored) {
        setKhatmah(stored);
        return;
      }
      const lastRead = await AsyncStorage.getItem(LAST_READ_KEY);
      const parsed = lastRead ? JSON.parse(lastRead) : null;
      const startPage = parsed?.pageNo ?? 1;
      const targetDays = 30;
      const pagesPerDay = Math.ceil((604 - startPage + 1) / targetDays);
      const state: KhatmahState = {
        startDate: new Date().toISOString(),
        targetDays,
        startPage,
        endPage: 604,
        pagesPerDay,
        completedPages: [],
        lastPage: startPage - 1,
        updatedAt: new Date().toISOString(),
      };
      await saveKhatmah(state);
      setKhatmah(state);
    };
    init();
  }, [visible]);

  const getMushafJuz = useMemo(() => {
    const sorted = [...juzList].sort((a, b) => (a.sura === b.sura ? a.aya - b.aya : a.sura - b.sura));
    return (sura: number, aya: number) => {
      let lo = 0;
      let hi = sorted.length - 1;
      let best = sorted[0]?.index ?? 1;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const ref = sorted[mid];
        if (sura > ref.sura || (sura === ref.sura && aya >= ref.aya)) {
          best = ref.index;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      return best;
    };
  }, [juzList]);

  const getMushafPage = useMemo(() => {
    const sorted = [...mushafPages].sort((a, b) => (a.sura === b.sura ? a.aya - b.aya : a.sura - b.sura));
    return (sura: number, aya: number) => {
      let lo = 0;
      let hi = sorted.length - 1;
      let best = sorted[0]?.index ?? 1;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const ref = sorted[mid];
        if (sura > ref.sura || (sura === ref.sura && aya >= ref.aya)) {
          best = ref.index;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      return best;
    };
  }, []);

  const surahListWithHeaders = useMemo(() => {
    const rows: Array<{ type: "header"; juz: number } | { type: "surah"; item: SurahItem }> = [];
    const indexMap = new Map<number, number>();
    let lastJuz: number | null = null;
    surahs.forEach((s) => {
      const juz = getMushafJuz(s.number, 1);
      if (juz !== lastJuz) {
        rows.push({ type: "header", juz });
        lastJuz = juz;
      }
      indexMap.set(s.number, rows.length);
      rows.push({ type: "surah", item: s });
    });
    return { rows, indexMap };
  }, [getMushafJuz, surahs]);

  const firstQuarterIndexByJuz = useMemo(() => {
    const map = new Map<number, number>();
    quarters.forEach((q, idx) => {
      if (!map.has(q.juzNo)) {
        map.set(q.juzNo, idx);
      }
    });
    return map;
  }, [quarters]);

  const getPageStart = (pageNo: number) => mushafPages.find((p) => p.index === pageNo);

  const completedCount = khatmah?.completedPages.length ?? 0;
  const progressPercent = khatmah ? Math.min(100, Math.round((completedCount / 604) * 100)) : 0;

  const todayRange = useMemo(() => {
    if (!khatmah) return null;
    const nextStart = Math.min(khatmah.lastPage + 1, khatmah.endPage);
    const end = Math.min(nextStart + khatmah.pagesPerDay - 1, khatmah.endPage);
    return { start: nextStart, end };
  }, [khatmah]);

  const handleMarkTodayDone = async () => {
    if (!khatmah || !todayRange) return;
    const pages = [];
    for (let p = todayRange.start; p <= todayRange.end; p += 1) {
      pages.push(p);
    }
    const merged = Array.from(new Set([...(khatmah.completedPages ?? []), ...pages]));
    const updated: KhatmahState = {
      ...khatmah,
      completedPages: merged,
      lastPage: todayRange.end,
      updatedAt: new Date().toISOString(),
    };
    await saveKhatmah(updated);
    setKhatmah(updated);
  };

  const handleJumpToPage = (pageNo: number) => {
    const start = getPageStart(pageNo);
    if (!start) return;
    onSelectJuz(start.sura, start.aya);
    onClose();
  };

  const handleResetKhatmah = () => {
    Alert.alert("إعادة ضبط الختمة", "هل تريد إعادة ضبط الختمة الحالية؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "إعادة ضبط",
        style: "destructive",
        onPress: async () => {
          if (!khatmah) return;
          const updated: KhatmahState = {
            ...khatmah,
            completedPages: [],
            lastPage: khatmah.startPage - 1,
            updatedAt: new Date().toISOString(),
          };
          await saveKhatmah(updated);
          setKhatmah(updated);
        },
      },
    ]);
  };

  const handleChangeTargetDays = async (days: number) => {
    if (!khatmah) return;
    const pagesPerDay = Math.ceil((khatmah.endPage - khatmah.startPage + 1) / days);
    const updated: KhatmahState = {
      ...khatmah,
      targetDays: days,
      pagesPerDay,
      updatedAt: new Date().toISOString(),
    };
    await saveKhatmah(updated);
    setKhatmah(updated);
  };

  const body = (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={22} color="#6E5A46" />
        </Pressable>
      </View>

        <Text style={styles.title}>الفهرس</Text>
        {currentJuz ? (
          <Text style={styles.currentJuz}>{`الجزء ${JUZ_NAMES[currentJuz - 1] ?? currentJuz}`}</Text>
        ) : null}

        {activeBottom === "index" ? (
          <View style={styles.segmentWrap}>
            {SEGMENT_TABS.map((tab) => {
              const active = tab.key === activeSegment;
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.segmentBtn, active ? styles.segmentActive : null]}
                  onPress={() => setActiveSegment(tab.key)}
                >
                  <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.content}>
          {activeBottom === "index" && activeSegment === "surah" ? (
            <View style={styles.surahLayout}>
              <View style={styles.railColumn} pointerEvents="box-none">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.juzColumnContent}>
                  {juzQuick.map((juz) => {
                    const isActive = currentJuz === juz;
                    return (
                      <Pressable
                        key={juz}
                        style={[styles.railPill, isActive ? styles.railPillActive : null]}
                        pointerEvents="auto"
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        onPress={() => {
                          const entry = juzList.find((item) => item.index === juz);
                          if (activeSegment === "quarters") {
                            const index = firstQuarterIndexByJuz.get(juz);
                            if (typeof index === "number") {
                              quartersRef.current?.scrollToIndex({ index, animated: true });
                            }
                            return;
                          }
                          if (entry) {
                            onSelectJuz(entry.sura, entry.aya);
                          }
                          onClose();
                          const firstSurah = surahs.find((s) => getMushafJuz(s.number, 1) === juz);
                          if (firstSurah) {
                            const listIndex = surahListWithHeaders.indexMap.get(firstSurah.number);
                            if (typeof listIndex === "number") {
                              listRef.current?.scrollToIndex({ index: listIndex, animated: true });
                            }
                          }
                        }}
                      >
                        <Text style={[styles.railPillText, isActive ? styles.railPillTextActive : null]}>
                          {arabicIndic(juz)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <FlatList
                ref={listRef}
                data={surahListWithHeaders.rows}
                keyExtractor={(item) =>
                  item.type === "header" ? `header-${item.juz}` : `surah-${item.item.number}`
                }
                contentContainerStyle={styles.list}
                renderItem={({ item }) => {
                  if (item.type === "header") {
                    return (
                      <View style={styles.juzHeader}>
                        <Text style={styles.juzHeaderText}>{`الجزء ${JUZ_NAMES[item.juz - 1] ?? item.juz}`}</Text>
                      </View>
                    );
                  }
                  const row = item.item;
                  const isActive = currentSurah === row.number;
                  return (
                    <Pressable
                      style={styles.surahRow}
                      onPress={() => {
                        console.log("[QURAN INDEX] open surah", row.number);
                        const hasFile = quranFiles.some((f) => f.number === row.number);
                        if (!hasFile) {
                          Alert.alert("ملف السورة غير متوفر");
                          return;
                        }
                        navigation.navigate("QuranReader", {
                          sura: row.number,
                          aya: 1,
                          page: row.startPage ?? undefined,
                          source: "index",
                          navToken: Date.now(),
                        });
                        onClose();
                      }}
                    >
                      <View style={styles.surahBadgeWrap}>
                        <View style={[styles.surahBadge, isActive ? styles.surahBadgeActive : null]}>
                          <Text style={[styles.surahBadgeText, isActive ? styles.surahBadgeTextActive : null]}>
                            {arabicIndic(row.number)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.surahText}>
                        <Text style={styles.surahName}>{row.name}</Text>
                        <Text style={styles.surahMeta}>
                          {`الصفحة ${row.startPage} - آية ${row.ayahsCount} - ${row.typeLabel}`}
                        </Text>
                      </View>
                    </Pressable>
                  );
                }}
                onScrollToIndexFailed={({ index }) => {
                  listRef.current?.scrollToOffset({ offset: index * 56, animated: true });
                }}
              />
            </View>
          ) : null}

          {activeBottom === "index" && activeSegment === "quarters" ? (
            <FlatList
              ref={quartersRef}
              data={quarters}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.quarterRow}
                  onPress={() => {
                    onSelectJuz(item.sura, item.aya);
                    onClose();
                  }}
                >
                  <View style={styles.surahBadgeWrap}>
                    {item.showJuzBadge ? (
                      <View style={styles.juzBadge}>
                        <Text style={styles.juzBadgeText}>{arabicIndic(item.juzNo)}</Text>
                      </View>
                    ) : (
                      <View style={styles.juzBadgePlaceholder} />
                    )}
                  </View>
                  <View style={styles.quarterText}>
                    <Text style={styles.quarterSnippet}>{item.snippet}</Text>
                    <Text style={styles.quarterMeta}>
                      {`${item.surahName} : ${arabicIndic(item.aya)} - الصفحة ${arabicIndic(item.pageNo)}`}
                    </Text>
                  </View>
                </Pressable>
              )}
              onScrollToIndexFailed={({ index }) => {
                quartersRef.current?.scrollToOffset({ offset: index * 72, animated: true });
              }}
            />
          ) : null}

          {activeBottom === "marks" ? (
            <ScrollView contentContainerStyle={styles.list}>
              {bookmarks.length === 0 ? (
                <Text style={styles.placeholder}>لا توجد فواصل محفوظة</Text>
              ) : (
                bookmarks.map((item) => (
                  <Pressable
                    key={item.key}
                    style={styles.surahRow}
                    onPress={() => {
                      onSelectBookmark(item.sura, item.ayah);
                      onClose();
                    }}
                  >
                    <View style={styles.surahBadgeWrap}>
                      <View style={styles.surahBadge}>
                        <Text style={styles.surahBadgeText}>{arabicIndic(item.ayah)}</Text>
                      </View>
                    </View>
                    <View style={styles.surahText}>
                      <Text style={styles.bookmarkSnippet} numberOfLines={2}>
                        {item.snippet}
                      </Text>
                      <Text style={styles.bookmarkMeta}>
                        {`${item.surahName} : ${arabicIndic(item.ayah)} - الصفحة ${arabicIndic(item.pageNo)}`}
                      </Text>
                    </View>
                    <View style={styles.bookmarkActions}>
                      <Pressable
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => onDeleteBookmark?.(item.sura, item.ayah)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#8B7B6A" />
                      </Pressable>
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>
          ) : null}

          {activeBottom === "tafseer" ? (
            <View style={styles.placeholderWrap}>
              <Text style={styles.placeholder}>اختر آية لعرض التفسير</Text>
            </View>
          ) : null}

          {activeBottom === "khatma" ? (
            <View style={styles.khatmaWrap}>
              {!khatmah ? (
                <View style={styles.khatmaEmpty}>
                  <Text style={styles.khatmaTitle}>الختمة</Text>
                  <Text style={styles.khatmaText}>جاري تجهيز بيانات الختمة...</Text>
                </View>
              ) : (
                <View style={styles.khatmaDashboard}>
                  <Text style={styles.khatmaTitle}>الختمة</Text>
                  <View style={styles.khatmaCard}>
                    <Text style={styles.khatmaMeta}>{`${completedCount}/604`}</Text>
                    <Text style={styles.khatmaProgress}>{`${progressPercent}%`}</Text>
                  </View>

                  {todayRange ? (
                    <View style={styles.khatmaCard}>
                      <Text style={styles.khatmaLabel}>ورد اليوم</Text>
                      <Pressable onPress={() => handleJumpToPage(todayRange.start)}>
                        <Text style={styles.khatmaMeta}>
                          {`من الصفحة ${todayRange.start} إلى الصفحة ${todayRange.end}`}
                        </Text>
                      </Pressable>
                      <Pressable style={styles.khatmaPrimary} onPress={handleMarkTodayDone}>
                        <Text style={styles.khatmaPrimaryText}>تم</Text>
                      </Pressable>
                    </View>
                  ) : null}

                  <View style={styles.khatmaTargets}>
                    {KHATMA_DAY_OPTIONS.map((days) => {
                      const active = khatmah.targetDays === days;
                      return (
                        <Pressable
                          key={`days-${days}`}
                          style={[styles.khatmaTargetBtn, active ? styles.khatmaTargetActive : null]}
                          onPress={() => handleChangeTargetDays(days)}
                        >
                          <Text style={[styles.khatmaTargetText, active ? styles.khatmaTargetTextActive : null]}>
                            {days}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable style={styles.khatmaReset} onPress={handleResetKhatmah}>
                    <Text style={styles.khatmaResetText}>إعادة ضبط الختمة</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : null}
        </View>

      <View style={styles.bottomBar}>
        {BOTTOM_TABS.map((tab) => {
          const active = tab.key === activeBottom;
          return (
            <Pressable
                key={tab.key}
                style={styles.bottomItem}
                onPress={() => setActiveBottom(tab.key)}
              >
                <Ionicons name={tab.icon as any} size={20} color={active ? "#1E8B5A" : "#8B7B6A"} />
                <Text style={[styles.bottomText, active ? styles.bottomTextActive : null]}>
                  {tab.label}
                </Text>
              </Pressable>
          );
        })}
      </View>
    </View>
  );

  if (inline) {
    return (
      <View style={styles.inlineOverlay}>
        <Pressable style={styles.inlineBackdrop} onPress={onClose} />
        {body}
      </View>
    );
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      {body}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F3EEE5",
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  inlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  inlineBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    height: 32,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  title: {
    fontFamily: "CairoBold",
    fontSize: 30,
    color: "#3D3022",
    textAlign: "right",
    marginTop: 2,
    marginBottom: 2,
  },
  currentJuz: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#8B7B6A",
    textAlign: "right",
    marginBottom: 8,
  },
  segmentWrap: {
    alignSelf: "center",
    flexDirection: "row-reverse",
    backgroundColor: "#E3DDD3",
    borderRadius: 18,
    padding: 4,
    gap: 6,
    marginBottom: 12,
  },
  segmentBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "transparent",
  },
  segmentActive: {
    backgroundColor: "#FFFFFF",
  },
  segmentText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#6B5B4B",
  },
  segmentTextActive: {
    color: "#3D3022",
  },
  content: {
    flex: 1,
    paddingBottom: 12,
  },
  surahLayout: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  railColumn: {
    width: 30,
    alignItems: "center",
    zIndex: 2,
    elevation: 2,
  },
  juzColumnContent: {
    gap: 2,
    paddingTop: 6,
    paddingBottom: 40,
  },
  railPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  railPillActive: {
    backgroundColor: "transparent",
  },
  railPillText: {
    fontFamily: "CairoBold",
    fontSize: 10,
    color: "#2F6E52",
  },
  railPillTextActive: {
    color: "#1E8B5A",
  },
  list: {
    paddingBottom: 16,
    gap: 0,
  },
  juzHeader: {
    paddingVertical: 8,
    alignItems: "flex-end",
  },
  juzHeaderText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#8B7B6A",
    textAlign: "right",
  },
  surahRow: {
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingVertical: 8,
    paddingHorizontal: 4,
    flexDirection: "row-reverse",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  surahBadgeWrap: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  surahText: {
    flex: 1,
    alignItems: "flex-end",
    paddingRight: 6,
  },
  surahName: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: "#2F2A24",
    textAlign: "right",
  },
  surahMeta: {
    marginTop: 2,
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#8B7B6A",
    textAlign: "right",
  },
  surahBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E1D9",
    alignItems: "center",
    justifyContent: "center",
  },
  surahBadgeActive: {
    backgroundColor: "#1E8B5A",
  },
  surahBadgeText: {
    fontFamily: "CairoBold",
    fontSize: 12,
    color: "#3D3022",
  },
  surahBadgeTextActive: {
    color: "#FFFFFF",
  },
  bookmarkSnippet: {
    fontFamily: "KFGQPCUthmanicScript",
    fontSize: 18,
    color: "#8B7B6A",
    textAlign: "right",
    writingDirection: "rtl",
  },
  bookmarkMeta: {
    marginTop: 4,
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#8B7B6A",
    textAlign: "right",
  },
  bookmarkActions: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  quarterRow: {
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 4,
    flexDirection: "row-reverse",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  quarterText: {
    flex: 1,
    alignItems: "flex-end",
    paddingRight: 6,
  },
  quarterSnippet: {
    fontFamily: "KFGQPCUthmanicScript",
    fontSize: 18,
    color: "#8B7B6A",
    textAlign: "right",
    writingDirection: "rtl",
  },
  quarterMeta: {
    marginTop: 4,
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#8B7B6A",
    textAlign: "right",
  },
  juzBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1E8B5A",
    alignItems: "center",
    justifyContent: "center",
  },
  juzBadgePlaceholder: {
    width: 32,
    height: 32,
  },
  juzBadgeText: {
    fontFamily: "CairoBold",
    fontSize: 12,
    color: "#FFFFFF",
  },
  placeholderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#8B7B6A",
    textAlign: "center",
  },
  bottomBar: {
    height: 64,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 6,
  },
  bottomItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  bottomText: {
    fontFamily: "CairoBold",
    fontSize: 11,
    color: "#8B7B6A",
  },
  bottomTextActive: {
    color: "#1E8B5A",
  },
  khatmaWrap: {
    flex: 1,
  },
  khatmaEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginTop: 16,
  },
  khatmaDashboard: {
    flex: 1,
    gap: 12,
  },
  khatmaTitle: {
    fontFamily: "CairoBold",
    fontSize: 22,
    color: "#3D3022",
    textAlign: "right",
  },
  khatmaText: {
    marginTop: 8,
    fontFamily: "Cairo",
    fontSize: 14,
    color: "#8B7B6A",
    textAlign: "center",
    lineHeight: 22,
  },
  khatmaPrimary: {
    marginTop: 12,
    backgroundColor: "#1E8B5A",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: "center",
  },
  khatmaPrimaryText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  khatmaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  khatmaRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  khatmaLabel: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#3D3022",
  },
  khatmaValue: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#6E5A46",
  },
  khatmaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  khatmaMeta: {
    fontFamily: "CairoBold",
    fontSize: 12,
    color: "#3D3022",
    textAlign: "right",
  },
  khatmaProgress: {
    fontFamily: "CairoBold",
    fontSize: 20,
    color: "#1E8B5A",
    textAlign: "right",
  },
  khatmaSnippet: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#8B7B6A",
    textAlign: "right",
  },
  khatmaTargets: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 4,
  },
  khatmaTargetBtn: {
    flex: 1,
    backgroundColor: "#E9E3D9",
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: "center",
  },
  khatmaTargetActive: {
    backgroundColor: "#1E8B5A",
  },
  khatmaTargetText: {
    fontFamily: "CairoBold",
    fontSize: 12,
    color: "#6E5A46",
  },
  khatmaTargetTextActive: {
    color: "#FFFFFF",
  },
  khatmaReset: {
    alignItems: "center",
    paddingVertical: 10,
  },
  khatmaResetText: {
    fontFamily: "CairoBold",
    fontSize: 13,
    color: "#C0392B",
  },
});
