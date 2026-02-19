import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  HADITH_BOOKS,
  isBookCached,
  downloadBook,
  deleteBook,
  type BookKey,
  type BookInfo,
  type DownloadProgress,
} from "@/utils/hadithBookCache";

const HEADER_BG = "#1B4332";
const PAGE_BG = "#F3EEE4";
const CARD_BG = "#FFFFFF";
const PRIMARY = "#1C1714";
const SECONDARY = "#968C80";
const GREEN = "#2D7A4E";
const GOLD = "#D4AF37";
const GOLD_BG = "#F6F0E1";

const BOOK_SCREEN: Record<BookKey, string> = {
  bukhari: "BukhariBooks",
  muslim: "MuslimBooks",
  abudawud: "AbuDawudBooks",
  tirmidhi: "TirmidhiBooks",
  ibnmajah: "IbnMajahBooks",
  nasai: "NasaiBooks",
  malik: "MalikBooks",
  darimi: "DarimiBooks",
  ahmed: "AhmedBooks",
};

export default function LibraryHadithScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const topInset = Math.max(insets.top, Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0);

  const [cachedKeys, setCachedKeys] = useState<Set<BookKey>>(new Set());
  const [downloading, setDownloading] = useState<BookKey | null>(null);
  const [progress, setProgress] = useState(0);
  const [cacheSize, setCacheSize] = useState(0);

  useFocusEffect(
    useCallback(() => {
      refreshCacheStatus();
    }, [])
  );

  const refreshCacheStatus = async () => {
    const cached = new Set<BookKey>();
    let size = 0;
    for (const book of HADITH_BOOKS) {
      if (await isBookCached(book.key)) {
        cached.add(book.key);
        size += book.approxSizeMB;
      }
    }
    setCachedKeys(cached);
    setCacheSize(size);
  };

  const handleDownload = async (book: BookInfo) => {
    if (downloading) return;
    setDownloading(book.key);
    setProgress(0);
    try {
      await downloadBook(book.key, (p: DownloadProgress) => setProgress(p.percent));
      setCachedKeys((prev) => new Set([...prev, book.key]));
      setCacheSize((prev) => prev + book.approxSizeMB);
      // Auto-navigate after download
      const screenName = BOOK_SCREEN[book.key];
      if (screenName) navigation.navigate(screenName);
    } catch {
      Alert.alert("خطأ في التحميل", "تأكد من اتصالك بالإنترنت وحاول مرة أخرى");
    } finally {
      setDownloading(null);
      setProgress(0);
    }
  };

  const handleDelete = (book: BookInfo) => {
    Alert.alert("حذف الكتاب", `هل تريد حذف ${book.arabicName} من الجهاز؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          await deleteBook(book.key);
          setCachedKeys((prev) => { const n = new Set(prev); n.delete(book.key); return n; });
          setCacheSize((prev) => Math.max(0, prev - book.approxSizeMB));
        },
      },
    ]);
  };

  const openBook = (book: BookInfo) => {
    if (!cachedKeys.has(book.key)) {
      handleDownload(book);
      return;
    }
    const screenName = BOOK_SCREEN[book.key];
    if (screenName) navigation.navigate(screenName);
  };

  const renderBook = ({ item }: { item: BookInfo }) => {
    const isCached = cachedKeys.has(item.key);
    const isDownloading = downloading === item.key;

    return (
      <Pressable
        style={[s.bookCard, isCached && s.bookCardCached]}
        onPress={() => openBook(item)}
        onLongPress={() => isCached && handleDelete(item)}
      >
        <View style={[s.bookIcon, isCached ? s.bookIconCached : s.bookIconDefault]}>
          <Ionicons name="book" size={26} color={isCached ? GREEN : SECONDARY} />
        </View>
        <View style={s.bookInfo}>
          <Text style={s.bookTitle}>{item.arabicName}</Text>
          <Text style={s.bookAuthor}>{item.author}</Text>
          <Text style={s.bookSize}>~{item.approxSizeMB} م.ب</Text>
        </View>
        <View style={s.bookAction}>
          {isDownloading ? (
            <View style={s.downloadingWrap}>
              <ActivityIndicator size="small" color={GREEN} />
              <Text style={s.progressText}>{progress}%</Text>
            </View>
          ) : isCached ? (
            <Ionicons name="checkmark-circle" size={24} color={GREEN} />
          ) : (
            <View style={s.downloadBtn}>
              <Ionicons name="cloud-download-outline" size={22} color={GOLD} />
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const ListHeader = () => (
    <View style={s.listHeader}>
      <View style={s.cacheInfo}>
        <View style={s.cacheRow}>
          <Text style={s.cacheLabel}>{cachedKeys.size} من {HADITH_BOOKS.length} كتب محملة</Text>
          <Text style={s.cacheSizeText}>{cacheSize.toFixed(1)} م.ب</Text>
        </View>
        <View style={s.cacheBar}>
          <View style={[s.cacheBarFill, { width: `${(cachedKeys.size / HADITH_BOOKS.length) * 100}%` }]} />
        </View>
      </View>
      {cachedKeys.size < HADITH_BOOKS.length && (
        <View style={s.hintRow}>
          <Ionicons name="information-circle-outline" size={16} color={SECONDARY} />
          <Text style={s.hintText}>اضغط لتحميل الكتاب • اضغط مطولاً لحذفه</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <View style={s.headerRow}>
          <View style={s.headerSide}>
            <Pressable onPress={() => navigation.navigate("HadithSearch")} hitSlop={12}>
              <Ionicons name="search-outline" size={22} color={GOLD} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate("Favorites")} hitSlop={12}>
              <Ionicons name="bookmark-outline" size={22} color={GOLD} />
            </Pressable>
          </View>
          <Text style={s.headerTitle}>كتب الحديث التسعة</Text>
          {navigation.canGoBack() ? (
            <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>
      </View>

      <FlatList
        data={HADITH_BOOKS}
        keyExtractor={(item) => item.key}
        renderItem={renderBook}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },
  header: { backgroundColor: HEADER_BG, paddingBottom: 16, paddingHorizontal: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerSide: { flexDirection: "row", gap: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "CairoBold", fontSize: 20, color: "#FFF", textAlign: "center", flex: 1, marginHorizontal: 4 },
  list: { paddingHorizontal: 14, paddingTop: 14 },
  listHeader: { marginBottom: 8 },
  cacheInfo: { backgroundColor: CARD_BG, borderRadius: 16, padding: 14, marginBottom: 8 },
  cacheRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cacheLabel: { fontFamily: "CairoBold", fontSize: 14, color: PRIMARY },
  cacheSizeText: { fontFamily: "Cairo", fontSize: 12, color: SECONDARY },
  cacheBar: { height: 6, borderRadius: 3, backgroundColor: "#E8E3D9", overflow: "hidden" },
  cacheBarFill: { height: 6, borderRadius: 3, backgroundColor: GREEN },
  hintRow: { flexDirection: "row-reverse", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 4 },
  hintText: { fontFamily: "Cairo", fontSize: 12, color: SECONDARY, flex: 1, textAlign: "right" },
  bookCard: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: CARD_BG, borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: "transparent" },
  bookCardCached: { borderColor: "#D9F0E3" },
  bookIcon: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bookIconDefault: { backgroundColor: "#F0EBE0" },
  bookIconCached: { backgroundColor: "#E8F5E9" },
  bookInfo: { flex: 1, marginRight: 12, alignItems: "flex-end" },
  bookTitle: { fontFamily: "CairoBold", fontSize: 16, color: PRIMARY },
  bookAuthor: { fontFamily: "Cairo", fontSize: 12, color: SECONDARY, marginTop: 1 },
  bookSize: { fontFamily: "Cairo", fontSize: 11, color: "#B8AE9F", marginTop: 2 },
  bookAction: { marginRight: 12 },
  downloadBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: GOLD_BG, alignItems: "center", justifyContent: "center" },
  downloadingWrap: { alignItems: "center", gap: 2 },
  progressText: { fontFamily: "Cairo", fontSize: 10, color: GREEN },
});
