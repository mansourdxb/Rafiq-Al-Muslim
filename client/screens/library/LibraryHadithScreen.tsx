import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useTheme } from "@/context/ThemeContext";
import { typography } from "@/theme/typography";
import type { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";
import DrawerMenuButton from "@/components/navigation/DrawerMenuButton";

import riyad from "@/constants/library/Riyad_Salheen.json";
import bulugh from "@/constants/library/bulugh_almaram.json";
import adab from "@/constants/library/aladab_almufrad.json";
import qudsi from "@/constants/library/qudsi40.json";

function Card({
  children,
  outerStyle,
  innerStyle,
}: {
  children: React.ReactNode;
  outerStyle?: any;
  innerStyle?: any;
}) {
  return (
    <View style={[styles.cardOuter, outerStyle]}>
      <View style={[styles.cardInner, innerStyle]}>{children}</View>
    </View>
  );
}

function getCount(data: any) {
  if (Array.isArray(data)) return data.length;
  if (!data || typeof data !== "object") return 0;
  if (Array.isArray((data as any).items)) return (data as any).items.length;
  if (Array.isArray((data as any).hadiths)) return (data as any).hadiths.length;
  if (Array.isArray((data as any).ahadith)) return (data as any).ahadith.length;
  if (Array.isArray((data as any).chapters)) return (data as any).chapters.length;
  return Object.keys(data).length;
}

const hadithBooks = [
  {
    id: "bukhari",
    title_ar: "\u0635\u062d\u064a\u062d \u0627\u0644\u0628\u062e\u0627\u0631\u064a",
    subtitle_ar: "\u0645\u062d\u0645\u062f \u0628\u0646 \u0625\u0633\u0645\u0627\u0639\u064a\u0644 \u0627\u0644\u0628\u062e\u0627\u0631\u064a",
  },
  {
    id: "muslim",
    title_ar: "\u0635\u062d\u064a\u062d \u0645\u0633\u0644\u0645",
    subtitle_ar: "\u0645\u0633\u0644\u0645 \u0628\u0646 \u0627\u0644\u062d\u062c\u0627\u062c \u0627\u0644\u0646\u064a\u0633\u0627\u0628\u0648\u0631\u064a",
  },
  {
    id: "abudawud",
    title_ar: "\u0633\u0646\u0646 \u0623\u0628\u064a \u062f\u0627\u0648\u062f",
    subtitle_ar: "\u0623\u0628\u0648 \u062f\u0627\u0648\u062f \u0627\u0644\u0633\u062c\u0633\u062a\u0627\u0646\u064a",
  },
  {
    id: "tirmidhi",
    title_ar: "\u062c\u0627\u0645\u0639 \u0627\u0644\u062a\u0631\u0645\u0630\u064a",
    subtitle_ar: "\u0623\u0628\u0648 \u0639\u064a\u0633\u0649 \u0627\u0644\u062a\u0631\u0645\u0630\u064a",
  },
  {
    id: "nasai",
    title_ar: "\u0633\u0646\u0646 \u0627\u0644\u0646\u0633\u0627\u0626\u064a",
    subtitle_ar: "\u0623\u062d\u0645\u062f \u0628\u0646 \u0634\u0639\u064a\u0628 \u0627\u0644\u0646\u0633\u0627\u0626\u064a",
  },
  {
    id: "ibnmajah",
    title_ar: "\u0633\u0646\u0646 \u0627\u0628\u0646 \u0645\u0627\u062c\u0647",
    subtitle_ar: "\u0645\u062d\u0645\u062f \u0628\u0646 \u064a\u0632\u064a\u062f \u0628\u0646 \u0645\u0627\u062c\u0647",
  },
  {
    id: "malik",
    title_ar: "\u0645\u0648\u0637\u0623 \u0627\u0644\u0625\u0645\u0627\u0645 \u0645\u0627\u0644\u0643",
    subtitle_ar: "\u0645\u0627\u0644\u0643 \u0628\u0646 \u0623\u0646\u0633",
  },
  {
    id: "ahmad",
    title_ar: "\u0645\u0633\u0646\u062f \u0627\u0644\u0625\u0645\u0627\u0645 \u0623\u062d\u0645\u062f \u0628\u0646 \u062d\u0646\u0628\u0644",
    subtitle_ar: "\u0623\u062d\u0645\u062f \u0628\u0646 \u062d\u0646\u0628\u0644",
  },
  {
    id: "darimi",
    title_ar: "\u0633\u0646\u0646 \u0627\u0644\u062f\u0627\u0631\u0645\u064a",
    subtitle_ar: "\u0639\u0628\u062f \u0627\u0644\u0644\u0647 \u0628\u0646 \u0639\u0628\u062f \u0627\u0644\u0631\u062d\u0645\u0646 \u0627\u0644\u062f\u0627\u0631\u0645\u064a",
  },
];

export default function LibraryHadithScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();

  const books = useMemo(
    () => [
      { key: "riyad" as const, label: "\u0631\u064a\u0627\u0636 \u0627\u0644\u0635\u0627\u0644\u062d\u064a\u0646", data: riyad },
      { key: "bulugh" as const, label: "\u0628\u0644\u0648\u063a \u0627\u0644\u0645\u0631\u0627\u0645", data: bulugh },
      { key: "adab" as const, label: "\u0627\u0644\u0623\u062f\u0628 \u0627\u0644\u0645\u0641\u0631\u062f", data: adab },
      { key: "qudsi" as const, label: "\u0627\u0644\u0623\u062d\u0627\u062f\u064a\u062b \u0627\u0644\u0642\u062f\u0633\u064a\u0629", data: qudsi },
    ],
    []
  );

  const contentWidth = Math.min(width, 430);
  const headerGradientColors = colors.headerGradient as [string, string, ...string[]];
  const sheetBackground = isDarkMode ? "#0D0F12" : "#F3F5F8";
  const cardOuterBackground = isDarkMode ? "#000000" : "#E7EDF4";
  const cardInnerBackground = isDarkMode ? "#2F2F30" : "#FFFFFF";
  const primaryText = isDarkMode ? "#FFFFFF" : "#111418";
  const secondaryText = isDarkMode ? "rgba(255,255,255,0.65)" : "rgba(17,20,24,0.55)";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={headerGradientColors}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={[styles.headerInner, { width: contentWidth }]}>
          <View style={styles.menuButton}>
            <DrawerMenuButton />
          </View>
          <Text style={[styles.headerTitle, typography.screenTitle]}>
            {"\u0627\u0644\u062d\u062f\u064a\u062b"}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ width: contentWidth }}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.sheet, { backgroundColor: sheetBackground }]}>
          <View style={styles.hadithSectionHeader}>
            <Pressable
              onPress={() => navigation.navigate("Favorites")}
              style={styles.favoritesButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="bookmark" size={18} color="#FFFFFF" />
            </Pressable>
            <Text
              style={[
                styles.hadithSectionTitle,
                { color: primaryText },
                typography.sectionTitle,
              ]}
            >
              {"\u0643\u062a\u0628 \u0627\u0644\u062d\u062f\u064a\u062b \u0627\u0644\u062a\u0633\u0639\u0629"}
            </Text>
          </View>
          <FlatList
            data={hadithBooks}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.hadithGridRow}
            contentContainerStyle={styles.hadithList}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  if (item.id === "bukhari") navigation.navigate("BukhariBooks");
                  else if (item.id === "muslim") navigation.navigate("MuslimBooks");
                  else if (item.id === "abudawud") navigation.navigate("AbuDawudBooks");
                  else if (item.id === "tirmidhi") navigation.navigate("TirmidhiBooks");
                  else if (item.id === "nasai") navigation.navigate("NasaiBooks");
                  else if (item.id === "ibnmajah") navigation.navigate("IbnMajahBooks");
                  else if (item.id === "malik") navigation.navigate("MalikBooks");
                  else if (item.id === "ahmad") navigation.navigate("AhmedBooks");
                  else if (item.id === "darimi") navigation.navigate("DarimiBooks");
                }}
                style={[
                  styles.hadithCardOuter,
                  styles.hadithCardOuterGrid,
                  { backgroundColor: cardOuterBackground },
                ]}
              >
                <View style={[styles.hadithCardInner, { backgroundColor: cardInnerBackground }]}>
                  <Text style={[styles.hadithCardTitle, { color: primaryText }, typography.itemTitle]}>
                    {item.title_ar}
                  </Text>
                  <Text
                    style={[styles.hadithCardSub, { color: secondaryText }, typography.itemSubtitle]}
                  >
                    {item.subtitle_ar}
                  </Text>
                </View>
              </Pressable>
            )}
          />

          <Card
            outerStyle={{ backgroundColor: cardOuterBackground, marginTop: 12 }}
            innerStyle={{ backgroundColor: cardInnerBackground }}
          >
            <Text style={[styles.cardTitle, { color: primaryText }, typography.sectionTitle]}>
              {"\u0643\u062a\u0628 \u0627\u0644\u062d\u062f\u064a\u062b \u0627\u0644\u0645\u062d\u0644\u064a\u0629"}
            </Text>
            <Text style={[styles.cardSub, { color: secondaryText }, typography.itemSubtitle]}>
              {"\u0631\u064a\u0627\u0636 \u0627\u0644\u0635\u0627\u0644\u062d\u064a\u0646\u060c \u0628\u0644\u0648\u063a \u0627\u0644\u0645\u0631\u0627\u0645\u060c \u0627\u0644\u0623\u062f\u0628 \u0627\u0644\u0645\u0641\u0631\u062f\u060c \u0627\u0644\u0623\u062d\u0627\u062f\u064a\u062b \u0627\u0644\u0642\u062f\u0633\u064a\u0629"}
            </Text>
            <View style={styles.statRow}>
              <Text style={[styles.statValue, { color: primaryText }, typography.numberText]}>
                {books.reduce((acc, b) => acc + getCount(b.data), 0)}
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
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
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "900",
    textAlign: "center",
  },
  menuButton: {
    position: "absolute",
    right: 4,
    top: 2,
    zIndex: 5,
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 16,
    paddingHorizontal: 14,
  },
  cardOuter: {
    borderRadius: 28,
    padding: 10,
    ...(Platform.OS === "web" ? ({ boxShadow: "0 12px 30px rgba(0,0,0,0.12)" } as any) : null),
  },
  cardInner: {
    borderRadius: 22,
    padding: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "right",
  },
  cardSub: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  statRow: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
  },
  hadithList: {
    gap: 12,
  },
  hadithGridRow: {
    justifyContent: "space-between",
    gap: 12,
  },
  hadithCardOuterGrid: {
    flex: 1,
  },
  hadithSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "right",
    fontFamily: "CairoBold",
  },
  hadithSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  favoritesButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E8B5A",
  },
  hadithCardOuter: {
    borderRadius: 22,
    padding: 8,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 10px 24px rgba(0,0,0,0.10)" } as any)
      : null),
  },
  hadithCardInner: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  hadithCardTitle: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  hadithCardSub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
