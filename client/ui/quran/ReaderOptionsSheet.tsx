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
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { quranTheme } from "./theme";
import { loadMarks } from "@/src/lib/quran/ayahMarks";
import { quranFiles } from "@/lib/quran/quranFiles";
import { SURAH_META } from "@/constants/quran/surahMeta";
import { playAyah } from "@/src/services/quranAudio";
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
  onDownloadImage?: () => void;
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
  onDownloadImage,
  onOpenTafsir,
}: Props) {
  const isWeb = Platform.OS === "web";
  const overlayFrameStyle =
    isWeb && readerBounds
      ? {
          position: "absolute" as const,
          left: readerBounds.x,
          top: readerBounds.y,
          width: readerBounds.width,
          height: readerBounds.height,
          alignItems: "center" as const,
        }
      : null;
  const sheetFrameStyle =
    isWeb && readerBounds
      ? {
          width: readerBounds.width,
          maxWidth: readerBounds.width,
          top: 0,
          bottom: undefined,
          height: "100%",
          maxHeight: "100%",
        }
      : null;
  const translateY = useRef(new Animated.Value(400)).current;
  const playToTranslateY = useRef(new Animated.Value(420)).current;
  const [view, setView] = useState<"main" | "fawasil">("main");
  const [fawasilLatest, setFawasilLatest] = useState<Record<string, { sura: number; aya: number; updatedAt?: string }>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playToOpen, setPlayToOpen] = useState(false);
  const [playToTab, setPlayToTab] = useState<"ayah" | "page" | "surah">("ayah");
  const [playTo, setPlayTo] = useState<PlayToMode>({ kind: "pageEnd" });

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
        return { title: "آية محددة", subtitle: `${currentSurahName}: ${arabicIndicMushaf(playTo.ayah)}` };
      case "page":
        return { title: "صفحة محددة", subtitle: `الصفحة ${arabicIndicMushaf(playTo.page)}` };
      case "surah":
        return { title: "سورة محددة", subtitle: SURAH_META.find((sm) => sm.number === playTo.surah)?.name_ar ?? `سورة ${arabicIndic(playTo.surah)}` };
      default:
        return { title: "تشغيل إلى", subtitle: "" };
    }
  };

  const buildStopAt = () => {
    const pageCount = getPageCount();
    if (!currentSurahMeta) return undefined;
    if (playTo.kind === "continuous") return undefined;
    if (playTo.kind === "surahEnd") return { surah: currentSurah, ayah: currentAyahCount };
    if (playTo.kind === "ayah") return { surah: playTo.surah, ayah: playTo.ayah };
    if (playTo.kind === "surah") {
      const meta = SURAH_META.find((sm) => sm.number === playTo.surah);
      return { surah: playTo.surah, ayah: meta?.ayahCount ?? 0 };
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
    const startSurahNumber = surahNumber;
    const startAyahNumber = ayahNumber;
    const startSurahName = surahName;
    const computedStopAt = (() => {
      if (mode.kind === "continuous") return undefined;
      if (mode.kind === "surahEnd") return { surah: currentSurah, ayah: currentAyahCount };
      if (mode.kind === "ayah") return { surah: mode.surah, ayah: mode.ayah };
      if (mode.kind === "surah") {
        const meta = SURAH_META.find((sm) => sm.number === mode.surah);
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
      console.log("PLAY pressed", startSurahNumber, startAyahNumber);
      await playAyah({
        surah: startSurahNumber,
        ayah: startAyahNumber,
        surahName: startSurahName,
        ayahCount: SURAH_META.find((sm) => sm.number === startSurahNumber)?.ayahCount ?? 0,
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

  // Build ayah targets with text from getPageData (the same source the main screen uses)
  const ayahTargets = useMemo(() => {
    const out: Array<{ surah: number; ayah: number; text: string }> = [];
    const totalPages = getPageCount();
    const startPage = getPageForAyah(currentSurah, currentAyah);
    for (let p = startPage; p <= totalPages && out.length < 600; p += 1) {
      const pd = getPageData(p);
      if (!pd?.ayahs) continue;
      for (const a of pd.ayahs) {
        // Skip ayahs before our starting point
        if (a.sura < currentSurah || (a.sura === currentSurah && a.aya < currentAyah)) continue;
        out.push({ surah: a.sura, ayah: a.aya, text: a.text ?? "" });
        if (out.length >= 600) break;
      }
    }
    return out;
  }, [currentSurah, currentAyah]);

  const pageList = useMemo(() => {
    const total = getPageCount();
    const out: number[] = [];
    for (let p = currentPage; p <= total; p += 1) out.push(p);
    return out;
  }, [currentPage]);

  const playToSubtitle = playToLabel.subtitle
    ? `${playToLabel.title} • ${playToLabel.subtitle}`
    : playToLabel.title;

  // ─── Quick stops + tabs shared header for تشغيل إلى ───
  const PlayToListHeader = () => (
    <>
      <View style={st.quickGroup}>
        <Pressable style={st.quickRow} onPress={() => void startPlayTo({ kind: "pageEnd" })}>
          <Text style={st.quickLabel}>{"نهاية الصفحة"}</Text>
          <Text style={st.quickValue}>{arabicIndicMushaf(currentPage)}</Text>
        </Pressable>
        <View style={st.quickDivider} />
        <Pressable style={st.quickRow} onPress={() => void startPlayTo({ kind: "surahEnd" })}>
          <Text style={st.quickLabel}>{"نهاية السورة"}</Text>
          <Text style={st.quickValue}>{currentSurahName}</Text>
        </Pressable>
        <View style={st.quickDivider} />
        <Pressable style={st.quickRow} onPress={() => void startPlayTo({ kind: "continuous" })}>
          <Text style={st.quickLabel}>{"تشغيل مستمر"}</Text>
          <Text style={st.quickValue}>{"\u221e"}</Text>
        </Pressable>
      </View>

      <View style={st.segmented}>
        {(["ayah", "page", "surah"] as const).map((tab) => {
          const labels = { ayah: "آية", page: "صفحة", surah: "سورة" };
          const active = playToTab === tab;
          return (
            <Pressable key={tab} onPress={() => setPlayToTab(tab)} style={[st.segItem, active && st.segItemActive]}>
              <Text style={[st.segText, active && st.segTextActive]}>{labels[tab]}</Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={[st.overlay, overlayFrameStyle]}>
        <Pressable style={st.backdrop} onPress={onClose} />
        <Animated.View style={[st.sheet, isWeb && st.sheetWeb, sheetFrameStyle, { transform: [{ translateY }] }]}>

        {/* Handle */}
        <View style={st.handleWrap}><View style={st.handle} /></View>

        {/* Header */}
        <View style={st.header}>
          <View style={st.headerSide}>
            {view === "fawasil" && (
              <Pressable style={st.headerBtn} onPress={() => setView("main")} hitSlop={8}>
                <Feather name="chevron-right" size={16} color="#8B7D6B" />
              </Pressable>
            )}
            <Pressable style={st.headerBtn} onPress={onClose} hitSlop={8}>
              <Feather name="x" size={16} color="#8B7D6B" />
            </Pressable>
          </View>
          <Text style={st.headerTitle}>{view === "fawasil" ? "الفواصل" : headerTitle}</Text>
          <View style={st.headerSide}>
            {view === "main" && (
              <Pressable onPress={() => {}} hitSlop={8}>
                <Text style={st.headerActionText}>{"تعديل"}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Body */}
        <ScrollView contentContainerStyle={st.body} showsVerticalScrollIndicator={false}>
          {view === "main" ? (
            <>
              {/* ── الفواصل ── */}
              <View style={st.section}>
                <Text style={st.sectionLabel}>{"الفواصل"}</Text>
                <View style={st.card}>
                  <Pressable style={st.row} onPress={() => onSelectBookmark?.(activeBookmark ?? null)}>
                    <View style={st.rowInner}>
                      <View style={[st.bmBadge, { backgroundColor: activeBookmark ?? "#7BBF94" }]}>
                        <Ionicons name={activeEntry ? "bookmark" : "bookmark-outline"} size={14} color="#FFF" />
                      </View>
                      <View style={st.rowTexts}>
                        <Text style={st.rowLabel}>{activeTitle}</Text>
                        <Text style={st.rowSub}>{activeSubtitle}</Text>
                      </View>
                    </View>
                  </Pressable>
                  <View style={st.divider} />
                  <Pressable style={st.row} onPress={() => setView("fawasil")}>
                    <View style={st.rowInner}>
                      <View style={st.iconBg}><Feather name="list" size={14} color="#6B7280" /></View>
                      <Text style={st.rowLabel}>{"الكل"}</Text>
                    </View>
                    <Feather name="chevron-left" size={16} color="#C4B9A8" />
                  </Pressable>
                </View>
              </View>

              {/* ── التلاوة ── */}
              <View style={st.section}>
                <Text style={st.sectionLabel}>{"التلاوة"}</Text>
                <View style={st.card}>
                  <Pressable style={st.row} onPress={async () => { await startPlayTo(playTo); }}>
                    <View style={st.rowInner}>
                      <View style={st.playCircle}>
                        <Feather name={isPlaying ? "pause" : "play"} size={15} color="#FFF" />
                      </View>
                      <Text style={[st.rowLabel, { color: "#2F6E52" }]}>{"تشغيل"}</Text>
                    </View>
                  </Pressable>
                  <View style={st.divider} />
                  <Pressable style={st.row} onPress={() => setPlayToOpen(true)}>
                    <View style={st.rowInner}>
                      <View style={st.iconBgGreen}><Feather name="skip-forward" size={13} color="#2F6E52" /></View>
                      <View style={st.rowTexts}>
                        <Text style={st.rowLabel}>{"تشغيل إلى"}</Text>
                        <Text style={st.rowSub}>{playToSubtitle}</Text>
                      </View>
                    </View>
                    <Feather name="chevron-left" size={16} color="#C4B9A8" />
                  </Pressable>
                </View>
              </View>

              {/* ── التفسير ── */}
              <View style={st.section}>
                <Text style={st.sectionLabel}>{"التفسير"}</Text>
                <View style={st.card}>
                  <Pressable style={st.row} onPress={() => {}}>
                    <View style={st.rowInner}>
                      <View style={st.iconBg}><Feather name="book" size={14} color="#6B7280" /></View>
                      <Text style={st.rowLabel}>{"اختيار كتاب..."}</Text>
                    </View>
                  </Pressable>
                  <View style={st.divider} />
                  <Pressable style={st.row} onPress={onOpenTafsir}>
                    <View style={st.rowInner}>
                      <View style={st.iconBg}><Feather name="book-open" size={14} color="#6B7280" /></View>
                      <Text style={st.rowLabel}>{"المكتبة"}</Text>
                    </View>
                    <Feather name="chevron-left" size={16} color="#C4B9A8" />
                  </Pressable>
                </View>
              </View>

              {/* ── المشاركة ── */}
              <View style={st.section}>
                <Text style={st.sectionLabel}>{"المشاركة"}</Text>
                <View style={st.shareWrap}>
                  <Pressable style={st.shareBtn} onPress={onCopy}>
                    <View style={st.shareIcon}><Feather name="copy" size={18} color="#2F6E52" /></View>
                  </Pressable>
                  <Pressable style={st.shareBtn} onPress={onDownloadImage}>
                    <View style={st.shareIcon}><Feather name="download" size={18} color="#2F6E52" /></View>
                  </Pressable>
                </View>
                <View style={st.card}>
                  <Pressable style={st.row} onPress={onShare}>
                    <View style={st.rowInner}>
                      <View style={st.iconBgGreen}><Feather name="share" size={14} color="#2F6E52" /></View>
                      <Text style={st.rowLabel}>{"مشاركة"}</Text>
                    </View>
                    <Feather name="chevron-left" size={16} color="#C4B9A8" />
                  </Pressable>
                </View>
              </View>

              {/* ── التمييز ── */}
              <View style={st.section}>
                <Text style={st.sectionLabel}>{"التمييز"}</Text>
                <View style={[st.card, { paddingVertical: 14, paddingHorizontal: 16 }]}>
                  <View style={st.hlRow}>
                    {HIGHLIGHT_COLORS.map((c) => {
                      const active = highlightColor === c;
                      return (
                        <Pressable key={c} onPress={() => onSelectHighlight?.(c)} style={st.hlPress}>
                          <View style={[st.hlDot, { backgroundColor: c }, active && st.hlActive]} />
                        </Pressable>
                      );
                    })}
                    <Pressable onPress={() => onSelectHighlight?.(null)} style={st.hlPress}>
                      <View style={[st.hlDot, st.hlNone, !highlightColor && st.hlActive]}>
                        <Feather name="x" size={12} color="#9CA3AF" />
                      </View>
                    </Pressable>
                  </View>
                </View>
              </View>
            </>
          ) : (
            /* ── الفواصل detail ── */
            <View style={st.section}>
              <View style={st.card}>
                {BOOKMARK_COLORS.map((c, idx) => {
                  const entry = fawasilLatest[c];
                  const title = BOOKMARK_COLOR_NAMES[c] ?? "";
                  const subtitle = entry ? buildSubtitle(entry.sura, entry.aya, entry.updatedAt) : "غير محدد";
                  return (
                    <React.Fragment key={c}>
                      {idx > 0 && <View style={st.divider} />}
                      <Pressable style={st.row} onPress={() => { onSelectBookmark?.(c); setView("main"); }}>
                        <View style={st.rowInner}>
                          <View style={[st.bmBadge, { backgroundColor: c }]}>
                            <Ionicons name={entry ? "bookmark" : "bookmark-outline"} size={14} color="#FFF" />
                          </View>
                          <View style={st.rowTexts}>
                            <Text style={st.rowLabel}>{title}</Text>
                            <Text style={st.rowSub}>{subtitle}</Text>
                          </View>
                        </View>
                      </Pressable>
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
      </View>

      {/* ── تشغيل إلى overlay ── */}
      {playToOpen && (
        <View style={[st.overlay, overlayFrameStyle, StyleSheet.absoluteFillObject, { zIndex: 999 }]}>
          <Pressable style={st.backdrop} onPress={() => setPlayToOpen(false)} />
          <Animated.View style={[st.sheet, isWeb && st.sheetWeb, sheetFrameStyle, { transform: [{ translateY: playToTranslateY }] }]}>

          <View style={st.handleWrap}><View style={st.handle} /></View>

          {/* PlayTo header */}
          <View style={st.ptHeader}>
            <Pressable style={st.headerBtn} onPress={() => setPlayToOpen(false)} hitSlop={8}>
              <Feather name="x" size={16} color="#8B7D6B" />
            </Pressable>
            <Text style={st.ptTitle}>{"تشغيل إلى"}</Text>
            <View style={st.ptMetaWrap}>
              <Text style={st.ptMetaText}>{`${currentSurahName}: ${arabicIndicMushaf(currentAyah)}`}</Text>
              <Feather name="chevron-left" size={16} color="#2F6E52" />
            </View>
          </View>

          {playToTab === "ayah" ? (
            <FlatList
              contentContainerStyle={st.ptBody}
              showsVerticalScrollIndicator={false}
              data={ayahTargets}
              keyExtractor={(item) => `${item.surah}:${item.ayah}`}
              initialNumToRender={20}
              maxToRenderPerBatch={24}
              windowSize={10}
              removeClippedSubviews
              ListHeaderComponent={<PlayToListHeader />}
              renderItem={({ item }) => {
                const sm = SURAH_META.find((m) => m.number === item.surah);
                const sName = sm?.name_ar ?? `سورة ${arabicIndic(item.surah)}`;
                return (
                  <Pressable
                    onPress={() => void startPlayTo({ kind: "ayah", surah: item.surah, ayah: item.ayah })}
                    style={({ pressed }) => [st.ayahItem, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={st.ayahItemTitle}>{sName}:{` `}{arabicIndicMushaf(item.ayah)}</Text>
                    <Text style={st.ayahItemPreview} numberOfLines={2} ellipsizeMode="tail">{item.text}</Text>
                  </Pressable>
                );
              }}
            />
          ) : (
          <ScrollView contentContainerStyle={st.ptBody} showsVerticalScrollIndicator={false}>
            <PlayToListHeader />
            <View style={st.card}>
              {playToTab === "page" ? (
                pageList.map((p, idx) => {
                  const pd = getPageData(p);
                  const la = pd.ayahs?.[pd.ayahs.length - 1];
                  const sl = la?.surahName ?? pd.surahName ?? "";
                  const al = la?.aya ? arabicIndicMushaf(la.aya) : "";
                  return (
                    <React.Fragment key={`p-${p}`}>
                      {idx > 0 && <View style={st.divider} />}
                      <Pressable style={st.listRow} onPress={() => void startPlayTo({ kind: "page", page: p })}>
                        <Text style={st.listRowTitle}>{`الصفحة ${arabicIndicMushaf(p)}`}</Text>
                        <Text style={st.listRowSub}>{`${sl}: ${al}`}</Text>
                      </Pressable>
                    </React.Fragment>
                  );
                })
              ) : (
                SURAH_META.map((sm, idx) => (
                  <React.Fragment key={`s-${sm.number}`}>
                    {idx > 0 && <View style={st.divider} />}
                    <Pressable style={st.listRow} onPress={() => void startPlayTo({ kind: "surah", surah: sm.number })}>
                      <Text style={st.listRowTitle}>{sm.name_ar}</Text>
                      <Text style={st.listRowSub}>{`الصفحة ${arabicIndicMushaf(sm.pageStart)}`}</Text>
                    </Pressable>
                  </React.Fragment>
                ))
              )}
            </View>
          </ScrollView>
          )}
        </Animated.View>
        </View>
      )}
    </Modal>
  );
}

// ────────────────────────────────────────────
const C = {
  accent: "#2F6E52",
  surface: "#F7F2E9",
  card: "#FFFFFF",
  text: "#1A1612",
  textSec: "#6B6058",
  muted: "#8B7D6B",
};

const st = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)" },
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: C.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: "88%", paddingBottom: 8,
  },
  sheetWeb: { alignSelf: "center", width: "100%", maxWidth: 420 },

  // Handle
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 2 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#D5CCBE" },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10,
  },
  headerSide: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 48 },
  headerBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: "#EDE6DA",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontFamily: "CairoBold", fontSize: 17, color: C.text, textAlign: "center", flex: 1 },
  headerActionText: { fontFamily: "CairoBold", fontSize: 14, color: C.accent },

  // Body
  body: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },

  // Section
  section: { gap: 8 },
  sectionLabel: { fontFamily: "CairoBold", fontSize: 13, color: C.muted, textAlign: "right", paddingHorizontal: 4 },

  // Card
  card: { backgroundColor: C.card, borderRadius: 16, overflow: "hidden" },

  // Row
  row: {
    flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, paddingHorizontal: 14, minHeight: 50,
  },
  rowInner: { flexDirection: "row-reverse", alignItems: "center", gap: 10, flex: 1 },
  rowTexts: { alignItems: "flex-end", flex: 1 },
  rowLabel: { fontFamily: "CairoBold", fontSize: 15, color: C.text, textAlign: "right" },
  rowSub: { fontFamily: "Cairo", fontSize: 12, color: C.textSec, textAlign: "right", marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(0,0,0,0.07)", marginHorizontal: 14 },

  // Icons
  iconBg: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: "#F3EFE8",
    alignItems: "center", justifyContent: "center",
  },
  iconBgGreen: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(47,110,82,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  bmBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  playCircle: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: C.accent,
    alignItems: "center", justifyContent: "center",
  },

  // Share
  shareWrap: { flexDirection: "row-reverse", gap: 10, marginBottom: 10 },
  shareBtn: {
    flex: 1, backgroundColor: C.card, borderRadius: 16, paddingVertical: 24,
    alignItems: "center", justifyContent: "center",
  },
  shareIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(47,110,82,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  iconBgGreen: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(47,110,82,0.08)",
    alignItems: "center", justifyContent: "center",
  },

  // Highlight
  hlRow: { flexDirection: "row-reverse", justifyContent: "center", gap: 12 },
  hlPress: { padding: 2, borderRadius: 999 },
  hlDot: { width: 32, height: 32, borderRadius: 16 },
  hlNone: { backgroundColor: "#F0EBE2", alignItems: "center", justifyContent: "center" },
  hlActive: { borderWidth: 2.5, borderColor: C.accent },

  // PlayTo header
  ptHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10,
  },
  ptTitle: { fontFamily: "CairoBold", fontSize: 17, color: C.text, textAlign: "center", flex: 1 },
  ptMetaWrap: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
  ptMetaText: { fontFamily: "CairoBold", fontSize: 14, color: C.accent },
  ptBody: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },

  // Quick stops
  quickGroup: { backgroundColor: C.card, borderRadius: 16, overflow: "hidden" },
  quickRow: {
    flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, paddingHorizontal: 16,
  },
  quickDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(0,0,0,0.06)", marginHorizontal: 16 },
  quickLabel: { fontFamily: "CairoBold", fontSize: 15, color: C.text },
  quickValue: { fontFamily: "CairoBold", fontSize: 15, color: C.muted },

  // Segmented
  segmented: { flexDirection: "row-reverse", backgroundColor: C.card, borderRadius: 14, padding: 4 },
  segItem: { flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: "center", justifyContent: "center" },
  segItemActive: { backgroundColor: C.accent },
  segText: { fontFamily: "CairoBold", fontSize: 14, color: C.textSec },
  segTextActive: { color: "#FFFFFF" },

  // Ayah items
  ayahItem: {
    backgroundColor: C.card, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8,
  },
  ayahItemTitle: {
    fontFamily: "CairoBold", fontSize: 16, color: C.text,
    textAlign: "right", writingDirection: "rtl", marginBottom: 4,
  },
  ayahItemPreview: {
    fontFamily: "Cairo", fontSize: 14, color: C.textSec,
    textAlign: "right", writingDirection: "rtl", lineHeight: 24,
  },

  // List rows
  listRow: {
    flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 13, paddingHorizontal: 16, minHeight: 48,
  },
  listRowTitle: { fontFamily: "CairoBold", fontSize: 15, color: C.text, textAlign: "right" },
  listRowSub: { fontFamily: "Cairo", fontSize: 14, color: C.muted, textAlign: "left" },
});
