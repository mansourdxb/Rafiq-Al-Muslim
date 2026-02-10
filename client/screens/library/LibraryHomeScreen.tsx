import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useTheme } from "@/context/ThemeContext";
import { typography } from "@/theme/typography";
import type { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";
import DrawerMenuButton from "@/components/navigation/DrawerMenuButton";

export default function LibraryHomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>();

  const contentWidth = Math.min(width, 430);
  const sheetBackground = isDarkMode ? "#0D0F12" : "#F3F5F8";
  const cardOuterBackground = isDarkMode ? "#000000" : "#E7EDF4";
  const cardInnerBackground = isDarkMode ? "#2F2F30" : "#FFFFFF";
  const primaryText = isDarkMode ? "#FFFFFF" : "#111418";
  const secondaryText = isDarkMode ? "rgba(255,255,255,0.65)" : "rgba(17,20,24,0.55)";
  const headerGradientColors = colors.headerGradient as [string, string, ...string[]];

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
          <Text style={[styles.headerTitle, typography.screenTitle]}>{"\u0627\u0644\u0645\u0643\u062a\u0628\u0629"}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ width: contentWidth }}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.sheet, { backgroundColor: sheetBackground }]}>
          <Pressable
            onPress={() => navigation.navigate("QuranSurahList")}
            style={({ pressed }) => [
              styles.cardOuter,
              { backgroundColor: cardOuterBackground },
              pressed ? { opacity: 0.9 } : null,
            ]}
          >
            <View style={[styles.cardInner, { backgroundColor: cardInnerBackground }]}>
              <Text style={[styles.cardTitle, { color: primaryText }]}>{"\u0627\u0644\u0642\u0631\u0622\u0646"}</Text>
              <Text style={[styles.cardSub, { color: secondaryText }]}>
                {"\u062a\u0635\u0641\u062d \u0641\u0647\u0631\u0633 \u0627\u0644\u0633\u0648\u0631 \u0648\u0627\u0641\u062a\u062d \u0627\u0644\u0645\u0635\u062d\u0641"}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("LibraryHadith")}
            style={({ pressed }) => [
              styles.cardOuter,
              { backgroundColor: cardOuterBackground, marginTop: 12 },
              pressed ? { opacity: 0.9 } : null,
            ]}
          >
            <View style={[styles.cardInner, { backgroundColor: cardInnerBackground }]}>
              <Text style={[styles.cardTitle, { color: primaryText }]}>{"\u0627\u0644\u062d\u062f\u064a\u062b"}</Text>
              <Text style={[styles.cardSub, { color: secondaryText }]}>
                {"\u0643\u062a\u0628 \u0627\u0644\u062d\u062f\u064a\u062b \u0627\u0644\u062a\u0633\u0639\u0629 \u0648\u0627\u0644\u0643\u062a\u0628 \u0627\u0644\u0645\u062d\u0644\u064a\u0629"}
              </Text>
            </View>
          </Pressable>
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
  },
  cardInner: {
    borderRadius: 22,
    padding: 18,
  },
  cardTitle: {
    ...typography.sectionTitle,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "right",
  },
  cardSub: {
    ...typography.itemSubtitle,
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
});
