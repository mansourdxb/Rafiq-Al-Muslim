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
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import hadithList from "@/constants/hadith.json";
import { typography } from "@/theme/typography";

const AR_TITLE: Record<string, string> = {
  "Allahu Akbar": "\u062A\u0643\u0628\u064A\u0631",
  SubhanAllah: "\u062A\u0633\u0628\u064A\u062D",
  Alhamdulillah: "\u062A\u062D\u0645\u064A\u062F",
  "La ilaha illa Allah": "\u062A\u0647\u0644\u064A\u0644",
  Astaghfirullah: "\u0627\u0633\u062A\u063A\u0641\u0627\u0631",
};

const AR_TEXT: Record<string, string> = {
  "Allahu Akbar": "\u0627\u0644\u0644\u0647 \u0623\u0643\u0628\u0631",
  SubhanAllah: "\u0633\u0628\u062D\u0627\u0646 \u0627\u0644\u0644\u0647",
  Alhamdulillah: "\u0627\u0644\u062D\u0645\u062F \u0644\u0644\u0647",
  "La ilaha illa Allah": "\u0644\u0627 \u0625\u0644\u0647 \u0625\u0644\u0627 \u0627\u0644\u0644\u0647",
  Astaghfirullah: "\u0623\u0633\u062A\u063A\u0641\u0631 \u0627\u0644\u0644\u0647",
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
  const { isDarkMode } = useTheme();
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === "web";
  const contentWidth = isWeb ? Math.min(width, 460) : width;

  const pageBackground = isDarkMode ? "#0F1215" : "#F7F4EE";
  const rowBackground = "#FFFFFF";
  const primaryText = isDarkMode ? "#FFFFFF" : "#1B1F22";
  const secondaryText = isDarkMode ? "rgba(255,255,255,0.6)" : "#5F6B6A";
  const quoteCardBackground = "#E1B85A";

  const data = useMemo(() => presets, [presets]);
  const [quote, setQuote] = useState<HadithItem | null>(null);
  const headerPadTop = useMemo(() => insets.top + 12, [insets.top]);

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
        <View style={[styles.leftCircle, { borderColor: "#D1A54B" }]}>
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
    <View style={{ width: contentWidth }}>
      <View style={[styles.quoteCard, { backgroundColor: quoteCardBackground }]}> 
        {quote ? (
          <>
            <Text style={styles.quoteTitle} numberOfLines={2}>
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
            <Text style={styles.quoteTitle} numberOfLines={2}>
              {"\u0627\u0630\u0643\u0631\u0648\u0627 \u0627\u0644\u0644\u0647 \u0643\u062B\u064A\u0631\u0627"}
            </Text>
            <Text style={styles.quoteBy} numberOfLines={1}>
              {"\u2014"}
            </Text>
          </>
        )}
      </View>

      <View style={styles.sectionRow}>
      
        
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: pageBackground }]}>
      <View style={[styles.header, { paddingTop: headerPadTop }]}> 
        <View style={[styles.headerRow, { width: contentWidth }]}>
          <Pressable style={styles.headerBtn} onPress={onAdd} hitSlop={12}>
            <Feather name="plus" size={24} color="white" />
          </Pressable>
          <Text style={styles.headerTitle} pointerEvents="none">الأذكار</Text>
          <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()} hitSlop={12}>
            <Feather name="chevron-left" size={24} color="white" />
          </Pressable>
        </View>
      </View>

      <FlatList
        style={{ width: contentWidth }}
        data={data}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24, paddingTop: 8 }}
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
    paddingBottom: 14,
    alignItems: "center",
    backgroundColor: "#1F4B3B",
  },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    position: "relative",
  },
  headerTitle: {
    ...typography.screenTitle,
    color: "white",
    fontSize: 24,
    fontWeight: "800",
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
  quoteCard: {
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  quoteTitle: {
    ...typography.itemTitle,
    color: "#1B1F22",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  quoteBy: {
    ...typography.itemSubtitle,
    marginTop: 8,
    color: "#4F4A3D",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  sectionRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    fontSize: 16,
    fontWeight: "800",
    color: "#1B1F22",
  },
  sectionAction: {
    ...typography.itemSubtitle,
    fontSize: 13,
    fontWeight: "700",
    color: "#C79B3B",
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  leftCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  leftCircleText: {
    ...typography.numberText,
    fontSize: 14,
    fontWeight: "800",
  },
  rowText: { flex: 1 },
  rowTitle: {
    ...typography.itemTitle,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "right",
  },
  rowSub: {
    ...typography.itemSubtitle,
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
});
