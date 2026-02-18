import React from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HadithStackParamList } from "@/navigation/HadithStackNavigator";

const HEADER_BG = "#1B4332";
const PAGE_BG = "#F3EEE4";
const CARD_BG = "#FFFFFF";
const PRIMARY = "#1C1714";
const SECONDARY = "#7C8A82";
const GREEN = "#2D7A4E";

const hadithBooks: { id: string; route: keyof HadithStackParamList; title_ar: string; subtitle_ar: string }[] = [
  { id: "muslim", route: "MuslimBooks", title_ar: "\u0635\u062d\u064a\u062d \u0645\u0633\u0644\u0645", subtitle_ar: "\u0645\u0633\u0644\u0645 \u0628\u0646 \u0627\u0644\u062d\u062c\u0627\u062c \u0627\u0644\u0646\u064a\u0633\u0627\u0628\u0648\u0631\u064a" },
  { id: "bukhari", route: "BukhariBooks", title_ar: "\u0635\u062d\u064a\u062d \u0627\u0644\u0628\u062e\u0627\u0631\u064a", subtitle_ar: "\u0645\u062d\u0645\u062f \u0628\u0646 \u0625\u0633\u0645\u0627\u0639\u064a\u0644 \u0627\u0644\u0628\u062e\u0627\u0631\u064a" },
  { id: "tirmidhi", route: "TirmidhiBooks", title_ar: "\u062c\u0627\u0645\u0639 \u0627\u0644\u062a\u0631\u0645\u0630\u064a", subtitle_ar: "\u0623\u0628\u0648 \u0639\u064a\u0633\u0649 \u0627\u0644\u062a\u0631\u0645\u0630\u064a" },
  { id: "abudawud", route: "AbuDawudBooks", title_ar: "\u0633\u0646\u0646 \u0623\u0628\u064a \u062f\u0627\u0648\u062f", subtitle_ar: "\u0623\u0628\u0648 \u062f\u0627\u0648\u062f \u0627\u0644\u0633\u062c\u0633\u062a\u0627\u0646\u064a" },
  { id: "ibnmajah", route: "IbnMajahBooks", title_ar: "\u0633\u0646\u0646 \u0627\u0628\u0646 \u0645\u0627\u062c\u0647", subtitle_ar: "\u0645\u062d\u0645\u062f \u0628\u0646 \u064a\u0632\u064a\u062f \u0628\u0646 \u0645\u0627\u062c\u0647" },
  { id: "nasai", route: "NasaiBooks", title_ar: "\u0633\u0646\u0646 \u0627\u0644\u0646\u0633\u0627\u0626\u064a", subtitle_ar: "\u0623\u062d\u0645\u062f \u0628\u0646 \u0634\u0639\u064a\u0628 \u0627\u0644\u0646\u0633\u0627\u0626\u064a" },
  { id: "ahmad", route: "AhmedBooks", title_ar: "\u0645\u0633\u0646\u062f \u0627\u0644\u0625\u0645\u0627\u0645 \u0623\u062d\u0645\u062f \u0628\u0646 \u062d\u0646\u0628\u0644", subtitle_ar: "\u0623\u062d\u0645\u062f \u0628\u0646 \u062d\u0646\u0628\u0644" },
  { id: "malik", route: "MalikBooks", title_ar: "\u0645\u0648\u0637\u0623 \u0627\u0644\u0625\u0645\u0627\u0645 \u0645\u0627\u0644\u0643", subtitle_ar: "\u0645\u0627\u0644\u0643 \u0628\u0646 \u0623\u0646\u0633" },
  { id: "darimi", route: "DarimiBooks", title_ar: "\u0633\u0646\u0646 \u0627\u0644\u062f\u0627\u0631\u0645\u064a", subtitle_ar: "\u0639\u0628\u062f \u0627\u0644\u0644\u0647 \u0628\u0646 \u0639\u0628\u062f \u0627\u0644\u0631\u062d\u0645\u0646 \u0627\u0644\u062f\u0627\u0631\u0645\u064a" },
];

export default function LibraryHadithScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<HadithStackParamList>>();
  const contentWidth = Math.min(width, 430);
  const cardWidth = (contentWidth - 28 - 12) / 2;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>{"\u0627\u0644\u062d\u062f\u064a\u062b"}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24, paddingHorizontal: 14, width: contentWidth, alignSelf: "center" }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBtns}>
            <Pressable onPress={() => navigation.navigate("Favorites")} style={styles.favBtn} hitSlop={10}>
              <Ionicons name="bookmark" size={18} color="#FFF" />
            </Pressable>
            <Pressable onPress={() => navigation.navigate("HadithSearch" as any)} style={styles.searchBtn} hitSlop={10}>
              <Ionicons name="search" size={18} color="#FFF" />
            </Pressable>
          </View>
          <Text style={styles.sectionTitle}>{"\u0643\u062a\u0628 \u0627\u0644\u062d\u062f\u064a\u062b \u0627\u0644\u062a\u0633\u0639\u0629"}</Text>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {hadithBooks.map((book) => (
            <Pressable
              key={book.id}
              style={[styles.card, { width: cardWidth }]}
              onPress={() => navigation.navigate(book.route as any)}
            >
              <Text style={styles.cardTitle}>{book.title_ar}</Text>
              <Text style={styles.cardSub}>{book.subtitle_ar}</Text>
            </Pressable>
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
    paddingBottom: 20,
    alignItems: "center",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerTitle: {
    fontFamily: "CairoBold",
    fontSize: 24,
    color: "#FFF",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: "CairoBold",
    fontSize: 20,
    color: PRIMARY,
    textAlign: "right",
  },
  sectionBtns: {
    flexDirection: "row",
    gap: 10,
  },
  favBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  cardTitle: {
    fontFamily: "CairoBold",
    fontSize: 17,
    color: PRIMARY,
    textAlign: "center",
    lineHeight: 28,
  },
  cardSub: {
    fontFamily: "Cairo",
    fontSize: 13,
    color: SECONDARY,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 20,
  },
});
