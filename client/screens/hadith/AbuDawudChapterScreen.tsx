import React, { useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Platform,
  Alert,
  ToastAndroid,
  Share,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

import { useTheme } from "@/context/ThemeContext";
import { typography } from "@/theme/typography";
import chapters from "@/data/the_9_books/abudawud/chapters";
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

type RouteProps = {
  key: string;
  name: "AbuDawudChapter";
  params: LibraryStackParamList["AbuDawudChapter"];
};

type ChapterData = {
  metadata?: {
    arabic?: { title?: string; author?: string; introduction?: string };
  };
  chapter?: {
    arabic?: string;
  };
  hadiths?: {
    id?: number;
    idInBook?: number;
    arabic?: string;
  }[];
};

function normalizeArabic(text: string) {
  return text.replace(/["']/g, "").trim();
}

function showToast(message: string) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert("", message);
  }
}

export default function AbuDawudChapterScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const { colors, isDarkMode } = useTheme();
  const route = useRoute<RouteProps>();

  const [favorites, setFavorites] = useState<FavoritesMap>({});
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItemsMap>({});

  useEffect(() => {
    loadFavorites().then(setFavorites).catch(() => setFavorites({}));
    loadFavoriteItems().then(setFavoriteItems).catch(() => setFavoriteItems({}));
  }, []);

  const maxW = 430;
  const contentWidth = Math.min(width, maxW);

  const chapterId = route.params?.chapterId;
  const highlightId = route.params?.highlightId;
  const chapter = (chapters as any)[chapterId] as ChapterData | undefined;

  const metadataTitle = chapter?.metadata?.arabic?.title || "";
  const metadataAuthor = chapter?.metadata?.arabic?.author || "";
  const metadataIntro = chapter?.metadata?.arabic?.introduction || "";
  const chapterTitle = chapter?.chapter?.arabic || metadataIntro || "";

  const headerGradientColors = colors.headerGradient as [string, string, ...string[]];
  const pageBackground = colors.background;
  const sheetBackground = isDarkMode ? "#0D0F12" : "#F3F5F8";
  const cardOuterBackground = "#FFFFFF";
  const labelColor = "#1E8B5A";
  const valueColor = "#B38B2D";
  const actionBg = "rgba(0,0,0,0.06)";
  const iconColor = "#111418";

  const bookId = "abudawud";

  const data = useMemo(() => chapter?.hadiths || [], [chapter]);

  const onToggleFavorite = async (
    favId: string,
    payload: {
      bookTitle: string;
      chapterTitle: string;
      arabicText: string;
      idInBook: number | string | undefined;
    }
  ) => {
    const next = { ...favorites };
    const nextItems = { ...favoriteItems };
    if (next[favId]) {
      delete next[favId];
      delete nextItems[favId];
      setFavorites(next);
      setFavoriteItems(nextItems);
      await saveFavorites(next);
      await saveFavoriteItems(nextItems);
      showToast("تمت الإزالة");
    } else {
      next[favId] = true;
      nextItems[favId] = {
        bookId,
        chapterId,
        idInBook: payload.idInBook,
        bookTitle: payload.bookTitle,
        chapterTitle: payload.chapterTitle,
        arabicText: payload.arabicText,
        savedAt: Date.now(),
      };
      setFavorites(next);
      setFavoriteItems(nextItems);
      await saveFavorites(next);
      await saveFavoriteItems(nextItems);
      showToast("تم الحفظ");
    }
  };

  const onCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    showToast("تم النسخ");
  };

  const onShare = async (text: string) => {
    await Share.share({ message: text });
  };

  return (
    <View style={[styles.root, { backgroundColor: pageBackground }]}>
      <LinearGradient
        colors={headerGradientColors}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={[styles.headerInner, { width: contentWidth }]}>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {chapterTitle}
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        data={data}
        keyExtractor={(item, index) => `${item.idInBook ?? item.id ?? index}`}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + 24, backgroundColor: sheetBackground },
        ]}
        renderItem={({ item, index }) => {
          const hadithId = item.idInBook ?? item.id ?? index;
          const favId = getFavoriteId(bookId, chapterId, hadithId);
          const isFav = !!favorites[favId];
          const cleanedText = normalizeArabic(item.arabic || "");
          const shareText = `حديث رقم ${hadithId}
${cleanedText}`;

          return (
            <View style={styles.cardOuter}>
              <View
                style={[
                  styles.cardInner,
                  { backgroundColor: cardOuterBackground },
                  hadithId === highlightId ? styles.highlightCard : null,
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <Pressable
                    onPress={() =>
                      onToggleFavorite(favId, {
                        bookTitle: metadataTitle,
                        chapterTitle,
                        arabicText: cleanedText,
                        idInBook: hadithId,
                      })
                    }
                    style={styles.bookmarkButton}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons
                      name={isFav ? "bookmark" : "bookmark-outline"}
                      size={18}
                      color={iconColor}
                    />
                  </Pressable>
                  <Text style={styles.hadithNumber}>
                    {`رقم ${hadithId}`}
                  </Text>
                </View>
                <Text style={styles.hadithText}>{cleanedText}</Text>

                <View style={styles.metaBox}>
                  <Text style={styles.metaLine}>
                    <Text style={[styles.metaLabel, { color: labelColor }]}>
                      {"المصدر: "}
                    </Text>
                    <Text style={[styles.metaValue, { color: valueColor }]}>
                      {metadataTitle}
                    </Text>
                  </Text>
                  <Text style={styles.metaLine}>
                    <Text style={[styles.metaLabel, { color: labelColor }]}>
                      {"المؤلف: "}
                    </Text>
                    <Text style={[styles.metaValue, { color: valueColor }]}>
                      {metadataAuthor}
                    </Text>
                  </Text>
                  <Text style={styles.metaLine}>
                    <Text style={[styles.metaLabel, { color: labelColor }]}>
                      {"الكتاب: "}
                    </Text>
                    <Text style={[styles.metaValue, { color: valueColor }]}>
                      {chapterTitle}
                    </Text>
                  </Text>
                  <Text style={styles.metaLine}>
                    <Text style={[styles.metaLabel, { color: labelColor }]}>
                      {"رقم الحديث: "}
                    </Text>
                    <Text style={[styles.metaValue, { color: valueColor }]}>
                      {String(hadithId)}
                    </Text>
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => onCopy(shareText)}
                    style={[styles.actionButton, { backgroundColor: actionBg }]}
                  >
                    <Ionicons name="copy-outline" size={16} color={iconColor} />
                  </Pressable>
                  <Pressable
                    onPress={() => onShare(shareText)}
                    style={[styles.actionButton, { backgroundColor: actionBg }]}
                  >
                    <Ionicons name="share-social-outline" size={16} color={iconColor} />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
        style={{ width: contentWidth }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
  },
  header: {
    width: "100%",
    paddingBottom: 16,
    alignItems: "center",
  },
  headerInner: {
    paddingHorizontal: 14,
    alignItems: "center",
  },
  headerTitle: {
    ...typography.screenTitle,
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
    writingDirection: "rtl",
    fontFamily: "CairoBold",
  },
  listContent: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 16,
    paddingHorizontal: 14,
    gap: 12,
  },
  cardOuter: {
    borderRadius: 22,
    padding: 8,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 10px 24px rgba(0,0,0,0.10)" } as any)
      : null),
  },
  cardInner: {
    borderRadius: 16,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  bookmarkButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  hadithNumber: {
    ...typography.numberText,
    fontSize: 14,
    fontWeight: "800",
    color: "#111418",
    writingDirection: "rtl",
    textAlign: "right",
  },
  hadithText: {
    ...typography.hadithBody,
    fontSize: 18,
    lineHeight: 30,
    color: "#111418",
    writingDirection: "rtl",
    textAlign: "right",
  },
  metaBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  metaLine: {
    marginBottom: 4,
    textAlign: "right",
    writingDirection: "rtl",
  },
  metaLabel: {
    ...typography.metaLabel,
    fontSize: 12,
    fontWeight: "700",
  },
  metaValue: {
    ...typography.metaValue,
    fontSize: 12,
    fontWeight: "700",
  },
  actionRow: {
    marginTop: 10,
    flexDirection: "row-reverse",
    gap: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
