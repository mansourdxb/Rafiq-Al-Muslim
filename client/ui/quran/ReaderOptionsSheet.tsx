import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { quranTheme } from "./theme";
import { loadMarks } from "@/src/lib/quran/ayahMarks";
import { quranFiles } from "@/lib/quran/quranFiles";
import { SURAH_META } from "@/constants/quran/surahMeta";
import { buildEveryAyahUrl, playAyah } from "@/src/services/quranAudio";
import {
  arabicIndic as arabicIndicMushaf,
  getPageCount,
  getPageData,
  getPageForAyah,
} from "@/src/lib/quran/mushaf";

function arabicIndic(value: number) {
  const map = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
  return String(value)
    .split("")
    .map((c) => map[Number(c)] ?? c)
    .join("");
}

type Props = {
  visible: boolean;
  ayahNumber: number;
  surahName?: string;
  surahNumber?: number;
  readerBounds?: { x: number; y: number; width: number; height: number } | null;
  bookmarkColor?: string | null;
  highlightColor?: string | null;
  onClose: () => void;
  onSelectBookmark?: (color: string | null) => void;
  onSelectHighlight?: (color: string | null) => void;
  onShare?: () => void;
  onCopy?: () => void;
  onOpenTafsir?: () => void;
};

const BOOKMARK_COLORS = ["#7BBF94", "#D9B871", "#F08B7E", "#5B7DBE"];
const HIGHLIGHT_COLORS = ["#FFE7C2", "#FFF3C6", "#D7F0E5", "#E7D8F7", "#F6D5D5"];
const BOOKMARK_COLOR_NAMES: Record<string, string> = {
  "#7BBF94": "الأخضر",
  "#D9B871": "الأصفر",
  "#F08B7E": "الأحمر",
  "#5B7DBE": "الأزرق",
};

type PlayToMode =
  | { kind: "pageEnd" }
  | { kind: "surahEnd" }
  | { kind: "continuous" }
  | { kind: "ayah"; surah: number; ayah: number }
  | { kind: "page"; page: number }
  | { kind: "surah"; surah: number };

export default function ReaderOptionsSheet({
  visible,
  ayahNumber,
  surahName,
  surahNumber,
  readerBounds,
  bookmarkColor,
  highlightColor,
  onClose,
  onSelectBookmark,
  onSelectHighlight,
  onShare,
  onCopy,
  onOpenTafsir,
}: Props) {
  const isWeb = Platform.OS === "web";
  const winW = Dimensions.get("window").width;
  const padLeft = readerBounds?.x ?? 0;
  const padRight = readerBounds ? Math.max(0, winW - (readerBounds.x + readerBounds.width)) : 0;
  const translateY = useRef(new Animated.Value(400)).current;
  const playToTranslateY = useRef(new Animated.Value(420)).current;
  const [view, setView] = useState<"main" | "fawasil">("main");
  const [fawasilLatest, setFawasilLatest] = useState<Record<string, { sura: number; aya: number; updatedAt?: string }>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playToOpen, setPlayToOpen] = useState(false);
  const [playToTab, setPlayToTab] = useState<"ayah" | "page" | "surah">("ayah");
  const [playTo, setPlayTo] = useState<PlayToMode>({ kind: "pageEnd" });
  const [surahCache, setSurahCache] = useState<Record<number, any[]>>({});

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : 400,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [translateY, visible]);

  useEffect(() => {
    Animated.timing(playToTranslateY, {
      toValue: playToOpen ? 0 : 420,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [playToOpen, playToTranslateY]);

  useEffect(() => {
    if (!visible) {
      setView("main");
      setIsPlaying(false);
      setPlayToOpen(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (view !== "fawasil" && view !== "main") return;
    const loadFawasil = async () => {
      const marks = await loadMarks();
      const latest: Record<string, { sura: number; aya: number; updatedAt?: string }> = {};
      Object.entries(marks).forEach(([key, mark]) => {
        const color = mark?.bookmarkColor ?? null;
        if (!color) return;
        if (!BOOKMARK_COLORS.includes(color)) return;
        const parts = key.split(":");
        const sura = Number(parts[0]);
        const aya = Number(parts[1]);
        if (!sura || !aya) return;
        const current = latest[color];
        const nextTime = mark?.updatedAt ? new Date(mark.updatedAt).getTime() : 0;
        const currTime = current?.updatedAt ? new Date(current.updatedAt).getTime() : 0;
        if (!current || nextTime >= currTime) {
          latest[color] = { sura, aya, updatedAt: mark?.updatedAt };
        }
      });
      setFawasilLatest(latest);
    };
    loadFawasil();
  }, [visible, view, bookmarkColor]);

  const formatTime = (value?: string) => {
    if (!value) return "";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleTimeString("ar", { hour: "numeric", minute: "2-digit" });
  };

  const buildSubtitle = (sura: number, aya: number, updatedAt?: string) => {
    const surah = quranFiles.find((f) => f.number === sura)?.data?.surah;
    const time = formatTime(updatedAt);
    const surahLabel = surah ?? `سورة ${arabicIndic(sura)}`;
    return `${surahLabel}: ${arabicIndic(aya)}${time ? ` • ${time}` : ""}`;
  };
  const activeBookmark = bookmarkColor ?? BOOKMARK_COLORS[0];
  const activeEntry = activeBookmark ? fawasilLatest[activeBookmark] : undefined;
  const activeTitle = activeBookmark ? BOOKMARK_COLOR_NAMES[activeBookmark] ?? "الأخضر" : "الأخضر";
  const activeSubtitle = activeEntry
    ? buildSubtitle(activeEntry.sura, activeEntry.aya, activeEntry.updatedAt)
    : "الآية الحالية";

  const headerTitle = useMemo(() => {
    const number = arabicIndic(ayahNumber);
    return surahName ? `${surahName}: ${number}` : `الآية ${number}`;
  }, [ayahNumber, surahName]);

  const currentSurah = surahNumber ?? 1;
  const currentAyah = ayahNumber ?? 1;
  const currentSurahMeta = SURAH_META.find((s) => s.number === currentSurah);
  const currentSurahName = surahName ?? currentSurahMeta?.name_ar ?? `سورة ${arabicIndic(currentSurah)}`;
  const currentAyahCount = currentSurahMeta?.ayahCount ?? 0;
  const currentPage = useMemo(() => getPageForAyah(currentSurah, currentAyah), [currentSurah, currentAyah]);

  const buildPlayToLabel = () => {
    switch (playTo.kind) {
      case "pageEnd":
        return { title: "نهاية الصفحة", subtitle: `الصفحة ${arabicIndicMushaf(currentPage)}` };
      case "surahEnd":
        return { title: "نهاية السورة", subtitle: currentSurahName };
      case "continuous":
        return { title: "تشغيل مستمر", subtitle: "لا يتوقف تلقائياً" };
      case "ayah":
        return {
          title: "آية محددة",
          subtitle: `${currentSurahName}: ${arabicIndicMushaf(playTo.ayah)}`,
        };
      case "page":
        return { title: "صفحة محددة", subtitle: `الصفحة ${arabicIndicMushaf(playTo.page)}` };
      case "surah":
        return {
          title: "سورة محددة",
          subtitle: SURAH_META.find((s) => s.number === playTo.surah)?.name_ar ?? `سورة ${arabicIndic(playTo.surah)}`,
        };
      default:
        return { title: "تشغيل إلى", subtitle: "" };
    }
  };

  const buildStopAt = () => {
    const pageCount = getPageCount();
    if (!currentSurahMeta) return undefined;
    if (playTo.kind === "continuous") return undefined;
    if (playTo.kind === "surahEnd") {
      return { surah: currentSurah, ayah: currentAyahCount };
    }
    if (playTo.kind === "ayah") {
      return { surah: playTo.surah, ayah: playTo.ayah };
    }
    if (playTo.kind === "surah") {
      const meta = SURAH_META.find((s) => s.number === playTo.surah);
      const count = meta?.ayahCount ?? 0;
      return { surah: playTo.surah, ayah: count };
    }
    const pageNo = playTo.kind === "pageEnd" ? currentPage : playTo.page;
    const safePage = Math.min(pageCount, Math.max(1, pageNo));
    const pageData = getPageData(safePage);
    const last = pageData.ayahs[pageData.ayahs.length - 1];
    if (!last) return undefined;
    return { surah: last.sura, ayah: last.aya };
  };

  const playToLabel = buildPlayToLabel();
  const stopAt = buildStopAt();

  const compareAyahRef = (a: { surah: number; ayah: number }, b: { surah: number; ayah: number }) => {
    if (a.surah !== b.surah) return a.surah - b.surah;
    return a.ayah - b.ayah;
  };

  const startPlayTo = async (mode: PlayToMode) => {
    if (!surahNumber) return;
    const computedStopAt = (() => {
      if (mode.kind === "continuous") return undefined;
      if (mode.kind === "surahEnd") return { surah: currentSurah, ayah: currentAyahCount };
      if (mode.kind === "ayah") return { surah: mode.surah, ayah: mode.ayah };
      if (mode.kind === "surah") {
        const meta = SURAH_META.find((s) => s.number === mode.surah);
        return { surah: mode.surah, ayah: meta?.ayahCount ?? 0 };
      }
      const pageNo = mode.kind === "pageEnd" ? currentPage : mode.page;
      const pageData = getPageData(Math.min(getPageCount(), Math.max(1, pageNo)));
      const last = pageData.ayahs[pageData.ayahs.length - 1];
      return last ? { surah: last.sura, ayah: last.aya } : undefined;
    })();

    if (computedStopAt && compareAyahRef(computedStopAt, { surah: currentSurah, ayah: currentAyah }) < 0) {
      Alert.alert("تنبيه", "الهدف قبل موضع البداية");
      return;
    }

    setPlayTo(mode);
    setPlayToOpen(false);
    onClose();

    if (isLoading) return;
    setIsLoading(true);
    try {
      console.log("PLAY pressed", surahNumber, ayahNumber);
      const url = buildEveryAyahUrl(surahNumber, ayahNumber, "Abu Bakr Ash-Shaatree_128kbps");
      console.log("[QuranAudio] play", url);
      await playAyah({
        surah: surahNumber,
        ayah: ayahNumber,
        surahName,
        reciterKey: "Abu Bakr Ash-Shaatree_128kbps",
        ayahCount: SURAH_META.find((s) => s.number === surahNumber)?.ayahCount ?? 0,
        stopAt: computedStopAt,
      });
      setIsPlaying(true);
    } catch (error) {
      console.error("[QuranAudio] play failed", error);
      if (Platform.OS === "web") {
        Alert.alert("تعذر التشغيل", "يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const ayahTargets = useMemo(() => {
    const out: Array<{ surah: number; ayah: number }> = [];
    for (let s = currentSurah; s <= 114; s += 1) {
      const meta = SURAH_META.find((m) => m.number === s);
      if (!meta) continue;
      const startA = s === currentSurah ? currentAyah : 1;
      for (let a = startA; a <= meta.ayahCount; a += 1) {
        out.push({ surah: s, ayah: a });
      }
    }
    return out;
  }, [currentSurah, currentAyah]);

  const ensureSurahLoaded = useCallback(
    (surah: number) => {
      if (surahCache[surah]) return;
      const surahData = quranFiles.find((f) => f.number === surah)?.data;
      const ayahs = Array.isArray(surahData?.ayahs) ? surahData.ayahs : [];
      setSurahCache((prev) => (prev[surah] ? prev : { ...prev, [surah]: ayahs }));
    },
    [surahCache]
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item?: { surah?: number } }> }) => {
    const surahs = new Set<number>();
    viewableItems.forEach((v) => {
      if (v.item?.surah) surahs.add(v.item.surah);
    });
    surahs.forEach((s) => {
      ensureSurahLoaded(s);
    });
  }).current;

  const pageList = useMemo(() => {
    const total = getPageCount();
    const start = Math.max(1, currentPage - 10);
    const end = Math.min(total, currentPage + 10);
    const list: number[] = [];
    for (let p = start; p <= end; p += 1) list.push(p);
    return list;
  }, [currentPage]);

  const playToSubtitle = playToLabel.subtitle
    ? `${playToLabel.title} • ${playToLabel.subtitle}`
    : playToLabel.title;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={[styles.overlay, isWeb && readerBounds ? { paddingLeft: padLeft, paddingRight: padRight, alignItems: "center" } : null]}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.sheet, isWeb && styles.sheetWeb, { transform: [{ translateY }] }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeftGroup}>
            {view === "fawasil" ? (
              <Pressable style={styles.backButton} onPress={() => setView("main")} hitSlop={8}>
                <Feather name="chevron-right" size={18} color="#7A7A7A" />
              </Pressable>
            ) : null}
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Feather name="x" size={18} color="#7A7A7A" />
            </Pressable>
          </View>
          <Text style={styles.title}>{view === "fawasil" ? "الفواصل" : headerTitle}</Text>
          {view === "main" ? (
            <Pressable style={styles.editButton} onPress={() => {}} hitSlop={8}>
              <Text style={styles.editText}>{"تعديل"}</Text>
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {view === "main" ? (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{"الفواصل"}</Text>
                <View style={styles.sectionCard}>
                  <Pressable style={styles.actionRow} onPress={() => onSelectBookmark?.(activeBookmark ?? null)}>
                    <View style={styles.rowRight}>
                      {activeEntry ? (
                        <Ionicons name="bookmark" size={18} color={activeBookmark ?? "#7BBF94"} />
                      ) : (
                        <Feather name="bookmark" size={18} color={activeBookmark ?? "#7BBF94"} />
                      )}
                      <View style={styles.rowTextWrap}>
                        <Text style={styles.rowTitle}>{activeTitle}</Text>
                        <Text style={styles.rowSubtitle}>{activeSubtitle}</Text>
                      </View>
                    </View>
                  </Pressable>
                  <View style={styles.rowDivider} />
                  <Pressable style={styles.actionRow} onPress={() => setView("fawasil")}>
                    <View style={styles.rowRight}>
                      <Feather name="list" size={18} color="#6B7280" />
                      <Text style={styles.rowTitle}>{"الكل"}</Text>
                    </View>
                    <Feather name="chevron-left" size={18} color="#9CA3AF" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{"التلاوة"}</Text>
                <View style={styles.sectionCard}>
                  <Pressable
                    style={styles.actionRow}
                    onPress={async () => {
                      await startPlayTo(playTo);
                    }}
                  >
                    <View style={styles.rowRight}>
                      <Feather name={isPlaying ? "pause" : "play"} size={18} color="#2F6E52" />
                      <Text style={styles.rowTitle}>{"تشغيل"}</Text>
                    </View>
                  </Pressable>
                  <View style={styles.rowDivider} />
                  <Pressable style={styles.actionRow} onPress={() => setPlayToOpen(true)}>
                    <View style={styles.rowRight}>
                      <Feather name="play" size={18} color="#2F6E52" />
                      <View style={styles.rowTextWrap}>
                        <Text style={styles.rowTitle}>{"تشغيل إلى"}</Text>
                        <Text style={styles.rowSubtitle}>{playToSubtitle}</Text>
                      </View>
                    </View>
                    <Feather name="chevron-left" size={18} color="#9CA3AF" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{"التفسير"}</Text>
                <View style={styles.sectionCard}>
                  <Pressable style={styles.actionRow} onPress={() => {}}>
                    <View style={styles.rowRight}>
                      <Feather name="book" size={18} color="#6B7280" />
                      <Text style={styles.rowTitle}>{"اختيار كتاب..."}</Text>
                    </View>
                  </Pressable>
                  <View style={styles.rowDivider} />
                  <Pressable style={styles.actionRow} onPress={onOpenTafsir}>
                    <View style={styles.rowRight}>
                      <Feather name="book-open" size={18} color="#6B7280" />
                      <Text style={styles.rowTitle}>{"المكتبة"}</Text>
                    </View>
                    <Feather name="chevron-left" size={18} color="#9CA3AF" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{"المشاركة"}</Text>
                <View style={styles.sectionCard}>
                  <View style={styles.shareButtonsRow}>
                    <Pressable style={styles.shareSquare} onPress={onCopy}>
                      <Feather name="copy" size={18} color="#2F6E52" />
                      <Text style={styles.shareSquareText}>{"نسخ"}</Text>
                    </Pressable>
                    <Pressable style={styles.shareSquare} onPress={onShare}>
                      <Feather name="share-2" size={18} color="#2F6E52" />
                      <Text style={styles.shareSquareText}>{"مشاركة"}</Text>
                    </Pressable>
                  </View>
                  <View style={styles.rowDivider} />
                  <Pressable style={styles.actionRow} onPress={onShare}>
                    <View style={styles.rowRight}>
                      <Feather name="share-2" size={18} color="#2F6E52" />
                      <Text style={styles.rowTitle}>{"مشاركة"}</Text>
                    </View>
                    <Feather name="chevron-left" size={18} color="#9CA3AF" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{"التمييز"}</Text>
                <View style={styles.sectionCard}>
                  <View style={styles.colorRow}>
                    {HIGHLIGHT_COLORS.map((c) => {
                      const active = highlightColor === c;
                      return (
                        <Pressable key={c} onPress={() => onSelectHighlight?.(c)} style={styles.colorPress}>
                          <View style={[styles.colorDot, { backgroundColor: c }, active && styles.colorActive]} />
                        </Pressable>
                      );
                    })}
                    <Pressable onPress={() => onSelectHighlight?.(null)} style={styles.colorPress}>
                      <View style={[styles.colorDot, styles.noneDot]}>
                        <Feather name="slash" size={14} color="#6B7280" />
                      </View>
                    </Pressable>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.section}>
              <View style={styles.sectionCard}>
                {BOOKMARK_COLORS.map((c, idx) => {
                  const entry = fawasilLatest[c];
                  const title = BOOKMARK_COLOR_NAMES[c] ?? "";
                  const subtitle = entry ? buildSubtitle(entry.sura, entry.aya, entry.updatedAt) : "غير محدد";
                  return (
                    <Pressable
                      key={c}
                      style={[styles.actionRow, idx < BOOKMARK_COLORS.length - 1 ? styles.rowDivider : null]}
                      onPress={() => {
                        onSelectBookmark?.(c);
                        setView("main");
                      }}
                    >
                      <View style={styles.rowRight}>
                        <Ionicons name="bookmark" size={20} color={c} />
                        <View style={styles.rowTextWrap}>
                          <Text style={styles.rowTitle}>{title}</Text>
                          <Text style={styles.rowSubtitle}>{subtitle}</Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
      </View>

      <Modal visible={playToOpen} transparent animationType="none" onRequestClose={() => setPlayToOpen(false)}>
        <View style={[styles.overlay, isWeb && readerBounds ? { paddingLeft: padLeft, paddingRight: padRight, alignItems: "center" } : null]}>
          <Pressable style={styles.backdrop} onPress={() => setPlayToOpen(false)} />
          <Animated.View style={[styles.sheet, isWeb && styles.sheetWeb, { transform: [{ translateY: playToTranslateY }] }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeftGroup}>
              <Pressable style={styles.closeButton} onPress={() => setPlayToOpen(false)} hitSlop={8}>
                <Feather name="x" size={18} color="#7A7A7A" />
              </Pressable>
            </View>
            <Text style={styles.title}>{"تشغيل إلى"}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.contextText}>{`${currentSurahName}: ${arabicIndic(currentAyah)}`}</Text>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <View style={styles.sectionCard}>
                <Pressable
                  style={styles.actionRow}
                  onPress={() => {
                    void startPlayTo({ kind: "pageEnd" });
                  }}
                >
                  <View style={styles.rowRight}>
                    <Feather name="file-text" size={18} color="#2F6E52" />
                    <View style={styles.rowTextWrap}>
                      <Text style={styles.rowTitle}>{"نهاية الصفحة"}</Text>
                      <Text style={styles.rowSubtitle}>{`الصفحة ${arabicIndicMushaf(currentPage)}`}</Text>
                    </View>
                  </View>
                </Pressable>
                <View style={styles.rowDivider} />
                <Pressable
                  style={styles.actionRow}
                  onPress={() => {
                    void startPlayTo({ kind: "surahEnd" });
                  }}
                >
                  <View style={styles.rowRight}>
                    <Feather name="flag" size={18} color="#2F6E52" />
                    <View style={styles.rowTextWrap}>
                      <Text style={styles.rowTitle}>{"نهاية السورة"}</Text>
                      <Text style={styles.rowSubtitle}>{currentSurahName}</Text>
                    </View>
                  </View>
                </Pressable>
                <View style={styles.rowDivider} />
                <Pressable
                  style={styles.actionRow}
                  onPress={() => {
                    void startPlayTo({ kind: "continuous" });
                  }}
                >
                  <View style={styles.rowRight}>
                    <Feather name="repeat" size={18} color="#2F6E52" />
                    <View style={styles.rowTextWrap}>
                      <Text style={styles.rowTitle}>{"تشغيل مستمر"}</Text>
                      <Text style={styles.rowSubtitle}>{"لا يتوقف تلقائياً"}</Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.segmented}>
                {[
                  { key: "ayah", label: "آية" },
                  { key: "page", label: "صفحة" },
                  { key: "surah", label: "سورة" },
                ].map((tab) => (
                  <Pressable
                    key={tab.key}
                    onPress={() => setPlayToTab(tab.key as "ayah" | "page" | "surah")}
                    style={[styles.segmentItem, playToTab === tab.key && styles.segmentItemActive]}
                  >
                    <Text style={[styles.segmentText, playToTab === tab.key && styles.segmentTextActive]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionCard}>
                {playToTab === "ayah" ? (
                  <FlatList
                    style={styles.playToAyahList}
                    contentContainerStyle={styles.playToAyahListContent}
                    data={ayahTargets}
                    keyExtractor={(item) => `${item.surah}:${item.ayah}`}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 25 }}
                    initialNumToRender={20}
                    maxToRenderPerBatch={24}
                    windowSize={10}
                    removeClippedSubviews
                    renderItem={({ item }) => {
                      const surahMeta = SURAH_META.find((s) => s.number === item.surah);
                      const surahName = surahMeta?.name_ar ?? `سورة ${arabicIndic(item.surah)}`;
                      const verses = surahCache[item.surah];
                      const verseObj = verses?.[item.ayah - 1];
                      const ayahText = String(verseObj?.text ?? verseObj?.textUthmani ?? verseObj?.arabic ?? "...").trim();
                      return (
                        <Pressable
                          onPress={() => {
                            void startPlayTo({ kind: "ayah", surah: item.surah, ayah: item.ayah });
                          }}
                          style={({ pressed }) => [
                            styles.playToAyahItem,
                            pressed && styles.playToAyahItemPressed,
                          ]}
                        >
                          <Text style={styles.playToAyahTitle}>
                            {surahName}:{` `}{arabicIndicMushaf(item.ayah)}
                          </Text>
                          <Text style={styles.playToAyahPreview} numberOfLines={2} ellipsizeMode="tail">
                            {ayahText}
                          </Text>
                        </Pressable>
                      );
                    }}
                  />
                ) : playToTab === "page" ? (
                  pageList.map((p, idx) => (
                    <Pressable
                      key={`page-${p}`}
                      style={[styles.actionRow, idx < pageList.length - 1 ? styles.rowDivider : null]}
                      onPress={() => {
                        void startPlayTo({ kind: "page", page: p });
                      }}
                    >
                      <View style={styles.rowRight}>
                        <Text style={styles.rowTitle}>{`الصفحة ${arabicIndicMushaf(p)}`}</Text>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  SURAH_META.map((s, idx) => (
                    <Pressable
                      key={`surah-${s.number}`}
                      style={[styles.actionRow, idx < SURAH_META.length - 1 ? styles.rowDivider : null]}
                      onPress={() => {
                        void startPlayTo({ kind: "surah", surah: s.number });
                      }}
                    >
                      <View style={styles.rowRight}>
                        <View style={styles.rowTextWrap}>
                          <Text style={styles.rowTitle}>{s.name_ar}</Text>
                          <Text style={styles.rowSubtitle}>{arabicIndicMushaf(s.number)}</Text>
                        </View>
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F7F2E9",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    maxHeight: "88%",
  },
  sheetWeb: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 420,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE7D9",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE7D9",
  },
  title: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: quranTheme.colors.text,
    textAlign: "center",
    flex: 1,
  },
  editButton: {
    minWidth: 44,
    alignItems: "flex-start",
  },
  editText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#2F6E52",
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  section: {
    gap: 10,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: quranTheme.colors.text,
    textAlign: "right",
  },
  actionRow: {
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignSelf: "stretch",
  },
  rowRight: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  rowTextWrap: {
    alignItems: "flex-end",
  },
  rowTitle: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: quranTheme.colors.text,
    textAlign: "right",
  },
  rowSubtitle: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
    marginTop: 2,
  },
  colorRow: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  colorPress: {
    padding: 2,
    borderRadius: 999,
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  noneDot: {
    backgroundColor: "#F3EFE6",
    alignItems: "center",
    justifyContent: "center",
  },
  colorActive: {
    borderWidth: 2,
    borderColor: "#2F6E52",
  },
  shareButtonsRow: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  shareSquare: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  shareSquareText: {
    fontFamily: "CairoBold",
    fontSize: 13,
    color: quranTheme.colors.text,
  },
  contextText: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  segmented: {
    flexDirection: "row-reverse",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 6,
    gap: 8,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3EFE6",
  },
  segmentItemActive: {
    backgroundColor: "#2F6E52",
  },
  segmentText: {
    fontFamily: "CairoBold",
    fontSize: 13,
    color: "#6B7280",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
  playToAyahList: {
    flex: 1,
  },
  playToAyahListContent: {
    paddingVertical: 8,
  },
  playToAyahItem: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  playToAyahItemPressed: {
    opacity: 0.92,
  },
  playToAyahTitle: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: quranTheme.colors.text ?? "#1F3B2E",
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 6,
  },
  playToAyahPreview: {
    fontFamily: "Cairo",
    fontSize: 16,
    color: "rgba(0,0,0,0.60)",
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 26,
  },
});



