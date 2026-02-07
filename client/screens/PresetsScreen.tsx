import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import hadithList from "@/constants/hadith.json";
import { typography } from "@/theme/typography";
import DrawerMenuButton from "@/components/navigation/DrawerMenuButton";

const AR_TITLE: Record<string, string> = {
  "Allahu Akbar": "تكبير",
  SubhanAllah: "تسبيح",
  Alhamdulillah: "تحميد",
  "La ilaha illa Allah": "تهليل",
  Astaghfirullah: "استغفار",
};

const AR_TEXT: Record<string, string> = {
  "Allahu Akbar": "الله أكبر",
  SubhanAllah: "سبحان الله",
  Alhamdulillah: "الحمد لله",
  "La ilaha illa Allah": "لا إله إلا الله",
  Astaghfirullah: "أستغفر الله",
};

function getArabicTitle(name: string) {
  return AR_TITLE[name] ?? name;
}

function getArabicText(name: string) {
  return AR_TEXT[name] ?? "";
}

type HadithItem = { text: string; by?: string };

export default function PresetsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const { presets, setCurrentPreset } = useApp();
  const { colors, isDarkMode } = useTheme();
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === "web";
  const contentWidth = isWeb ? Math.min(width, 460) : width;
  const headerGradientColors = colors.headerGradient as [string, string, ...string[]];

  const pageBackground = colors.background;
  const sheetBackground = isDarkMode ? "#1F242C" : "#F3F5F8";
  const rowBackground = isDarkMode ? "#252A31" : "#EEF1F5";
  const leftCircleBackground = isDarkMode ? "#323A45" : "#E6EAF0";
  const primaryText = isDarkMode ? "#FFFFFF" : "#111418";
  const secondaryText = isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(17,20,24,0.45)";
  const quoteCardBackground = isDarkMode ? "#C79B3B" : "#F1C56B";

  const data = useMemo(() => presets, [presets]);
  const [quote, setQuote] = useState<HadithItem | null>(null);
  const headerPadTop = useMemo(() => insets.top + 12, [insets.top]);

  // ✅ Pick a random hadith each time you VISIT this screen
  useFocusEffect(
    useCallback(() => {
      if (!Array.isArray(hadithList) || hadithList.length === 0) {
        setQuote(null);
        return;
      }
      const random = hadithList[Math.floor(Math.random() * hadithList.length)];
      setQuote(random);
    }, [])
  );

  const onPick = (id: string) => {
    setCurrentPreset(id);
    navigation.navigate("Counter");
  };

  const onAdd = () => {
    navigation.navigate("AddZikr");
  };

  const renderItem = ({ item }: any) => {
    const title = item.arabicName ?? getArabicTitle(item.name);
    const sub = item.text ?? getArabicText(item.name);

    return (
      <Pressable
        onPress={() => onPick(item.id)}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: rowBackground },
          pressed ? { opacity: 0.85, transform: [{ scale: 0.995 }] } : null,
        ]}
      >
        <View style={[styles.leftCircle, { backgroundColor: leftCircleBackground }]}>
          <Text style={[styles.leftCircleText, { color: primaryText }]}>{item.target}</Text>
        </View>

        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: primaryText }]} numberOfLines={1}>
            {title}
          </Text>
          {sub ? (
            <Text style={[styles.rowSub, { color: secondaryText }]} numberOfLines={1}>
              {sub}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  const ListHeader = () => (
    <View style={[styles.sheet, { width: contentWidth, backgroundColor: sheetBackground }]}>
      <View style={[styles.quoteCard, { backgroundColor: quoteCardBackground }]}>
        <Text style={styles.quoteMarks}>”</Text>

        {quote ? (
          <>
            <Text style={styles.quoteText} numberOfLines={3}>
              {quote.text}
            </Text>
            {!!quote.by && (
              <Text style={styles.quoteBy} numberOfLines={1}>
                {quote.by}
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.quoteText} numberOfLines={2}>
              {`اذكروا الله كثيراً`}
            </Text>
            <Text style={styles.quoteBy} numberOfLines={1}>
              {`—`}
            </Text>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: pageBackground }]}>
      <LinearGradient
        colors={headerGradientColors}
        style={[styles.header, { paddingTop: headerPadTop }]}
      >
        <View style={[styles.headerRow, { width: contentWidth }]}>
          <Pressable style={styles.headerBtn} onPress={onAdd} hitSlop={12}>
            <Feather name="plus" size={26} color="white" />
          </Pressable>

          <View style={styles.menuButton}>
            <DrawerMenuButton />
          </View>
          <Text style={styles.headerTitle} pointerEvents="none">ذكر</Text>
        </View>
      </LinearGradient>

      <FlatList
        style={{ width: contentWidth }}
        data={data}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        scrollIndicatorInsets={{ bottom: tabBarHeight }}
      />
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
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    position: "relative",
  },
  headerTitle: {
    ...typography.screenTitle,
    color: "white",
    fontSize: 40,
    fontWeight: "900",
    textAlign: "center",
    position: "absolute",
    left: 0,
    right: 0,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null),
  },
  menuButton: {
    position: "absolute",
    right: 6,
    top: 2,
    zIndex: 3,
  },

  sheet: {
    paddingTop: 14,
  },

  quoteCard: {
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 14,
    marginBottom: 14,
  },
  quoteMarks: {
    ...typography.itemTitle,
    color: "rgba(255,255,255,0.9)",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "right",
    marginBottom: 4,
  },
  quoteText: {
    ...typography.itemTitle,
    color: "white",
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  quoteBy: {
    ...typography.itemSubtitle,
    marginTop: 10,
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "left",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginHorizontal: 14,
    marginBottom: 12,
  },
  leftCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  leftCircleText: {
    ...typography.numberText,
    fontSize: 16,
    fontWeight: "900",
  },
  rowText: { flex: 1 },
  rowTitle: {
    ...typography.itemTitle,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "right",
  },
  rowSub: {
    ...typography.itemSubtitle,
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
});
