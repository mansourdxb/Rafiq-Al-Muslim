import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import adhkarData from "@/assets/data/adhkar.json";

/* ─── Colors ─── */
const HEADER_BG = "#1B4332";
const PAGE_BG = "#F3EEE4";
const CARD_BG = "#FFFFFF";
const PRIMARY = "#1C1714";
const SECONDARY = "#968C80";
const GREEN = "#2D7A4E";
const GOLD = "#D4AF37";

type DhikrCategory = {
  id: number;
  category: string;
  audio?: string;
  filename?: string;
  array: { id: number; text: string; count: number }[];
};

const CATEGORIES = adhkarData as DhikrCategory[];
const PROGRESS_KEY = "athkar:categoryProgress";

export default function HisnAlMuslimScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const contentWidth = Math.min(width, 430);
  const topInset = Math.max(insets.top, Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0);

  const [search, setSearch] = useState("");
  const [completedMap, setCompletedMap] = useState<Record<number, boolean>>({});

  // Load completion status
  useEffect(() => {
    AsyncStorage.getItem(PROGRESS_KEY)
      .then((val) => { if (val) setCompletedMap(JSON.parse(val)); })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return CATEGORIES;
    const q = search.trim();
    return CATEGORIES.filter((c) => c.category.includes(q));
  }, [search]);

  const totalCategories = CATEGORIES.length;
  const completedCount = Object.values(completedMap).filter(Boolean).length;

  const navigateAthkar = (screen: string, params?: Record<string, any>) => {
    const nestedParams = { screen, params };
    let parent: any = navigation;
    while (parent) {
      const routeNames = parent.getState?.().routeNames ?? [];
      if (routeNames.includes("Main")) {
        parent.navigate("Main", { screen: "AthkarTab", params: nestedParams });
        return;
      }
      parent = parent.getParent?.();
    }
    const routes = navigation.getState?.().routeNames ?? [];
    if (routes.includes("AthkarTab")) {
      navigation.navigate("AthkarTab", nestedParams);
      return;
    }
    navigation.navigate(screen, params);
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <View style={s.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </Pressable>
          <Text style={s.headerTitle}>حصن المسلم</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Progress summary */}
        <View style={s.progressRow}>
          <Text style={s.progressText}>
            {completedCount > 0 ? `تم قراءة ${completedCount} من ${totalCategories}` : `${totalCategories} باب`}
          </Text>
          {completedCount > 0 && (
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${(completedCount / totalCategories) * 100}%` }]} />
            </View>
          )}
        </View>

        {/* Search */}
        <View style={s.searchBox}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="البحث في حصن المسلم..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={s.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
            </Pressable>
          )}
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
        </View>
      </View>

      {/* Category List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24, paddingHorizontal: 14, paddingTop: 14 }}
        style={{ width: contentWidth, alignSelf: "center" }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const isCompleted = !!completedMap[item.id];
          return (
            <Pressable
              style={s.card}
              onPress={() => navigateAthkar("HisnCategory", { categoryId: item.id, categoryTitle: item.category })}
            >
              <View style={s.cardRow}>
                {/* Chevron */}
                <Ionicons name="chevron-back" size={18} color="#C8B99A" />

                {/* Title + count */}
                <View style={s.cardInfo}>
                  <Text style={s.cardTitle}>{item.category}</Text>
                  <Text style={s.cardCount}>{item.array.length} ذكر</Text>
                </View>

                {/* Number badge */}
                <View style={[s.numBadge, isCompleted && s.numBadgeCompleted]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  ) : (
                    <Text style={s.numText}>{index + 1}</Text>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Ionicons name="search-outline" size={48} color={SECONDARY} />
            <Text style={s.emptyText}>لا توجد نتائج</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },

  /* Header */
  header: {
    backgroundColor: HEADER_BG,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "CairoBold", fontSize: 22, color: "#FFF", textAlign: "center", flex: 1 },

  /* Progress */
  progressRow: { marginTop: 8, alignItems: "center", gap: 6 },
  progressText: { fontFamily: "Cairo", fontSize: 12, color: "rgba(255,255,255,0.6)" },
  progressBar: {
    width: "60%", height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: GOLD },

  /* Search */
  searchBox: {
    marginTop: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Cairo",
    fontSize: 14,
    color: "#FFF",
    textAlign: "right",
    writingDirection: "rtl",
    paddingVertical: 0,
  },

  /* Cards */
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardInfo: { flex: 1, alignItems: "flex-end", gap: 2 },
  cardTitle: { fontFamily: "CairoBold", fontSize: 15, color: PRIMARY, textAlign: "right" },
  cardCount: { fontFamily: "Cairo", fontSize: 12, color: SECONDARY },
  numBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#E8E3D9",
    alignItems: "center", justifyContent: "center",
  },
  numBadgeCompleted: { backgroundColor: GREEN },
  numText: { fontFamily: "CairoBold", fontSize: 14, color: "#4A4036" },

  /* Empty */
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Cairo", fontSize: 15, color: SECONDARY },
});
