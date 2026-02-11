import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  useWindowDimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useTheme } from "@/context/ThemeContext";
import type { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";
import { loadFavoriteItems, type FavoriteItemsMap } from "@/utils/hadithFavorites";
import { typography } from "@/theme/typography";

type FavItem = {
  favoriteId: string;
  bookId: string;
  chapterId: number | string | undefined;
  idInBook: number | string | undefined;
  bookTitle: string;
  chapterTitle: string;
  arabicText: string;
  savedAt: number;
};

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();

  const [itemsMap, setItemsMap] = useState<FavoriteItemsMap>({});

  useFocusEffect(
    useCallback(() => {
      loadFavoriteItems().then(setItemsMap).catch(() => setItemsMap({}));
    }, [])
  );

  const maxW = 430;
  const contentWidth = Math.min(width, maxW);

  const data = useMemo(() => {
    const list = Object.entries(itemsMap).map(([favoriteId, item]) => ({
      favoriteId,
      ...item,
    }));
    return list.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  }, [itemsMap]);

  const headerGradientColors = colors.headerGradient as [string, string, ...string[]];
  const pageBackground = colors.background;
  const sheetBackground = isDarkMode ? "#0D0F12" : "#F3F5F8";
  const cardOuterBackground = "#FFFFFF";
  const green = "#2E7D5B";
  const gold = "#B78B2D";
  const black = "#111111";
  const muted = "#6B7280";

  const openFavorite = (item: FavItem) => {
    const routeMap: Record<string, keyof LibraryStackParamList> = {
      bukhari: "BukhariChapter",
      muslim: "MuslimChapter",
      abudawud: "AbuDawudChapter",
      tirmidhi: "TirmidhiChapter",
      nasai: "NasaiChapter",
      ibnmajah: "IbnMajahChapter",
      malik: "MalikChapter",
      ahmed: "AhmedChapter",
      darimi: "DarimiChapter",
    };
    const routeName = routeMap[item.bookId];
    if (!routeName) return;
    navigation.navigate(routeName, {
      chapterId: Number(item.chapterId ?? 0),
      highlightId: item.idInBook,
    } as any);
  };

  return (
    <View style={[styles.root, { backgroundColor: pageBackground }]}>
      <LinearGradient
        colors={headerGradientColors}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={[styles.headerInner, { width: contentWidth }]}>
          <Text style={styles.headerTitle}>{"\u0627\u0644\u0645\u0641\u0636\u0644\u0629"}</Text>
        </View>
      </LinearGradient>

      <FlatList
        data={data}
        keyExtractor={(item) => item.favoriteId}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + 24, backgroundColor: sheetBackground },
        ]}
        renderItem={({ item }) => (
          <Pressable onPress={() => openFavorite(item)} style={styles.cardOuter}>
            <View style={[styles.cardInner, { backgroundColor: cardOuterBackground }]}>
              <View style={styles.metaBlock}>
                <Text style={styles.metaLine}>
                  <Text style={[styles.metaLabel, { color: green }]}>
                    {"\u0627\u0644\u0645\u0635\u062f\u0631: "}
                  </Text>
                  <Text style={[styles.metaValue, { color: gold }]}>
                    {item.bookTitle}
                  </Text>
                </Text>
                <Text style={styles.metaLine}>
                  <Text style={[styles.metaLabel, { color: green }]}>
                    {"\u0627\u0644\u0643\u062a\u0627\u0628: "}
                  </Text>
                  <Text style={[styles.metaValue, { color: gold }]}>
                    {item.chapterTitle}
                  </Text>
                </Text>
                <Text style={styles.metaLine}>
                  <Text style={[styles.metaLabel, { color: green }]}>
                    {"\u0631\u0642\u0645 \u0627\u0644\u062d\u062f\u064a\u062b: "}
                  </Text>
                  <Text style={[styles.metaValue, { color: gold }]}>
                    {item.idInBook}
                  </Text>
                </Text>
              </View>
              <Text
                style={[styles.previewText, { color: muted }]}
                numberOfLines={3}
              >
                {item.arabicText}
              </Text>
            </View>
          </Pressable>
        )}
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
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
    writingDirection: "rtl",
    ...typography.screenTitle,
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
  bookTitle: {
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    writingDirection: "rtl",
    fontFamily: "CairoBold",
  },
  chapterTitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    writingDirection: "rtl",
    fontFamily: "CairoBold",
  },
  hadithNumber: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    writingDirection: "rtl",
    fontFamily: "CairoBold",
  },
  metaBlock: {
    marginTop: 8,
  },
  metaLine: {
    fontSize: 12,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 2,
    ...typography.metaLabel,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "700",
    ...typography.metaLabel,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "700",
    ...typography.metaValue,
  },
  previewText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "right",
    writingDirection: "rtl",
    ...typography.hadithBody,
  },
});
