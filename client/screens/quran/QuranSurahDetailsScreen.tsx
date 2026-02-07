import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, ImageBackground, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { typography } from "@/theme/typography";
import AyahActionSheet from "@/src/components/quran/AyahActionSheet";
import { clearMark, loadMarks, setMark, type AyahMark } from "@/src/lib/quran/ayahMarks";
import { getPageCount, getPageData, getPageForAyah, arabicIndic } from "@/src/lib/quran/mushaf";

type Props = {
  initialPageNo?: number;
  highlightAyah?: { sura: number; aya: number };
  jumpToPage?: number;
  jumpId?: number;
  onPageChange?: (pageNo: number) => void;
  onVisiblePageChange?: (pageNo: number, sura: number, surahName: string) => void;
};

export default function QuranSurahDetailsScreen({ initialPageNo, highlightAyah, jumpToPage, jumpId, onPageChange, onVisiblePageChange }: Props) {
  const [marks, setMarks] = useState<Record<string, AyahMark>>({});
  const [sheetVisible, setSheetVisible] = useState(false);
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

  useEffect(() => {
    if (!jumpToPage) return;
    const index = Math.max(0, jumpToPage - 1);
    const t = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: false });
    }, 0);
    return () => clearTimeout(t);
  }, [jumpId, jumpToPage]);
  const pageCount = getPageCount();
  const pages = useMemo(() => Array.from({ length: pageCount }, (_, i) => i + 1), [pageCount]);

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
    onPageChange?.(pageNo);
    const page = getPageData(pageNo);
    const first = page.ayahs[0];
    if (first) {
      onVisiblePageChange?.(pageNo, first.sura, first.surahName);
    }
  }).current;

  const initialPage = useMemo(() => {
    if (jumpToPage) return jumpToPage;
    if (initialPageNo) return initialPageNo;
    if (highlightAyah) return getPageForAyah(highlightAyah.sura, highlightAyah.aya);
    return 1;
  }, [highlightAyah, initialPageNo, jumpToPage]);

  return (
    <View style={styles.container}>
      <FlatList
        key={String(jumpId ?? "base")}
        ref={listRef}
        data={pages}
        keyExtractor={(item) => String(item)}
        extraData={jumpId}
        initialScrollIndex={Math.max(0, initialPage - 1)}
        onScrollToIndexFailed={({ index }) => {
          listRef.current?.scrollToOffset({ offset: index * 600, animated: false });
        }}
        renderItem={({ item: pageNo }) => {
          const page = getPageData(pageNo);
          const showBanner = page.ayahs[0]?.aya === 1;
          return (
            <View style={styles.pageSection}>
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
                  <Text style={styles.frameTitle}>{`سورة ${page.surahName.replace(/^سورة\s*/i, "")}`}</Text>
                </ImageBackground>
              ) : null}

              <Text style={styles.mushafText}>
                {page.ayahs.map((a, idx) => {
                  const prefix = idx === 0 ? "" : " ";
                  const number = arabicIndic(a.aya);
                  const mark = markFor(a.sura, a.aya);
                  const bookmarkDot = mark?.bookmarkColor ? " \u25cf" : "";
                  const isHighlighted =
                    highlightAyah && highlightAyah.sura === a.sura && highlightAyah.aya === a.aya;
                  return (
                    <Text
                      key={`${page.pageNo}-${a.sura}-${a.aya}`}
                      onLongPress={() => openAyahSheet(page.pageNo, page.juzNo, a)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        openAyahSheet(page.pageNo, page.juzNo, a);
                      }}
                      delayLongPress={250}
                      style={[
                        styles.ayahText,
                        mark?.highlightColor ? { backgroundColor: mark.highlightColor } : null,
                        isHighlighted ? styles.ayahHighlight : null,
                      ]}
                    >
                      {`${prefix}${a.text} ${number}${bookmarkDot}`}
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

      <AyahActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        surahName={selectedAyah?.surahName ?? ""}
        surahNumber={selectedAyah?.surahNumber ?? 1}
        ayahNumber={selectedAyah?.ayahNumber ?? 1}
        pageNo={selectedAyah?.pageNo ?? 1}
        juzNo={selectedAyah?.juzNo ?? 1}
        ayahText={selectedAyah?.ayahText ?? ""}
        tafsirList={selectedAyah?.tafsirList ?? []}
        bookmarkColor={selectedAyah ? markFor(selectedAyah.surahNumber, selectedAyah.ayahNumber)?.bookmarkColor ?? null : null}
        highlightColor={selectedAyah ? markFor(selectedAyah.surahNumber, selectedAyah.ayahNumber)?.highlightColor ?? null : null}
        onSelectBookmark={handleBookmarkSelect}
        onSelectHighlight={handleHighlightSelect}
      />
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
