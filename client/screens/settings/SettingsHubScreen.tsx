import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "@/context/ThemeContext";
import { typography } from "@/theme/typography";
import type { MainTabParamList } from "@/navigation/MainTabNavigator";

type HubItem = {
  label: string;
  onPress: () => void;
};

function SectionCard({
  title,
  items,
  cardBackground,
  titleColor,
  dividerColor,
  itemTextColor,
  iconColor,
}: {
  title: string;
  items: HubItem[];
  cardBackground: string;
  titleColor: string;
  dividerColor: string;
  itemTextColor: string;
  iconColor: string;
}) {
  return (
    <View style={[styles.card, { backgroundColor: cardBackground }]}>
      <Text style={[styles.cardTitle, { color: titleColor }]}>{title}</Text>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <View key={item.label}>
            <Pressable
              onPress={item.onPress}
              style={({ pressed }) => [styles.row, pressed ? { opacity: 0.92 } : null]}
            >
              <Text style={[styles.rowText, { color: itemTextColor }]}>{item.label}</Text>
              <Feather name="chevron-left" size={20} color={iconColor} />
            </Pressable>
            {isLast ? null : <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
          </View>
        );
      })}
    </View>
  );
}

export default function SettingsHubScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isDarkMode, colors } = useTheme();
  const navigation = useNavigation<any>();

  const maxW = 430;
  const contentWidth = Math.min(width, maxW);

  const headerGradientColors = colors.headerGradient as [string, string, ...string[]];
  const pageBackground = colors.background;
  const cardBackground = isDarkMode ? "#242628" : "#FFFFFF";
  const titleColor = isDarkMode ? "#FFFFFF" : "#111418";
  const dividerColor = isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(17,20,24,0.08)";
  const itemTextColor = isDarkMode ? "#FFFFFF" : "#111418";
  const iconColor = isDarkMode ? "rgba(255,255,255,0.65)" : "rgba(17,20,24,0.55)";

  const quranItems = useMemo<HubItem[]>(
    () => [
      {
        label: "\u0627\u0644\u062a\u0641\u0633\u064a\u0631",
        onPress: () => navigation.navigate("QuranTafsirSettings"),
      },
      {
        label: "\u0627\u0644\u0641\u0648\u0627\u0635\u0644",
        onPress: () => navigation.navigate("QuranFawaselSettings"),
      },
      {
        label: "\u0627\u0644\u062e\u062a\u0645\u0629",
        onPress: () => navigation.navigate("QuranKhatmaSettings"),
      },
      {
        label: "\u0627\u0644\u062a\u0645\u064a\u064a\u0632\u0627\u062a",
        onPress: () => navigation.navigate("QuranHighlightsSettings"),
      },
      {
        label: "\u0627\u0644\u062e\u0637\u0648\u0637 (\u0645\u0635\u062d\u0641)",
        onPress: () => navigation.navigate("QuranMushafFontSettings"),
      },
    ],
    [navigation]
  );

  const zikrItems = useMemo<HubItem[]>(
    () => [
      {
        label: "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0623\u0630\u0643\u0627\u0631",
        onPress: () =>
          navigation.navigate("MainTabs", {
            screen: "PresetsTab",
          } as { screen: keyof MainTabParamList }),
      },
      {
        label: "\u0627\u0644\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a",
        onPress: () =>
          navigation.navigate("MainTabs", {
            screen: "StatsTab",
          } as { screen: keyof MainTabParamList }),
      },
      {
        label: "\u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a",
        onPress: () => navigation.navigate("ZikrNotificationsSettings"),
      },
    ],
    [navigation]
  );

  const libraryItems = useMemo<HubItem[]>(
    () => [
      {
        label: "\u0627\u0644\u0645\u0641\u0636\u0644\u0629",
        onPress: () =>
          navigation.navigate("MainTabs", {
            screen: "LibraryTab",
            params: { screen: "Favorites" },
          } as any),
      },
      {
        label: "\u0627\u0644\u062a\u062d\u0645\u064a\u0644\u0627\u062a",
        onPress: () => navigation.navigate("LibraryDownloadsSettings"),
      },
    ],
    [navigation]
  );

  const generalItems = useMemo<HubItem[]>(
    () => [
      {
        label: "\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0639\u0627\u0645\u0629",
        onPress: () =>
          navigation.navigate("MainTabs", {
            screen: "SettingsTab",
            params: { screen: "Settings" },
          } as any),
      },
    ],
    [navigation]
  );

  return (
    <View style={[styles.root, { backgroundColor: pageBackground }]}>
      <LinearGradient
        colors={headerGradientColors}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={[styles.headerInner, { width: contentWidth }]}>
          <Text style={[styles.headerTitle, typography.screenTitle]}>
            {"\u0645\u0631\u0643\u0632 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a"}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { width: contentWidth, paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SectionCard
          title="\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0642\u0631\u0622\u0646"
          items={quranItems}
          cardBackground={cardBackground}
          titleColor={titleColor}
          dividerColor={dividerColor}
          itemTextColor={itemTextColor}
          iconColor={iconColor}
        />

        <SectionCard
          title="\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0630\u0643\u0631"
          items={zikrItems}
          cardBackground={cardBackground}
          titleColor={titleColor}
          dividerColor={dividerColor}
          itemTextColor={itemTextColor}
          iconColor={iconColor}
        />

        <SectionCard
          title="\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u0643\u062a\u0628\u0629"
          items={libraryItems}
          cardBackground={cardBackground}
          titleColor={titleColor}
          dividerColor={dividerColor}
          itemTextColor={itemTextColor}
          iconColor={iconColor}
        />

        <SectionCard
          title="\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0639\u0627\u0645\u0629"
          items={generalItems}
          cardBackground={cardBackground}
          titleColor={titleColor}
          dividerColor={dividerColor}
          itemTextColor={itemTextColor}
          iconColor={iconColor}
        />
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
    paddingHorizontal: 16,
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingTop: 14,
    gap: 14,
    alignSelf: "center",
  },
  card: {
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardTitle: {
    ...typography.sectionTitle,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  rowText: {
    ...typography.itemTitle,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "right",
    flex: 1,
  },
  divider: {
    height: 1,
  },
});
