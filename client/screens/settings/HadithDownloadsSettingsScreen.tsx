import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@/context/ThemeContext";
import {
  HADITH_BOOKS, isBookCached, downloadBook, deleteBook, clearAllBooks,
  getHadithCacheSize, formatBytes, type BookKey, type BookInfo, type DownloadProgress,
} from "@/utils/hadithBookCache";

export default function HadithDownloadsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [cachedKeys, setCachedKeys] = useState<Set<BookKey>>(new Set());
  const [downloading, setDownloading] = useState<BookKey | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalSize, setTotalSize] = useState("...");

  useFocusEffect(useCallback(() => { refreshStatus(); }, []));

  const refreshStatus = async () => {
    const cached = new Set<BookKey>();
    for (const book of HADITH_BOOKS) { if (await isBookCached(book.key)) cached.add(book.key); }
    setCachedKeys(cached);
    const bytes = await getHadithCacheSize();
    setTotalSize(bytes > 0 ? formatBytes(bytes) : "فارغ");
  };

  const handleDownload = async (book: BookInfo) => {
    if (downloading) return;
    setDownloading(book.key); setProgress(0);
    try { await downloadBook(book.key, (p: DownloadProgress) => setProgress(p.percent)); setCachedKeys((prev) => new Set([...prev, book.key])); }
    catch { Alert.alert("خطأ", "تأكد من اتصالك بالإنترنت"); }
    finally { setDownloading(null); setProgress(0); refreshStatus(); }
  };

  const handleDelete = (book: BookInfo) => {
    Alert.alert("حذف", `حذف ${book.arabicName}?`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: async () => { await deleteBook(book.key); setCachedKeys((prev) => { const n = new Set(prev); n.delete(book.key); return n; }); refreshStatus(); } },
    ]);
  };

  const handleClearAll = () => {
    if (cachedKeys.size === 0) return;
    Alert.alert("حذف الكل", "حذف جميع كتب الحديث المحملة?", [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: async () => { await clearAllBooks(); setCachedKeys(new Set()); refreshStatus(); } },
    ]);
  };

  const handleDownloadAll = async () => {
    const missing = HADITH_BOOKS.filter((b) => !cachedKeys.has(b.key));
    if (missing.length === 0) { Alert.alert("", "جميع الكتب محملة"); return; }
    for (const book of missing) {
      setDownloading(book.key); setProgress(0);
      try { await downloadBook(book.key, (p: DownloadProgress) => setProgress(p.percent)); setCachedKeys((prev) => new Set([...prev, book.key])); } catch { break; }
    }
    setDownloading(null); setProgress(0); refreshStatus();
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 4, backgroundColor: colors.headerBackground }]}>
        <View style={s.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.headerText} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.headerText }]}>إدارة كتب الحديث</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>
      <FlatList
        data={HADITH_BOOKS} keyExtractor={(item) => item.key}
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[s.statsCard, { backgroundColor: colors.cardBackground }]}>
            <View style={s.statsRow}>
              <Text style={[s.statsLabel, { color: colors.text }]}>{cachedKeys.size} من {HADITH_BOOKS.length} كتب محملة</Text>
              <Text style={[s.statsSize, { color: colors.textSecondary }]}>{totalSize}</Text>
            </View>
            <View style={[s.bar, { backgroundColor: colors.divider }]}><View style={[s.barFill, { backgroundColor: colors.green, width: `${(cachedKeys.size / HADITH_BOOKS.length) * 100}%` }]} /></View>
            <View style={s.actionRow}>
              <Pressable style={[s.actionBtn, { borderColor: colors.green }]} onPress={handleDownloadAll}>
                <Ionicons name="cloud-download-outline" size={16} color={colors.green} />
                <Text style={[s.actionText, { color: colors.green }]}>تحميل الكل</Text>
              </Pressable>
              <Pressable style={[s.actionBtn, { borderColor: colors.danger }]} onPress={handleClearAll}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={[s.actionText, { color: colors.danger }]}>حذف الكل</Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isCached = cachedKeys.has(item.key);
          const isDown = downloading === item.key;
          return (
            <View style={[s.bookCard, { backgroundColor: colors.cardBackground, borderColor: isCached ? colors.greenLight : "transparent" }]}>
              <View style={s.bookRow}>
                {isDown ? (
                  <View style={s.dlWrap}><ActivityIndicator size="small" color={colors.green} /><Text style={[s.dlPct, { color: colors.green }]}>{progress}%</Text></View>
                ) : isCached ? (
                  <Pressable onPress={() => handleDelete(item)} hitSlop={10}><Ionicons name="trash-outline" size={20} color={colors.danger} /></Pressable>
                ) : (
                  <Pressable onPress={() => handleDownload(item)} hitSlop={10}><Ionicons name="cloud-download-outline" size={22} color={colors.gold} /></Pressable>
                )}
                <View style={s.bookInfo}>
                  <Text style={[s.bookTitle, { color: colors.text }]}>{item.arabicName}</Text>
                  <Text style={[s.bookMeta, { color: colors.textSecondary }]}>{item.author} • ~{item.approxSizeMB} م.ب</Text>
                </View>
                <Ionicons name={isCached ? "checkmark-circle" : "ellipse-outline"} size={22} color={isCached ? colors.green : colors.textSecondary} />
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "CairoBold", fontSize: 20, textAlign: "center", flex: 1 },
  statsCard: { borderRadius: 16, padding: 14, marginBottom: 12 },
  statsRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  statsLabel: { fontFamily: "CairoBold", fontSize: 14 },
  statsSize: { fontFamily: "Cairo", fontSize: 12 },
  bar: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 12 },
  barFill: { height: 6, borderRadius: 3 },
  actionRow: { flexDirection: "row-reverse", gap: 10 },
  actionBtn: { flexDirection: "row-reverse", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5 },
  actionText: { fontFamily: "CairoBold", fontSize: 13 },
  bookCard: { borderRadius: 14, marginBottom: 8, borderWidth: 1.5 },
  bookRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  bookInfo: { flex: 1, alignItems: "flex-end", gap: 2 },
  bookTitle: { fontFamily: "CairoBold", fontSize: 15 },
  bookMeta: { fontFamily: "Cairo", fontSize: 12 },
  dlWrap: { alignItems: "center", gap: 2 },
  dlPct: { fontFamily: "Cairo", fontSize: 10 },
});
