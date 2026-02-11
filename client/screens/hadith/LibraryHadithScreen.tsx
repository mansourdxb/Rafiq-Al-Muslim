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
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { typography } from "@/theme/typography";
import type { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";

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
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();

  const contentWidth = Math.min(width, 430);
  const sheetBackground = "#F5F4F1";
  const cardOuterBackground = "#FFFFFF";
  const cardInnerBackground = "#FFFFFF";
  const primaryText = "#1F2D25";
  const secondaryText = "#7C8A82";

  return (
    <View style={[styles.root, { backgroundColor: "#F5F4F1" }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={[styles.headerInner, { width: contentWidth }]}>
          <Text style={[styles.headerTitle, typography.screenTitle]}>
            {"\u0627\u0644\u062d\u062f\u064a\u062b"}
          </Text>
        </View>
      </View>

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
    paddingBottom: 18,
    alignItems: "center",
    backgroundColor: "#1B4332",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  headerInner: {
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    textAlign: "center",
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 18,
    paddingHorizontal: 14,
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
    fontSize: 18,
    textAlign: "right",
    fontFamily: "CairoBold",
  },
  hadithSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 14,
  },
  favoritesButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2F6E52",
  },
  hadithCardOuter: {
    borderRadius: 18,
    padding: 6,
    borderWidth: 1,
    borderColor: "#E6E0D6",
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 10px 24px rgba(0,0,0,0.10)" } as any)
      : null),
  },
  hadithCardInner: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  hadithCardTitle: {
    fontSize: 16,
    textAlign: "center",
  },
  hadithCardSub: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
  },
});
