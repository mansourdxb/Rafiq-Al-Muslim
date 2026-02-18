import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import indexData from "@/data/the_9_books/abudawud/index.json";
import type { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";

const HEADER_BG = "#1B4332";
const PAGE_BG = "#F3EEE4";
const CARD_BG = "#FFFFFF";
const PRIMARY = "#1C1714";
const SECONDARY = "#968C80";
const GREEN = "#2D7A4E";

type BookItem = { id: number; en: string; ar: string };
type IndexData = { collectionId: string; titleAr: string; titleEn: string; books: BookItem[] };

export default function AbuDawudBooksScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();
  const contentWidth = Math.min(width, 430);

  const [query, setQuery] = useState("");
  const books = (indexData as IndexData).books ?? [];
  const title = (indexData as IndexData).titleAr;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) => b.ar.includes(query) || b.en.toLowerCase().includes(q));
  }, [books, query]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24, width: contentWidth, alignSelf: "center" }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={"\u0627\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0643\u062a\u0628"}
              placeholderTextColor={SECONDARY}
              style={styles.searchInput}
            />
            <Feather name="search" size={18} color={SECONDARY} />
          </View>
        </View>

        {/* Books list */}
        <View style={styles.listWrap}>
          {filtered.map((item, index) => (
            <React.Fragment key={item.id}>
              <Pressable
                style={styles.row}
                onPress={() => navigation.navigate("AbuDawudChapter", { chapterId: item.id })}
              >
                <Ionicons name="chevron-back" size={18} color="#C8B99A" />
                <Text style={styles.rowText} numberOfLines={2}>{item.ar}</Text>
                <View style={styles.rowBadge}>
                  <Text style={styles.rowBadgeText}>{item.id}</Text>
                </View>
              </Pressable>
              {index < filtered.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },
  header: {
    backgroundColor: HEADER_BG,
    paddingBottom: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "CairoBold",
    fontSize: 20,
    color: "#FFF",
    textAlign: "center",
    flex: 1,
  },
  searchWrap: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Cairo",
    fontSize: 15,
    color: PRIMARY,
    textAlign: "right",
    writingDirection: "rtl",
    paddingVertical: 0,
  },
  listWrap: {
    marginHorizontal: 14,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  rowText: {
    flex: 1,
    fontFamily: "CairoBold",
    fontSize: 15,
    color: PRIMARY,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 24,
  },
  rowBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8E3D9",
    alignItems: "center",
    justifyContent: "center",
  },
  rowBadgeText: {
    fontFamily: "CairoBold",
    fontSize: 13,
    color: "#4A4036",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E0D6",
    marginHorizontal: 14,
  },
});
