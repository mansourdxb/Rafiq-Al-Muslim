import React from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { StackActions, useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useTheme } from "@/context/ThemeContext";
import { typography } from "@/theme/typography";
import type { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { quranFiles } from "@/lib/quran/quranFiles";
import { getPageForAyah } from "@/src/lib/quran/mushaf";
import DrawerMenuButton from "@/components/navigation/DrawerMenuButton";

export default function LibraryQuranScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<
    CompositeNavigationProp<
      NativeStackNavigationProp<LibraryStackParamList>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

  const contentWidth = Math.min(width, 430);
  const headerGradientColors = colors.headerGradient as [string, string, ...string[]];
  const sheetBackground = isDarkMode ? "#0D0F12" : "#F3F5F8";
  const primaryText = isDarkMode ? "#FFFFFF" : "#111418";
  const secondaryText = isDarkMode ? "rgba(255,255,255,0.65)" : "rgba(17,20,24,0.55)";

  const openSurah = (sura: number, aya = 1) => {
    const page = getPageForAyah(sura, aya);
    navigation.dispatch(
      StackActions.push("QuranReader", {
        sura,
        aya,
        page,
        source: "index",
        navToken: Date.now(),
      })
    );
  };

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
          <Text style={[styles.headerTitle, typography.screenTitle]}>{"\u0627\u0644\u0642\u0631\u0622\u0646"}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ width: contentWidth }}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.sheet, { backgroundColor: sheetBackground }]}>
          <FlatList
            data={quranFiles}
            keyExtractor={(item) => String(item.number)}
            contentContainerStyle={styles.quranList}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const data: any = item.data ?? {};
              const nameAr =
                data?.surah ??
                data?.chapter?.arabic ??
                data?.meta?.arabic ??
                data?.metadata?.arabic ??
                `\u0633\u0648\u0631\u0629 \u0631\u0642\u0645 ${item.number}`;
              const ayahs =
                data?.ayahs ?? data?.verses ?? data?.aya ?? data?.items ?? data?.data ?? [];
              const ayahCount = Array.isArray(ayahs) ? ayahs.length : 0;

              return (
                <Pressable
                  onPress={() => openSurah(item.number, 1)}
                  style={({ pressed }) => [styles.quranRow, pressed ? { opacity: 0.9 } : null]}
                >
                  <View style={styles.quranRowText}>
                    <Text style={[styles.quranName, { color: primaryText }]} numberOfLines={1}>
                      {nameAr}
                    </Text>
                    <Text
                      style={[styles.quranMeta, { color: secondaryText }]}
                      numberOfLines={1}
                    >
                      {`\u0639\u062f\u062f \u0627\u0644\u0622\u064a\u0627\u062a ${ayahCount}`}
                    </Text>
                  </View>
                  <View style={styles.quranBadge}>
                    <Text style={styles.quranBadgeText}>{item.number}</Text>
                  </View>
                </Pressable>
              );
            }}
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
  quranList: {
    paddingTop: 4,
    gap: 8,
  },
  quranRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  quranRowText: {
    flex: 1,
    alignItems: "flex-end",
  },
  quranName: {
    ...typography.itemTitle,
    fontSize: 18,
    textAlign: "right",
    writingDirection: "rtl",
  },
  quranMeta: {
    ...typography.itemSubtitle,
    fontSize: 13,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 4,
  },
  quranBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1E8B5A",
    alignItems: "center",
    justifyContent: "center",
  },
  quranBadgeText: {
    ...typography.numberText,
    color: "#FFFFFF",
    fontSize: 12,
  },
});
