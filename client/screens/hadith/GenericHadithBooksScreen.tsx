import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useHadithBook } from "@/hooks/useHadithBook";
import type { BookKey } from "@/utils/hadithBookCache";

const HEADER_BG = "#1B4332";
const PAGE_BG = "#F3EEE4";
const CARD_BG = "#FFFFFF";
const PRIMARY = "#1C1714";
const SECONDARY = "#968C80";
const GREEN = "#2D7A4E";

type BookItem = { id: number; en: string; ar: string };

type Props = {
  bookKey: BookKey;
  chapterRoute: string;
  fallbackTitle?: string;
};

export default function GenericHadithBooksScreen({ bookKey, chapterRoute, fallbackTitle }: Props) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const contentWidth = Math.min(width, 430);

  const { indexData, loading, cached, downloading, progress, download, error } =
    useHadithBook(bookKey);

  const [query, setQuery] = useState("");
  const books: BookItem[] = indexData?.books ?? [];
  const title = indexData?.titleAr ?? fallbackTitle ?? bookKey;
console.log("HADITH_DEBUG:", bookKey, "cached:", cached, "loading:", loading, "books:", books.length, "error:", error, "indexData:", indexData ? "YES" : "NULL");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) => b.ar.includes(query) || b.en.toLowerCase().includes(q));
  }, [books, query]);

  // Not cached — show download prompt
  if (!loading && !cached) {
    return (
      <View style={s.root}>
        <View style={[s.header, { paddingTop: insets.top + 4 }]}>
          <View style={s.headerRow}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </Pressable>
            <Text style={s.headerTitle}>{title}</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>
        <View style={s.emptyWrap}>
          <Ionicons name="cloud-download-outline" size={56} color="#D4AF37" />
          <Text style={s.emptyTitle}>الكتاب غير محمل</Text>
          <Text style={s.emptySub}>يجب تحميل الكتاب أولاً لتتمكن من القراءة</Text>
          {downloading ? (
            <View style={s.dlRow}>
              <ActivityIndicator size="small" color={GREEN} />
              <Text style={s.dlPct}>{progress}%</Text>
            </View>
          ) : (
            <Pressable style={s.dlBtn} onPress={download}>
              <Ionicons name="cloud-download-outline" size={20} color="#FFF" />
              <Text style={s.dlBtnText}>تحميل الكتاب</Text>
            </Pressable>
          )}
          {error && <Text style={s.errText}>{error}</Text>}
        </View>
      </View>
    );
  }

  // Loading
  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 4 }]}>
        <View style={s.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </Pressable>
          <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24, width: contentWidth, alignSelf: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.searchWrap}>
          <View style={s.searchBox}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="ابحث في الكتب"
              placeholderTextColor={SECONDARY}
              style={s.searchInput}
            />
            <Feather name="search" size={18} color={SECONDARY} />
          </View>
        </View>

        <View style={s.listWrap}>
          {filtered.map((item, index) => (
            <React.Fragment key={item.id}>
              <Pressable
                style={s.row}
                onPress={() => navigation.navigate(chapterRoute, { chapterId: item.id })}
              >
                <Ionicons name="chevron-back" size={18} color="#C8B99A" />
                <Text style={s.rowText} numberOfLines={2}>{item.ar}</Text>
                <View style={s.rowBadge}>
                  <Text style={s.rowBadgeText}>{item.id}</Text>
                </View>
              </Pressable>
              {index < filtered.length - 1 && <View style={s.divider} />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },
  center: { alignItems: "center", justifyContent: "center" },
  header: { backgroundColor: HEADER_BG, paddingBottom: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "CairoBold", fontSize: 20, color: "#FFF", textAlign: "center", flex: 1 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30, gap: 10 },
  emptyTitle: { fontFamily: "CairoBold", fontSize: 20, color: PRIMARY, marginTop: 10 },
  emptySub: { fontFamily: "Cairo", fontSize: 14, color: SECONDARY, textAlign: "center" },
  dlBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: GREEN, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 24, marginTop: 10 },
  dlBtnText: { fontFamily: "CairoBold", fontSize: 16, color: "#FFF" },
  dlRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  dlPct: { fontFamily: "CairoBold", fontSize: 16, color: GREEN },
  errText: { fontFamily: "Cairo", fontSize: 13, color: "#C0392B", marginTop: 6 },
  searchWrap: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 8 },
  searchBox: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: CARD_BG, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontFamily: "Cairo", fontSize: 15, color: PRIMARY, textAlign: "right", writingDirection: "rtl", paddingVertical: 0 },
  listWrap: { marginHorizontal: 14, backgroundColor: CARD_BG, borderRadius: 16, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 14, gap: 10 },
  rowText: { flex: 1, fontFamily: "CairoBold", fontSize: 15, color: PRIMARY, textAlign: "right", writingDirection: "rtl", lineHeight: 24 },
  rowBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#E8E3D9", alignItems: "center", justifyContent: "center" },
  rowBadgeText: { fontFamily: "CairoBold", fontSize: 13, color: "#4A4036" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E5E0D6", marginHorizontal: 14 },
});
