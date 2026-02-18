import React, { useMemo, useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Alert,
  ToastAndroid,
  Share,
  Pressable,
  Platform,
  ActionSheetIOS,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

import HadithImageCard, { shareHadithImage, saveHadithImage } from "@/ui/hadith/HadithImageCard";
import chapters from "@/data/the_9_books/ibnmajah/chapters";
import type { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";
import {
  getFavoriteId,
  loadFavorites,
  saveFavorites,
  loadFavoriteItems,
  saveFavoriteItems,
  type FavoritesMap,
  type FavoriteItemsMap,
} from "@/utils/hadithFavorites";

const HEADER_BG = "#1B4332";
const PAGE_BG = "#F3EEE4";
const CARD_BG = "#FFFFFF";
const PRIMARY = "#1C1714";
const SECONDARY = "#968C80";
const GREEN = "#2D7A4E";
const GOLD = "#B38B2D";

type RouteProps = { key: string; name: "IbnMajahChapter"; params: LibraryStackParamList["IbnMajahChapter"] };
type ChapterData = {
  metadata?: { arabic?: { title?: string; author?: string; introduction?: string } };
  chapter?: { arabic?: string };
  hadiths?: { id?: number; idInBook?: number; arabic?: string }[];
};

function normalizeArabic(text: string) { return text.replace(/["']/g, "").trim(); }
function showToast(msg: string) { Platform.OS === "android" ? ToastAndroid.show(msg, ToastAndroid.SHORT) : Alert.alert("", msg); }

const bookId = "ibnmajah";

export default function IbnMajahChapterScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const contentWidth = Math.min(width, 430);

  const [favorites, setFavorites] = useState<FavoritesMap>({});
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItemsMap>({});

  useEffect(() => {
    loadFavorites().then(setFavorites).catch(() => setFavorites({}));
    loadFavoriteItems().then(setFavoriteItems).catch(() => setFavoriteItems({}));
  }, []);

  const chapterId = route.params?.chapterId;
  const highlightId = route.params?.highlightId;
  const chapter = (chapters as any)[chapterId] as ChapterData | undefined;
  const metadataTitle = chapter?.metadata?.arabic?.title || "";
  const metadataAuthor = chapter?.metadata?.arabic?.author || "";
  const chapterTitle = chapter?.chapter?.arabic || chapter?.metadata?.arabic?.introduction || "";
  const data = useMemo(() => chapter?.hadiths || [], [chapter]);

  const flatListRef = useRef<FlatList>(null);
  const hasScrolled = useRef(false);

  const highlightIndex = useMemo(() => {
    if (highlightId == null) return -1;
    return data.findIndex((h) => String(h.idInBook ?? h.id) === String(highlightId));
  }, [data, highlightId]);

  // Render all items when navigating from search so scrollToIndex works
  const needsScroll = highlightIndex > 0;

  const handleContentSizeChange = useCallback(() => {
    if (needsScroll && !hasScrolled.current && flatListRef.current) {
      hasScrolled.current = true;
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: highlightIndex,
          animated: false,
          viewPosition: 0,
        });
      }, 50);
    }
  }, [needsScroll, highlightIndex]);

  const onToggleFavorite = async (favId: string, payload: { bookTitle: string; chapterTitle: string; arabicText: string; idInBook: number | string | undefined }) => {
    const next = { ...favorites }; const nextItems = { ...favoriteItems };
    if (next[favId]) {
      delete next[favId]; delete nextItems[favId];
      setFavorites(next); setFavoriteItems(nextItems);
      await saveFavorites(next); await saveFavoriteItems(nextItems);
      showToast("\u062a\u0645\u062a \u0627\u0644\u0625\u0632\u0627\u0644\u0629");
    } else {
      next[favId] = true;
      nextItems[favId] = { bookId, chapterId, idInBook: payload.idInBook, bookTitle: payload.bookTitle, chapterTitle: payload.chapterTitle, arabicText: payload.arabicText, savedAt: Date.now() };
      setFavorites(next); setFavoriteItems(nextItems);
      await saveFavorites(next); await saveFavoriteItems(nextItems);
      showToast("\u062a\u0645 \u0627\u0644\u062d\u0641\u0638");
    }
  };

  const onCopy = async (text: string) => { await Clipboard.setStringAsync(text); showToast("\u062a\u0645 \u0627\u0644\u0646\u0633\u062e"); };
  const onShareText = async (text: string) => { await Share.share({ message: text }); };

  const buildShareText = (hadithId: number | string, cleaned: string) =>
    `${cleaned}\n\n\u0627\u0644\u0645\u0635\u062f\u0631: ${metadataTitle}\n\u0627\u0644\u0645\u0624\u0644\u0641: ${metadataAuthor}\n\u0627\u0644\u0643\u062a\u0627\u0628: ${chapterTitle}\n\u0631\u0642\u0645 \u0627\u0644\u062d\u062f\u064a\u062b: ${hadithId}\n\n\u0628\u0648\u0627\u0633\u0637\u0629 \u062a\u0637\u0628\u064a\u0642 \u0631\u0641\u064a\u0642 \u0627\u0644\u0645\u0633\u0644\u0645\nhttps://rafiqapp.me`;

  // ── Image share ──
  const hadithImageRef = useRef<View>(null);
  const [imageData, setImageData] = useState({ hadithText: "", hadithNumber: "" as string | number, source: "", author: "", chapter: "" });

  const showShareMenu = useCallback((hadithId: number | string, cleaned: string, shareText: string) => {
    const options = ["\u0645\u0634\u0627\u0631\u0643\u0629 \u0643\u0646\u0635", "\u0645\u0634\u0627\u0631\u0643\u0629 \u0643\u0635\u0648\u0631\u0629", "\u062d\u0641\u0638 \u0627\u0644\u0635\u0648\u0631\u0629", "\u0625\u0644\u063a\u0627\u0621"];
    // مشاركة كنص، مشاركة كصورة، حفظ الصورة، إلغاء

    const handleAction = (index: number) => {
      if (index === 0) {
        onShareText(shareText);
      } else if (index === 1) {
        setImageData({ hadithText: cleaned, hadithNumber: hadithId, source: metadataTitle, author: metadataAuthor, chapter: chapterTitle });
        setTimeout(() => shareHadithImage(hadithImageRef), 100);
      } else if (index === 2) {
        setImageData({ hadithText: cleaned, hadithNumber: hadithId, source: metadataTitle, author: metadataAuthor, chapter: chapterTitle });
        setTimeout(() => saveHadithImage(hadithImageRef), 100);
      }
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 3, title: "\u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u062d\u062f\u064a\u062b" },
        handleAction
      );
    } else {
      Alert.alert("\u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u062d\u062f\u064a\u062b", "", [
        { text: "\u0645\u0634\u0627\u0631\u0643\u0629 \u0643\u0646\u0635", onPress: () => handleAction(0) },
        { text: "\u0645\u0634\u0627\u0631\u0643\u0629 \u0643\u0635\u0648\u0631\u0629", onPress: () => handleAction(1) },
        { text: "\u062d\u0641\u0638 \u0627\u0644\u0635\u0648\u0631\u0629", onPress: () => handleAction(2) },
        { text: "\u0625\u0644\u063a\u0627\u0621", style: "cancel" },
      ]);
    }
  }, [metadataTitle, metadataAuthor, chapterTitle]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={2}>{chapterTitle}</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item, i) => `${item.idInBook ?? item.id ?? i}`}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24, paddingHorizontal: 14, paddingTop: 14 }}
        style={{ width: contentWidth, alignSelf: "center" }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={needsScroll ? data.length : 10}
        maxToRenderPerBatch={needsScroll ? data.length : 10}
        windowSize={needsScroll ? 21 : 5}
        onContentSizeChange={handleContentSizeChange}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
          }, 100);
        }}
        renderItem={({ item, index }) => {
          const hadithId = item.idInBook ?? item.id ?? index;
          const favId = getFavoriteId(bookId, chapterId, hadithId);
          const isFav = !!favorites[favId];
          const cleaned = normalizeArabic(item.arabic || "");
          const shareText = buildShareText(hadithId, cleaned);

          return (
            <View style={[styles.card, highlightIndex === index && styles.cardHighlight]}>
              {/* Top row: number (right) + bookmark (left) */}
              <View style={styles.cardTop}>
                <Pressable onPress={() => onToggleFavorite(favId, { bookTitle: metadataTitle, chapterTitle, arabicText: cleaned, idInBook: hadithId })} hitSlop={10} style={styles.actionBtn}>
                  <Ionicons name={isFav ? "bookmark" : "bookmark-outline"} size={20} color={isFav ? GREEN : SECONDARY} />
                </Pressable>
                <Text style={styles.numLabel}>{"\u0631\u0642\u0645 "}{hadithId}</Text>
              </View>

              {/* Hadith text */}
              <Text style={styles.hadithText}>{cleaned}</Text>

              {/* Meta */}
              <View style={styles.metaBox}>
                <Text style={styles.metaLine}>
                  <Text style={styles.metaLabel}>{"\u0627\u0644\u0645\u0635\u062f\u0631: "}</Text>
                  <Text style={styles.metaValue}>{metadataTitle}</Text>
                </Text>
                <Text style={styles.metaLine}>
                  <Text style={styles.metaLabel}>{"\u0627\u0644\u0645\u0624\u0644\u0641: "}</Text>
                  <Text style={styles.metaValue}>{metadataAuthor}</Text>
                </Text>
                <Text style={styles.metaLine}>
                  <Text style={styles.metaLabel}>{"\u0627\u0644\u0643\u062a\u0627\u0628: "}</Text>
                  <Text style={styles.metaValue}>{chapterTitle}</Text>
                </Text>
                <Text style={styles.metaLine}>
                  <Text style={styles.metaLabel}>{"\u0631\u0642\u0645 \u0627\u0644\u062d\u062f\u064a\u062b: "}</Text>
                  <Text style={styles.metaValue}>{String(hadithId)}</Text>
                </Text>
              </View>

              {/* Share/Copy at bottom */}
              <View style={styles.cardActions}>
                <Pressable onPress={() => showShareMenu(hadithId, cleaned, shareText)} hitSlop={10} style={styles.actionBtn}>
                  <Ionicons name="share-social-outline" size={16} color={SECONDARY} />
                </Pressable>
                <Pressable onPress={() => onCopy(shareText)} hitSlop={10} style={styles.actionBtn}>
                  <Ionicons name="copy-outline" size={16} color={SECONDARY} />
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      {/* Hidden card for image capture */}
      <HadithImageCard
        ref={hadithImageRef}
        hadithText={imageData.hadithText}
        hadithNumber={imageData.hadithNumber}
        source={imageData.source}
        author={imageData.author}
        chapter={imageData.chapter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },
  header: { backgroundColor: HEADER_BG, paddingBottom: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "CairoBold", fontSize: 18, color: "#FFF", textAlign: "center", flex: 1, writingDirection: "rtl", lineHeight: 28 },

  card: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHighlight: { borderWidth: 2, borderColor: GREEN },

  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  numLabel: { fontFamily: "CairoBold", fontSize: 15, color: PRIMARY, textAlign: "right" },
  cardActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 10 },
  actionBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F5F1E8", alignItems: "center", justifyContent: "center" },

  hadithText: { fontFamily: "Cairo", fontSize: 17, lineHeight: 32, color: PRIMARY, textAlign: "right", writingDirection: "rtl" },

  metaBox: { marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E5E0D6", gap: 4 },
  metaLine: { textAlign: "right", writingDirection: "rtl", fontSize: 13 },
  metaLabel: { fontFamily: "CairoBold", fontSize: 13, color: GREEN },
  metaValue: { fontFamily: "Cairo", fontSize: 13, color: GOLD },
});
