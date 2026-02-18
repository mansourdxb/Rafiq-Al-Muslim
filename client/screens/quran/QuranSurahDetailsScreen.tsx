import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, ImageBackground, Platform, Alert, Share, useWindowDimensions, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { typography } from "@/theme/typography";
import { clearMark, loadMarks, setMark, type AyahMark } from "@/src/lib/quran/ayahMarks";
import { getPageCount, getPageData, getPageForAyah, arabicIndic } from "@/src/lib/quran/mushaf";
import { getHizbQuarters } from "@/src/lib/quran/hizbQuarters";
import ReaderOptionsSheet from "@/ui/quran/ReaderOptionsSheet";
import TafsirSheet from "@/ui/quran/TafsirSheet";
import QuranMiniPlayer from "@/src/components/quran/QuranMiniPlayer";
import { getQuranPlaybackState, subscribeQuranPlayback } from "@/src/services/quranAudio";
import * as Clipboard from "expo-clipboard";
import AyahImageCard, { captureAndSaveAyahImage } from "@/ui/quran/AyahImageCard";
const DEBUG_QURAN_NAV = true;
const SANITIZE_SURAHS = new Set([7, 23, 26, 56, 62, 70, 79, 87, 96, 101, 107]);
const sanitizeAyah = (s: string) => s.replace(/\u06DF/g, "");
/** Decompose precomposed Arabic letters so the text shaper connects them properly */
const fixArabicShaping = (s: string) =>
  s.replace(/\u0622/g, "\u0627\u0653")   // آ → ا + maddah above
   .replace(/\u0623/g, "\u0627\u0654")   // أ → ا + hamza above
   .replace(/\u0625/g, "\u0627\u0655");  // إ → ا + hamza below
const BASMALAH = "\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0640\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650";
const HEADER_HEIGHT = 0;
const MINI_PLAYER_HEIGHT = 140;
const RUB3_SIGN = "\u06DE"; // ۞ Rub el Hizb sign

// Build a Set of "sura:aya" keys for the start of each Rub' al-Hizb quarter
const RUB3_STARTS: Set<string> = (() => {
  const set = new Set<string>();
  try {
    const quarters = getHizbQuarters();
    for (const q of quarters) {
      set.add(`${q.sura}:${q.aya}`);
    }
  } catch {}
  return set;
})();

const RUB3_LABELS: Map<string, string> = (() => {
  const map = new Map<string, string>();
  const toAr = (n: number) => n.toString().replace(/\d/g, (d) => "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669"[parseInt(d)]);
  try {
    const quarters = getHizbQuarters();
    for (let i = 0; i < quarters.length; i++) {
      const q = quarters[i];
      const hizbNum = Math.floor(i / 4) + 1;
      const quarterType = i % 4;
      const key = `${q.sura}:${q.aya}`;
      const h = toAr(hizbNum);
      if (quarterType === 0) map.set(key, `\u0627\u0644\u062d\u0632\u0628 ${h}`);
      else if (quarterType === 1) map.set(key, `\u0631\u0628\u0639 \u0627\u0644\u062d\u0632\u0628 ${h}`);
      else if (quarterType === 2) map.set(key, `\u0646\u0635\u0641 \u0627\u0644\u062d\u0632\u0628 ${h}`);
      else map.set(key, `\u062b\u0644\u0627\u062b\u0629 \u0623\u0631\u0628\u0627\u0639 \u0627\u0644\u062d\u0632\u0628 ${h}`);
    }
  } catch {}
  return map;
})();

const SUJOOD_SET = new Set([
  "7:206", "13:15", "16:49", "17:107", "19:58",
  "22:18", "22:77", "25:60", "27:25", "32:15",
  "38:24", "41:37", "53:62", "84:21", "96:19",
]);

type Props = {
  initialPageNo?: number;
  highlightAyah?: { sura: number; aya: number };
  jumpToPage?: number;
  jumpId?: number;
  jumpLockMs?: number;
  trimBeforeSura?: number;
  disableAutoScroll?: boolean;
  onPageChange?: (pageNo: number) => void;
  onVisiblePageChange?: (pageNo: number, sura: number, surahName: string) => void;
  openOptionsToken?: number;
  onToggleHeader?: () => void;
};

export default function QuranSurahDetailsScreen({ initialPageNo, highlightAyah, jumpToPage, jumpId, jumpLockMs = 1200, trimBeforeSura, disableAutoScroll, onPageChange, onVisiblePageChange, openOptionsToken, onToggleHeader }: Props) {
  const insets = useSafeAreaInsets();
  const [marks, setMarks] = useState<Record<string, AyahMark>>({});
  const [measuredPageHeight, setMeasuredPageHeight] = useState<number | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [tafsirVisible, setTafsirVisible] = useState(false);
  const [playback, setPlayback] = useState(getQuranPlaybackState());
  const [readerBounds, setReaderBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [frameHeight, setFrameHeight] = useState<number | null>(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [visibleAyahInfo, setVisibleAyahInfo] = useState<{ surah: number; ayah: number; surahName: string } | null>(null);
  const visibleAyahRef = useRef<{ surah: number; ayah: number; surahName: string } | null>(null);
  const initialAyahSetRef = useRef(false);
  const lastScrolledPageRef = useRef<number | null>(null);
  const [selectedAyah, setSelectedAyah] = useState<{
    surahName: string;
    surahNumber: number;
    ayahNumber: number;
    pageNo: number;
    juzNo: number;
    ayahText: string;
    tafsirList?: { type?: string; text?: string }[];
  } | null>(null);

  const listRef = useRef<FlatList<number>>(null);
  const readerFrameRef = useRef<View>(null);
  const pendingIndexRef = useRef<number | null>(null);
  const initialTargetRef = useRef<number | null>(null);
  const lockedPageRef = useRef<number | null>(null);
  const hasSettledRef = useRef(false);
  const lockUntilRef = useRef<number>(0);
  const ayahImageRef = useRef<View>(null);
  const { height: windowHeight } = useWindowDimensions();
  const calculatedHeight = Math.floor(windowHeight - HEADER_HEIGHT - insets.top - insets.bottom);
  const availableHeight = Math.max(420, Math.round(frameHeight ?? calculatedHeight));
  const pageHeight = disableAutoScroll ? measuredPageHeight ?? availableHeight : availableHeight;
  // Estimated total height per page item (content + marginBottom).
  // Used by getItemLayout for instant scroll jumps (initialScrollIndex).
  // Pages still render at NATURAL height (no height/overflow constraints),
  // so slight estimate drift self-corrects as FlatList measures real heights.
  const estimatedItemHeight = pageHeight + 10;

  const handleToggleControls = useCallback(() => {
    setControlsVisible((v) => !v);
    onToggleHeader?.();
  }, [onToggleHeader]);

  const scrollToPageIndex = useCallback(
    (index: number) => {
      listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 });
    },
    []
  );

  const revealPageIndex = useCallback(
    (index: number) => {
      if (index < 0) return;
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.2,
          viewOffset: MINI_PLAYER_HEIGHT + 12,
        });
      });
    },
    [MINI_PLAYER_HEIGHT]
  );

  useEffect(() => {
    if (!DEBUG_QURAN_NAV) return;
    console.log("[QuranReader][debug] Details mount", { initialPageNo, jumpToPage, jumpId, highlightAyah });
  }, []);

  useEffect(() => subscribeQuranPlayback(setPlayback), []);

  // Auto-show controls (header + mini player) when playback becomes active
  useEffect(() => {
    if (playback.isPlaying && !controlsVisible) {
      setControlsVisible(true);
      onToggleHeader?.();
    }
  }, [playback.isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!playback.surahNumber || !playback.ayahNumber) return;
    console.log("PLAYING", playback.surahNumber, playback.ayahNumber, playback.isPlaying);
  }, [playback.ayahNumber, playback.isPlaying, playback.surahNumber]);

  useEffect(() => {
    if (!jumpToPage) return;
    initialTargetRef.current = jumpToPage;
    const target = jumpToPage;
    if (disableAutoScroll) return;
    lockedPageRef.current = target;
    hasSettledRef.current = false;
    lockUntilRef.current = Date.now() + jumpLockMs;
    if (DEBUG_QURAN_NAV) {
      console.log("[QuranReader][debug] Details jump", { jumpToPage, jumpId, target });
    }
    const index = Math.max(0, target - 1);
    // Use scrollToIndex after a delay to let FlatList measure actual content heights.
    // initialScrollIndex gets us close; this corrects any drift from variable page heights.
    const t = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 });
    }, 300);
    return () => clearTimeout(t);
  }, [jumpId, jumpToPage, disableAutoScroll, jumpLockMs]);

  // highlightAyah is only used for visual highlighting (green background).
  // Scrolling is handled by jumpToPage above or initialScrollIndex on FlatList.

  useEffect(() => {
    if (!disableAutoScroll) return;
    if (!initialPageNo) return;
    // Keep initial page stable by ignoring early viewability noise.
    lockUntilRef.current = Date.now() + 2000;
    lockedPageRef.current = initialPageNo;
    hasSettledRef.current = false;
  }, [disableAutoScroll, initialPageNo]);
  const pageCount = getPageCount();
  const pages = useMemo(() => Array.from({ length: pageCount }, (_, i) => i + 1), [pageCount]);
  const displayPages = useMemo(() => {
    if (trimBeforeSura && jumpToPage) {
      return pages.slice(Math.max(0, jumpToPage - 1));
    }
    return pages;
  }, [pages, trimBeforeSura, jumpToPage]);

  const refreshMarks = useCallback(async () => {
    const loaded = await loadMarks();
    setMarks(loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshMarks();
    }, [refreshMarks])
  );

  const markFor = useCallback(
    (sura: number, ayahNumber: number) => marks[`${sura}:${ayahNumber}`],
    [marks]
  );

  const openAyahSheet = useCallback((pageNo: number, juzNo: number, ayah: { sura: number; aya: number; text: string; surahName: string; tafsir?: { type?: string; text?: string }[] }) => {
    setSelectedAyah({
      surahName: ayah.surahName,
      surahNumber: ayah.sura,
      ayahNumber: ayah.aya,
      pageNo,
      juzNo,
      ayahText: ayah.text,
      tafsirList: ayah.tafsir,
    });
    setSheetVisible(true);
  }, []);

  useEffect(() => {
    if (!openOptionsToken) return;
    if (selectedAyah) {
      setSheetVisible(true);
    }
  }, [openOptionsToken, selectedAyah]);

  const handleBookmarkSelect = useCallback(
    async (color: string | null) => {
      if (!selectedAyah) return;
      const current = markFor(selectedAyah.surahNumber, selectedAyah.ayahNumber);
      if (!color) {
        if (current?.highlightColor) {
          const updated = await setMark(selectedAyah.surahNumber, selectedAyah.ayahNumber, {
            bookmarkColor: null,
          });
          setMarks(updated);
        } else {
          const updated = await clearMark(selectedAyah.surahNumber, selectedAyah.ayahNumber);
          setMarks(updated);
        }
        return;
      }
      const updated = await setMark(selectedAyah.surahNumber, selectedAyah.ayahNumber, {
        bookmarkColor: color,
      });
      setMarks(updated);
    },
    [markFor, selectedAyah]
  );

  const handleHighlightSelect = useCallback(
    async (color: string | null) => {
      if (!selectedAyah) return;
      const current = markFor(selectedAyah.surahNumber, selectedAyah.ayahNumber);
      if (!color) {
        if (current?.bookmarkColor) {
          const updated = await setMark(selectedAyah.surahNumber, selectedAyah.ayahNumber, {
            highlightColor: null,
          });
          setMarks(updated);
        } else {
          const updated = await clearMark(selectedAyah.surahNumber, selectedAyah.ayahNumber);
          setMarks(updated);
        }
        return;
      }
      const updated = await setMark(selectedAyah.surahNumber, selectedAyah.ayahNumber, {
        highlightColor: color,
      });
      setMarks(updated);
    },
    [markFor, selectedAyah]
  );

  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 60 }), []);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: { item: number }[] }) => {
    if (!viewableItems?.length) return;
    const pageNo = viewableItems[0].item;
    if (DEBUG_QURAN_NAV) {
      console.log("[QuranReader][debug] viewable page", pageNo, "locked=", lockedPageRef.current, "settled=", hasSettledRef.current);
    }

    // ALWAYS track the visible page so auto-scroll knows where we are
    lastScrolledPageRef.current = pageNo;

    // If the user scrolled away from the initial page, clear the guard
    if (initialAyahSetRef.current && pageNo !== initialTargetRef.current) {
      initialAyahSetRef.current = false;
    }

    const updateVisibleAyah = (page: ReturnType<typeof getPageData>) => {
      // Don't override the navigation target on the initial page
      if (initialAyahSetRef.current) return;
      const first = page.ayahs[0];
      if (first) {
        visibleAyahRef.current = { surah: first.sura, ayah: first.aya, surahName: first.surahName };
        setVisibleAyahInfo({ surah: first.sura, ayah: first.aya, surahName: first.surahName });
      }
    };

    if (disableAutoScroll) {
      const lockedPage = lockedPageRef.current;
      if (lockedPage && pageNo !== lockedPage && Date.now() < lockUntilRef.current) {
        return;
      }
      onPageChange?.(pageNo);
      const page = getPageData(pageNo);
      const first = page.ayahs[0];
      if (first) {
        if (DEBUG_QURAN_NAV) {
          console.log("[QuranReader][debug] visible first ayah", { sura: first.sura, aya: first.aya, name: first.surahName });
        }
        onVisiblePageChange?.(pageNo, first.sura, first.surahName);
        updateVisibleAyah(page);
      }
      return;
    }
    const lockedPage = lockedPageRef.current;
    if (lockedPage && pageNo !== lockedPage && Date.now() < lockUntilRef.current) {
      return;
    }
    if (lockedPage && pageNo === lockedPage) {
      hasSettledRef.current = true;
    }
    if (lockedPage && !hasSettledRef.current) {
      // Ignore intermediate viewability updates while locking to target.
      return;
    }
    onPageChange?.(pageNo);
    const page = getPageData(pageNo);
    const first = page.ayahs[0];
    if (first) {
      if (DEBUG_QURAN_NAV) {
        console.log("[QuranReader][debug] visible first ayah", { sura: first.sura, aya: first.aya, name: first.surahName });
      }
      onVisiblePageChange?.(pageNo, first.sura, first.surahName);
      updateVisibleAyah(page);
    }
  }).current;

  const initialPage = useMemo(() => {
    const desired =
      jumpToPage ?? initialPageNo ?? (highlightAyah ? getPageForAyah(highlightAyah.sura, highlightAyah.aya) : 1);
    if (desired) {
      initialTargetRef.current = desired;
    }
    return desired ?? 1;
  }, [highlightAyah, initialPageNo, jumpToPage]);

  // Initialize visibleAyahInfo from navigation target, NOT the page's first ayah.
  // When navigating to Yusuf, page 235 has end-of-Hud at top + Yusuf at bottom.
  // We must use the navigation target (highlightAyah / trimBeforeSura) so the
  // play button starts from the correct surah.
  useEffect(() => {
    if (visibleAyahInfo) return; // already set by scroll
    // Initialize the page tracker so auto-scroll doesn't fire on the initial page
    lastScrolledPageRef.current = initialPage;
    // Prefer the explicit navigation target
    if (highlightAyah) {
      const page = getPageData(initialPage);
      const match = page.ayahs.find((a) => a.sura === highlightAyah.sura && a.aya === highlightAyah.aya);
      const fallback = page.ayahs.find((a) => a.sura === highlightAyah.sura);
      const target = match ?? fallback;
      if (target) {
        const info = { surah: target.sura, ayah: target.aya, surahName: target.surahName };
        visibleAyahRef.current = info;
        setVisibleAyahInfo(info);
        initialAyahSetRef.current = true;
        return;
      }
    }
    if (trimBeforeSura) {
      const page = getPageData(initialPage);
      const target = page.ayahs.find((a) => a.sura === trimBeforeSura);
      if (target) {
        const info = { surah: target.sura, ayah: target.aya, surahName: target.surahName };
        visibleAyahRef.current = info;
        setVisibleAyahInfo(info);
        initialAyahSetRef.current = true;
        return;
      }
    }
    // Fallback: first ayah on the page
    const page = getPageData(initialPage);
    const first = page.ayahs[0];
    if (first) {
      const info = { surah: first.sura, ayah: first.aya, surahName: first.surahName };
      visibleAyahRef.current = info;
      setVisibleAyahInfo(info);
    }
  }, [initialPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeAyahKey = `${playback.surahNumber ?? "none"}:${playback.ayahNumber ?? "none"}:${playback.isPlaying ? "p" : "s"}:${playback.isPaused ? "y" : "n"}`;

  // Auto-scroll to follow playback — only when playback moves to a DIFFERENT page
  useEffect(() => {
    if (!playback.surahNumber || !playback.ayahNumber) return;
    if (!playback.isPlaying) return;
    const targetPage = getPageForAyah(playback.surahNumber, playback.ayahNumber);
    // Don't scroll if we already handled this page
    if (lastScrolledPageRef.current === targetPage) return;
    lastScrolledPageRef.current = targetPage;
    // Check if the user is already looking at this page
    const currentVisiblePage = visibleAyahRef.current
      ? getPageForAyah(visibleAyahRef.current.surah, visibleAyahRef.current.ayah)
      : null;
    if (currentVisiblePage === targetPage) return;
    // Different page — scroll to it
    const index = displayPages.indexOf(targetPage);
    if (index < 0) return;
    revealPageIndex(index);
  }, [playback.ayahNumber, playback.isPlaying, playback.surahNumber, displayPages, revealPageIndex]);

  return (
    <View style={styles.container}>
      <View
        ref={readerFrameRef}
        style={styles.readerFrame}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (height > 0) setFrameHeight(height);
          if (Platform.OS !== "web") return;
          readerFrameRef.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
            const next = {
              x,
              y,
              width: measuredWidth || width,
              height: measuredHeight || height,
            };
            setReaderBounds(next);
          });
        }}
      >
        <FlatList
          ref={listRef}
          data={displayPages}
        keyExtractor={(item) => String(item)}
        extraData={activeAyahKey}
        getItemLayout={(_data, index) => ({
          length: estimatedItemHeight,
          offset: estimatedItemHeight * index,
          index,
        })}
        initialScrollIndex={
          disableAutoScroll
            ? 0
            : trimBeforeSura && jumpToPage
              ? 0
              : Math.max(0, initialPage - 1)
        }
        scrollEnabled
        removeClippedSubviews={false}
        windowSize={7}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          if (disableAutoScroll) {
            if (DEBUG_QURAN_NAV) {
              console.log("[QuranReader][debug] scrollToIndexFailed ignored", index);
            }
            return;
          }
          if (DEBUG_QURAN_NAV) {
            console.log("[QuranReader][debug] scrollToIndexFailed", index, "avgLen", averageItemLength);
          }
          pendingIndexRef.current = index;
          // Use FlatList's measured average item length for a better offset estimate
          const estimatedHeight = averageItemLength > 0 ? averageItemLength : pageHeight;
          const offset = Math.max(0, estimatedHeight * index);
          listRef.current?.scrollToOffset({ offset, animated: false });
          setTimeout(() => {
            const target = pendingIndexRef.current;
            if (target == null) return;
            pendingIndexRef.current = null;
            listRef.current?.scrollToIndex({ index: target, animated: false, viewPosition: 0 });
          }, 300);
        }}
        renderItem={({ item: pageNo }) => {
          const page = getPageData(pageNo);
          let ayahs = page.ayahs;
          if (trimBeforeSura && jumpToPage === pageNo) {
            const startIdx = ayahs.findIndex((a) => a.sura === trimBeforeSura && a.aya === 1);
            if (startIdx > 0) {
              ayahs = ayahs.slice(startIdx);
            }
          }

          // Group ayahs by surah for rendering banners between surahs
          const surahGroups: { sura: number; surahName: string; ayahs: typeof ayahs }[] = [];
          for (const a of ayahs) {
            const last = surahGroups[surahGroups.length - 1];
            if (last && last.sura === a.sura) {
              last.ayahs.push(a);
            } else {
              surahGroups.push({ sura: a.sura, surahName: a.surahName, ayahs: [a] });
            }
          }

          const isFatihaPage = surahGroups.length > 0 && surahGroups[0].sura === 1 && surahGroups[0].ayahs[0]?.aya === 1 && getPageForAyah(1, 1) === pageNo;

          let pageRub3Label: string | null = null;
          for (const a of ayahs) {
            const label = RUB3_LABELS.get(`${a.sura}:${a.aya}`);
            if (label) { pageRub3Label = label; break; }
          }

          const pageBody = (
            <View style={styles.pageContent}>
              <View style={styles.pageHeaderRow}>
                <Text style={styles.pageHeaderLeft} onPress={handleToggleControls} allowFontScaling={false}>{page.surahName}</Text>
                <Text style={styles.pageHeaderRight} onPress={handleToggleControls} allowFontScaling={false}>{`الجزء ${arabicIndic(page.juzNo)}`}</Text>
              </View>

              {isFatihaPage ? (
                <>
                  <ImageBackground
                    source={require("../../assets/mushaf-frame.png")}
                    style={styles.frame}
                    imageStyle={styles.frameImage}
                  >
                    <Text style={styles.frameTitle} allowFontScaling={false}>{`سورة ${surahGroups[0].surahName.replace(/^سورة\s*/i, "")}`}</Text>
                  </ImageBackground>
                  <View style={fatihaStyles.container}>
                    <Text style={fatihaStyles.mushafText} allowFontScaling={false}>
                      {surahGroups[0].ayahs.map((a, idx) => {
                        const number = arabicIndic(a.aya);
                        const displayText = fixArabicShaping(a.text.replace(/\u06DE/g, ""));
                        const isRub3Start = RUB3_STARTS.has(`${a.sura}:${a.aya}`);
                        const rub3Prefix = isRub3Start ? `${RUB3_SIGN}\u00A0` : "";
                        const mark = markFor(a.sura, a.aya);
                        const bookmarkDot = mark?.bookmarkColor ?? null;
                        const isHighlighted = highlightAyah && highlightAyah.sura === a.sura && highlightAyah.aya === a.aya;
                        const isActiveRecitation =
                          playback.surahNumber === a.sura &&
                          playback.ayahNumber === a.aya &&
                          (playback.isPlaying || playback.isPaused);
                        return (
                          <Text
                            key={`fatiha-${a.sura}-${a.aya}`}
                            onPress={handleToggleControls}
                            onLongPress={() => openAyahSheet(page.pageNo, page.juzNo, a)}
                            delayLongPress={220}
                            allowFontScaling={false}
                            style={[
                              styles.ayahText,
                              mark?.highlightColor ? { backgroundColor: mark.highlightColor } : null,
                              isHighlighted ? styles.ayahHighlight : null,
                              isActiveRecitation ? styles.activeRecitation : null,
                            ]}
                          >
                            {`${idx === 0 ? "" : " "}${rub3Prefix}${displayText}\u00A0${number}`}
                            {bookmarkDot ? (
                              <Text style={[styles.bookmarkDot, { color: bookmarkDot }]} allowFontScaling={false}>{" \u25cf"}</Text>
                            ) : null}
                          </Text>
                        );
                      })}
                    </Text>
                  </View>
                </>
              ) : (
                surahGroups.map((group, groupIdx) => {
                  const isNewSurah = group.ayahs[0]?.aya === 1 && getPageForAyah(group.sura, 1) === pageNo;
                  const showGroupBasmalah = isNewSurah && group.sura !== 1 && group.sura !== 9;

                  return (
                    <React.Fragment key={`group-${group.sura}-${groupIdx}`}>
                      {isNewSurah ? (
                        <>
                          <ImageBackground
                            source={require("../../assets/mushaf-frame.png")}
                            style={styles.frame}
                            imageStyle={styles.frameImage}
                          >
                            <Text style={styles.frameTitle} allowFontScaling={false}>{`سورة ${group.surahName.replace(/^سورة\s*/i, "")}`}</Text>
                          </ImageBackground>
                          {showGroupBasmalah ? (
                            <Text style={styles.basmalahText} onPress={handleToggleControls} allowFontScaling={false}>{BASMALAH}</Text>
                          ) : null}
                        </>
                      ) : null}
                      <Text style={styles.mushafText} allowFontScaling={false}>
                        {group.ayahs.map((a, idx) => {
                          const prefix = idx === 0 && groupIdx === 0 ? "" : idx === 0 ? "" : " ";
                          const number = arabicIndic(a.aya);
                          const rawText = (SANITIZE_SURAHS.has(a.sura) ? sanitizeAyah(a.text) : a.text).replace(/\u06DE/g, "");
                          const displayText = fixArabicShaping(rawText);
                          const isRub3Start = RUB3_STARTS.has(`${a.sura}:${a.aya}`);
                          const rub3Prefix = isRub3Start ? `${RUB3_SIGN}\u00A0` : "";
                          const mark = markFor(a.sura, a.aya);
                          const bookmarkDot = mark?.bookmarkColor ?? null;
                          const isHighlighted = highlightAyah && highlightAyah.sura === a.sura && highlightAyah.aya === a.aya;
                          const isActiveRecitation =
                            playback.surahNumber === a.sura &&
                            playback.ayahNumber === a.aya &&
                            (playback.isPlaying || playback.isPaused);
                          return (
                            <Text
                              key={`${page.pageNo}-${a.sura}-${a.aya}`}
                              onPress={handleToggleControls}
                              onLongPress={() => openAyahSheet(page.pageNo, page.juzNo, a)}
                              delayLongPress={220}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                openAyahSheet(page.pageNo, page.juzNo, a);
                              }}
                              allowFontScaling={false}
                              style={[
                                styles.ayahText,
                                mark?.highlightColor ? { backgroundColor: mark.highlightColor } : null,
                                isHighlighted ? styles.ayahHighlight : null,
                                isActiveRecitation ? styles.activeRecitation : null,
                              ]}
                            >
                              {SUJOOD_SET.has(`${a.sura}:${a.aya}`) && !a.text.includes("\u06E9")
                                ? `${prefix}${rub3Prefix}${displayText}\u00A0\u06E9\u00A0${number}`
                                : `${prefix}${rub3Prefix}${displayText}\u00A0${number}`}
                              {bookmarkDot ? (
                                <Text style={[styles.bookmarkDot, { color: bookmarkDot }]} allowFontScaling={false}>{" \u25cf"}</Text>
                              ) : null}
                            </Text>
                          );
                        })}
                      </Text>
                    </React.Fragment>
                  );
                })
              )}

              <View style={[styles.pageFooter, pageRub3Label ? { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 } : null]}>
                <Text style={styles.pageNumber} onPress={handleToggleControls} allowFontScaling={false}>{page.pageNo}</Text>
                {pageRub3Label ? (
                  <Text style={styles.rub3Label} onPress={handleToggleControls} allowFontScaling={false}>{pageRub3Label}</Text>
                ) : null}
              </View>
              <View style={styles.pageDivider} />
            </View>
          );

          return (
            <View
              style={styles.pageSection}
              onLayout={
                disableAutoScroll && !measuredPageHeight
                  ? (event) => {
                      const { height } = event.nativeEvent.layout;
                      if (height > 0) {
                        setMeasuredPageHeight(height);
                      }
                    }
                  : undefined
              }
            >
              {pageBody}
            </View>
          );
        }}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
        style={styles.scroll}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        />
      </View>

        <ReaderOptionsSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          ayahNumber={selectedAyah?.ayahNumber ?? 1}
          surahName={selectedAyah?.surahName}
          surahNumber={selectedAyah?.surahNumber}
          readerBounds={readerBounds}
          bookmarkColor={
          selectedAyah ? markFor(selectedAyah.surahNumber, selectedAyah.ayahNumber)?.bookmarkColor ?? null : null
        }
        highlightColor={
          selectedAyah ? markFor(selectedAyah.surahNumber, selectedAyah.ayahNumber)?.highlightColor ?? null : null
        }
        onSelectBookmark={handleBookmarkSelect}
        onSelectHighlight={handleHighlightSelect}
        onShare={async () => {
          if (!selectedAyah) return;
          const ayahRef = `${selectedAyah.surahName}: ${selectedAyah.ayahNumber}`;
          const text = `﴿${selectedAyah.ayahText}﴾ [${ayahRef}]\n\nبواسطة تطبيق رفيق المسلم\nhttps://rafiqapp.me`;
          try {
            await Share.share({ message: text });
          } catch (_) {}
        }}
        onCopy={async () => {
          if (!selectedAyah) return;
          const ayahRef = `${selectedAyah.surahName}: ${selectedAyah.ayahNumber}`;
          const deepLink = `https://rafiqapp.me/quran/${selectedAyah.surahNumber}/${selectedAyah.ayahNumber}`;
          const text = `﴿${selectedAyah.ayahText}﴾ [${ayahRef}]\n\nبواسطة تطبيق رفيق المسلم\n${deepLink}`;
          await Clipboard.setStringAsync(text);
          Alert.alert("تم النسخ", "تم نسخ الآية بنجاح");
        }}
        onOpenTafsir={() => {
          setSheetVisible(false);
          setTafsirVisible(true);
        }}
        onDownloadImage={async () => {
          if (!selectedAyah) return;
          await captureAndSaveAyahImage(ayahImageRef);
        }}
      />
      {/* Hidden ayah image card for capture */}
      {selectedAyah && (
        <AyahImageCard
          ref={ayahImageRef}
          surahName={selectedAyah.surahName}
          ayahNumber={selectedAyah.ayahNumber}
          ayahText={selectedAyah.ayahText}
        />
      )}
      <TafsirSheet
        visible={tafsirVisible}
        onClose={() => setTafsirVisible(false)}
        tafsirList={selectedAyah?.tafsirList ?? []}
      />
      <QuranMiniPlayer controlsVisible={controlsVisible} visibleAyahInfo={visibleAyahInfo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFE8DD" },
  readerFrame: { flex: 1 },
  scroll: {
    flex: 1,
    ...(Platform.OS === "web"
      ? ({ scrollbarWidth: "none", msOverflowStyle: "none" } as any)
      : null),
  },
  page: {
    backgroundColor: "#F8F1E6",
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  frame: {
    width: "100%",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    overflow: "hidden",
    borderRadius: 8,
  },
  frameImage: {
    resizeMode: "cover",
    alignSelf: "center",
  },
  frameTitle: {
    ...typography.itemTitle,
    fontSize: 20,
    color: "#6E5A46",
    textAlign: "center",
    writingDirection: "rtl",
  },
  pageSection: {
    backgroundColor: "#F8F1E6",
    paddingTop: 8,
    marginBottom: 10,
  },
  pageContent: {
    paddingBottom: 6,
  },
  pageHeaderRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  pageHeaderLeft: {
    ...typography.itemSubtitle,
    fontSize: 12,
    color: "#8B7B6A",
    textAlign: "left",
    writingDirection: "ltr",
  },
  pageHeaderRight: {
    ...typography.itemSubtitle,
    fontSize: 12,
    color: "#8B7B6A",
    textAlign: "right",
    writingDirection: "rtl",
  },
  mushafText: {
    fontSize: 26,
    lineHeight: 44,
    textAlign: "justify",
    writingDirection: "rtl",
    fontFamily: "KFGQPCUthmanicScript",
    color: "#2F2A24",
  },
  ayahText: {
    fontFamily: "KFGQPCUthmanicScript",
  },
  basmalahText: {
    fontFamily: "KFGQPCUthmanicScript",
    textAlign: "center",
    marginTop: 0,
    marginBottom: 6,
    fontSize: 26,
    color: "#4A3C2C",
    writingDirection: "rtl",
  },
  ayahHighlight: {
    backgroundColor: "rgba(30,139,90,0.18)",
  },
  activeRecitation: {
    backgroundColor: "rgba(47,110,82,0.16)",
  },
  bookmarkDot: {
    fontFamily: "KFGQPCUthmanicScript",
  },
  pageFooter: {
    marginTop: 4,
    alignItems: "center",
  },
  pageNumber: {
    ...typography.numberText,
    fontSize: 14,
    color: "#6E5A46",
    textAlign: "center",
  },
  rub3Label: {
    ...typography.numberText,
    fontSize: 13,
    color: "#8B7B6A",
    textAlign: "right",
    writingDirection: "rtl",
  },
  pageDivider: {
    marginTop: 4,
    height: 2,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
});

const fatihaStyles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  mushafText: {
    fontFamily: "KFGQPCUthmanicScript",
    fontSize: 34,
    lineHeight: 62,
    color: "#2F2A24",
    textAlign: "center",
    writingDirection: "rtl",
  },
});