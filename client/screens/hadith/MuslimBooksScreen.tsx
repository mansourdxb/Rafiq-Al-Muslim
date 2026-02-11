import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useTheme } from "@/context/ThemeContext";
import { typography } from "@/theme/typography";
import indexData from "@/data/the_9_books/muslim/index.json";
import type { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";

type MuslimBook = {
  id: number;
  en: string;
  ar: string;
};

type MuslimData = {
  collectionId: string;
  titleAr: string;
  titleEn: string;
  books: MuslimBook[];
};

export default function MuslimBooksScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();
  const isArabic = true;

  const [query, setQuery] = useState("");

  const maxW = 430;
  const contentWidth = Math.min(width, maxW);

  const books = (indexData as MuslimData).books ?? [];

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (item) => item.en.toLowerCase().includes(q) || item.ar.includes(query)
    );
  }, [books, query]);

  const headerGradientColors = colors.headerGradient as [string, string, ...string[]];
  const pageBackground = colors.background;
  const sheetBackground = isDarkMode ? "#0D0F12" : "#F3F5F8";
  const cardOuterBackground = isDarkMode ? "#000000" : "#E7EDF4";
  const cardInnerBackground = isDarkMode ? "#2F2F30" : "#FFFFFF";
  const primaryText = isDarkMode ? "#FFFFFF" : "#111418";
  const secondaryText = isDarkMode ? "rgba(255,255,255,0.55)" : "rgba(17,20,24,0.45)";
  const separatorColor = isDarkMode ? "rgba(255,255,255,0.08)" : "#E4E8EE";

  const title = (indexData as MuslimData).titleAr;
  const placeholder = "\u0627\u0628\u062d\u062b";

  return (
    <View style={[styles.root, { backgroundColor: pageBackground }]}>
      <LinearGradient
        colors={headerGradientColors}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={[styles.headerInner, { width: contentWidth }]}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ width: contentWidth }}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.sheet, { backgroundColor: sheetBackground }]}>
          <View style={[styles.searchOuter, { backgroundColor: cardOuterBackground }]}>
            <View style={[styles.searchInner, { backgroundColor: cardInnerBackground }]}>
              <Feather name="search" size={18} color={secondaryText} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={placeholder}
                placeholderTextColor={secondaryText}
                style={[
                  styles.searchInput,
                  {
                    color: primaryText,
                    textAlign: isArabic ? "right" : "left",
                    writingDirection: isArabic ? "rtl" : "ltr",
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.list}>
            {filteredBooks.map((item, index) => {
              const label = item.ar;
              const rowText = `${String(item.id)} - ${label}`;
              return (
                <View key={item.id}>
                  <Pressable
                    onPress={() =>
                      navigation.navigate("MuslimChapter", { chapterId: item.id })
                    }
                    style={[
                      styles.rowOuter,
                      { backgroundColor: cardOuterBackground },
                    ]}
                  >
                    <View
                      style={[
                        styles.rowInner,
                        { backgroundColor: cardInnerBackground },
                      ]}
                    >
                      <Feather name="chevron-left" size={20} color={secondaryText} />
                      <Text
                        style={[
                          styles.rowText,
                          {
                            color: primaryText,
                            textAlign: "right",
                            writingDirection: "rtl",
                          },
                        ]}
                      >
                        {rowText}
                      </Text>
                    </View>
                  </Pressable>
                  {index < filteredBooks.length - 1 ? (
                    <View style={[styles.separator, { backgroundColor: separatorColor }]} />
                  ) : null}
                </View>
              );
            })}
          </View>
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
  },
  headerTitle: {
    ...typography.screenTitle,
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 16,
    paddingHorizontal: 14,
  },
  searchOuter: {
    borderRadius: 22,
    padding: 8,
    marginBottom: 12,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 10px 24px rgba(0,0,0,0.10)" } as any)
      : null),
  },
  searchInner: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    ...typography.inputText,
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  list: {
    paddingBottom: 10,
  },
  rowOuter: {
    borderRadius: 20,
    padding: 8,
    marginBottom: 8,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 8px 18px rgba(0,0,0,0.08)" } as any)
      : null),
  },
  rowInner: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowText: {
    ...typography.itemTitle,
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
    marginBottom: 8,
  },
});
