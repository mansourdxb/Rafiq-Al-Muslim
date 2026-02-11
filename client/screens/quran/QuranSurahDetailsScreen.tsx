import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, ImageBackground, Platform, Alert, Share, useWindowDimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { typography } from "@/theme/typography";
import { clearMark, loadMarks, setMark, type AyahMark } from "@/src/lib/quran/ayahMarks";
import { getPageCount, getPageData, getPageForAyah, arabicIndic } from "@/src/lib/quran/mushaf";
import ReaderOptionsSheet from "@/ui/quran/ReaderOptionsSheet";
import TafsirSheet from "@/ui/quran/TafsirSheet";
import QuranMiniPlayer from "@/src/components/quran/QuranMiniPlayer";

const DEBUG_QURAN_NAV = true;

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
};

export default function QuranSurahDetailsScreen({ initialPageNo, highlightAyah, jumpToPage, jumpId, jumpLockMs = 1200, trimBeforeSura, disableAutoScroll, onPageChange, onVisiblePageChange, openOptionsToken }: Props) {
  const [marks, setMarks] = useState<Record<string, AyahMark>>({});
  const [measuredPageHeight, setMeasuredPageHeight] = useState<number | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [tafsirVisible, setTafsirVisible] = useState(false);
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
  const initialTargetRef = useRef<number | null>(null);
  const lockedPageRef = useRef<number | null>(null);
  const hasSettledRef = useRef(false);
  const lockUntilRef = useRef<number>(0);
  const { height: windowHeight } = useWindowDimensions();
  const estimatedPageHeight = Math.max(640, windowHeight + 120);
  const pageHeight = disableAutoScroll ? measuredPageHeight ?? estimatedPageHeight : estimatedPageHeight;
  const getItemLayout = useCallback(
    (_: ArrayLike<number> | null | undefined, index: number) => ({
      length: pageHeight,
      offset: pageHeight * index,
      index,
    }),
    [pageHeight]
  );

  const scrollToPageIndex = useCallback(
    (index: number) => {
      listRef.current?.scrollToOffset({ offset: index * pageHeight, animated: false });
      const t = setTimeout(() => {
        listRef.current?.scrollToIndex({ index, animated: false });
      }, 50);
      return () => clearTimeout(t);
    },
    [pageHeight]
  );

  useEffect(() => {
    if (!DEBUG_QURAN_NAV) return;
    console.log("[QuranReader][debug] Details mount", { initialPageNo, jumpToPage, jumpId, highlightAyah });
  }, []);

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
    const t = setTimeout(() => {
      scrollToPageIndex(index);
    }, 0);
    return () => clearTimeout(t);
  }, [jumpId, jumpToPage, scrollToPageIndex]);

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

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={displayPages}
        keyExtractor={(item) => String(item)}
        initialScrollIndex={
          disableAutoScroll
            ? 0
            : trimBeforeSura && jumpToPage
              ? 0
              : Math.max(0, initialPage - 1)
        }
        getItemLayout={getItemLayout}
        scrollEnabled
        removeClippedSubviews={false}
        windowSize={10}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        onScrollToIndexFailed={({ index }) => {
          if (disableAutoScroll) {
            if (DEBUG_QURAN_NAV) {
              console.log("[QuranReader][debug] scrollToIndexFailed ignored", index);
            }
            return;
          }
          if (DEBUG_QURAN_NAV) {
            console.log("[QuranReader][debug] scrollToIndexFailed", index);
          }
          scrollToPageIndex(index);
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
          const bannerIndex = ayahs.findIndex((a) => a.aya === 1);
          const showBanner = bannerIndex >= 0;
          const bannerName = showBanner ? ayahs[bannerIndex].surahName : page.surahName;
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
              <View style={styles.pageHeaderRow}>
                <Text style={styles.pageHeaderLeft}>{page.surahName}</Text>
                <Text style={styles.pageHeaderRight}>{`الجزء ${arabicIndic(page.juzNo)}`}</Text>
              </View>

              {showBanner ? (
                <ImageBackground
                  source={require("../../assets/mushaf-frame.png")}
                  style={styles.frame}
                  imageStyle={styles.frameImage}
                >
                  <Text style={styles.frameTitle}>{`سورة ${bannerName.replace(/^سورة\s*/i, "")}`}</Text>
                </ImageBackground>
              ) : null}

              <Text style={styles.mushafText}>
                {ayahs.map((a, idx) => {
                  const prefix = idx === 0 ? "" : a.aya === 1 ? "\n\n" : " ";
                  const number = arabicIndic(a.aya);
                  const mark = markFor(a.sura, a.aya);
                  const bookmarkDot = mark?.bookmarkColor ?? null;
                  const isHighlighted =
                    highlightAyah && highlightAyah.sura === a.sura && highlightAyah.aya === a.aya;
                  return (
                      <Text
                        key={`${page.pageNo}-${a.sura}-${a.aya}`}
                        onPress={() => openAyahSheet(page.pageNo, page.juzNo, a)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          openAyahSheet(page.pageNo, page.juzNo, a);
                        }}
                      style={[
                        styles.ayahText,
                        mark?.highlightColor ? { backgroundColor: mark.highlightColor } : null,
                        isHighlighted ? styles.ayahHighlight : null,
                      ]}
                    >
                      {`${prefix}${a.text} ${number}`}
                      {bookmarkDot ? (
                        <Text style={[styles.bookmarkDot, { color: bookmarkDot }]}>{" \u25cf"}</Text>
                      ) : null}
                    </Text>
                  );
                })}
              </Text>

              <View style={styles.pageFooter}>
                <Text style={styles.pageNumber}>{page.pageNo}</Text>
              </View>
              <View style={styles.pageDivider} />
            </View>
          );
        }}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        windowSize={6}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
      />

        <ReaderOptionsSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          ayahNumber={selectedAyah?.ayahNumber ?? 1}
          surahName={selectedAyah?.surahName}
          surahNumber={selectedAyah?.surahNumber}
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
          const text = `${selectedAyah.ayahText}\nسورة ${selectedAyah.surahName} - آية ${selectedAyah.ayahNumber}`;
          await Share.share({ message: text });
        }}
        onCopy={() => {
          Alert.alert("نسخ", "النسخ غير متوفر حالياً.");
        }}
        onOpenTafsir={() => {
          setSheetVisible(false);
          setTafsirVisible(true);
        }}
      />
      <TafsirSheet
        visible={tafsirVisible}
        onClose={() => setTafsirVisible(false)}
        tafsirList={selectedAyah?.tafsirList ?? []}
      />
      <QuranMiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFE8DD" },
  scroll: {
    ...(Platform.OS === "web"
      ? ({ scrollbarWidth: "none", msOverflowStyle: "none" } as any)
      : null),
  },
  page: {
    backgroundColor: "#F8F1E6",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    minHeight: "100%",
  },
  frame: {
    width: "100%",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
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
    paddingBottom: 18,
  },
  pageHeaderRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
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
    lineHeight: 46,
    textAlign: "justify",
    writingDirection: "rtl",
    fontFamily: "KFGQPCUthmanicScript",
    color: "#2F2A24",
  },
  ayahText: {
    fontFamily: "KFGQPCUthmanicScript",
  },
  ayahHighlight: {
    backgroundColor: "rgba(30,139,90,0.18)",
  },
  bookmarkDot: {
    fontFamily: "KFGQPCUthmanicScript",
  },
  pageFooter: {
    marginTop: 12,
    alignItems: "center",
  },
  pageNumber: {
    ...typography.numberText,
    fontSize: 14,
    color: "#6E5A46",
    textAlign: "center",
  },
  pageDivider: {
    marginTop: 16,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
});
