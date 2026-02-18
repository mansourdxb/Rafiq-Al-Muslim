import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";
import { loadFavoriteItems, type FavoriteItemsMap } from "@/utils/hadithFavorites";

const HEADER_BG = "#1B4332";
const PAGE_BG = "#F3EEE4";
const CARD_BG = "#FFFFFF";
const PRIMARY = "#1C1714";
const SECONDARY = "#968C80";
const GREEN = "#2D7A4E";
const GOLD = "#B38B2D";

type FavItem = {
  favoriteId: string; bookId: string; chapterId: number | string | undefined;
  idInBook: number | string | undefined; bookTitle: string; chapterTitle: string;
  arabicText: string; savedAt: number;
};

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();
  const contentWidth = Math.min(width, 430);

  const [itemsMap, setItemsMap] = useState<FavoriteItemsMap>({});
  useFocusEffect(useCallback(() => { loadFavoriteItems().then(setItemsMap).catch(() => setItemsMap({})); }, []));

  const data = useMemo(() => {
    return Object.entries(itemsMap).map(([fid, item]) => ({ favoriteId: fid, ...item })).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  }, [itemsMap]);

  const routeMap: Record<string, keyof LibraryStackParamList> = {
    bukhari: "BukhariChapter", muslim: "MuslimChapter", abudawud: "AbuDawudChapter",
    tirmidhi: "TirmidhiChapter", nasai: "NasaiChapter", ibnmajah: "IbnMajahChapter",
    malik: "MalikChapter", ahmed: "AhmedChapter", darimi: "DarimiChapter",
  };

  const openFav = (item: FavItem) => {
    const r = routeMap[item.bookId]; if (!r) return;
    navigation.navigate(r, { chapterId: Number(item.chapterId ?? 0), highlightId: item.idInBook } as any);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>{"\u0627\u0644\u0645\u0641\u0636\u0644\u0629"}</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      {data.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons name="bookmark-outline" size={48} color={GREEN} /></View>
          <Text style={styles.emptyTitle}>{"\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u062d\u0627\u062f\u064a\u062b \u0645\u062d\u0641\u0648\u0638\u0629"}</Text>
          <Text style={styles.emptyDesc}>{"\u0639\u0646\u062f \u062d\u0641\u0638 \u062d\u062f\u064a\u062b \u0633\u064a\u0638\u0647\u0631 \u0647\u0646\u0627"}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.favoriteId}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 24, paddingHorizontal: 14, paddingTop: 14 }}
          style={{ width: contentWidth, alignSelf: "center" }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => openFav(item)}>
              <View style={styles.cardTop}>
                <Ionicons name="chevron-back" size={16} color="#C8B99A" />
                <View style={styles.cardMeta}>
                  <Text style={styles.cardBook}>{item.bookTitle}</Text>
                  <Text style={styles.cardChapter}>{item.chapterTitle}</Text>
                </View>
                <View style={styles.numBadge}>
                  <Text style={styles.numText}>{item.idInBook}</Text>
                </View>
              </View>
              <Text style={styles.previewText} numberOfLines={3}>{item.arabicText}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },
  header: { backgroundColor: HEADER_BG, paddingBottom: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "CairoBold", fontSize: 22, color: "#FFF", textAlign: "center", flex: 1 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(45,122,78,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontFamily: "CairoBold", fontSize: 20, color: PRIMARY, marginBottom: 8 },
  emptyDesc: { fontFamily: "Cairo", fontSize: 14, color: SECONDARY, textAlign: "center" },

  card: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row-reverse", alignItems: "center", gap: 10, marginBottom: 10 },
  cardMeta: { flex: 1, gap: 2 },
  cardBook: { fontFamily: "CairoBold", fontSize: 15, color: PRIMARY, textAlign: "right" },
  cardChapter: { fontFamily: "Cairo", fontSize: 12, color: GREEN, textAlign: "right" },
  numBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#E8E3D9", alignItems: "center", justifyContent: "center" },
  numText: { fontFamily: "CairoBold", fontSize: 13, color: "#4A4036" },
  previewText: { fontFamily: "Cairo", fontSize: 14, lineHeight: 24, color: SECONDARY, textAlign: "right", writingDirection: "rtl" },
});
