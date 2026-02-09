import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import { typography } from "@/theme/typography";
import adhkarData from "@/assets/data/adhkar.json";

type DhikrItem = {
  id: number;
  text: string;
  count: number;
  audio?: string;
  filename?: string;
};

type DhikrCategory = {
  id: number;
  category: string;
  audio?: string;
  filename?: string;
  array: DhikrItem[];
};

type RouteParams = {
  categoryId?: number;
  categoryTitle?: string;
};

const CATEGORIES = adhkarData as DhikrCategory[];

export default function HisnCategoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = (route.params || {}) as RouteParams;
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0
  );

  const category = useMemo(() => {
    if (params.categoryId != null) {
      return CATEGORIES.find((c) => c.id === params.categoryId);
    }
    if (params.categoryTitle) {
      return CATEGORIES.find((c) => c.category === params.categoryTitle);
    }
    return undefined;
  }, [params.categoryId, params.categoryTitle]);

  const title = category?.category ?? params.categoryTitle ?? "حصن المسلم";
  const items = category?.array ?? [];

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.headerIcon}
            onPress={() => navigation.goBack()}
            hitSlop={10}
          >
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Text style={styles.itemText}>{item.text}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{item.count} مرات</Text>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F4F4F2",
  },
  header: {
    backgroundColor: "#1B4332",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingBottom: 18,
    paddingHorizontal: 18,
    marginHorizontal: -18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    ...typography.screenTitle,
    color: "#FFFFFF",
    fontSize: 20,
    textAlign: "center",
    flex: 1,
  },
  list: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  itemText: {
    ...typography.itemSubtitle,
    fontSize: 15,
    color: "#1F2D25",
    textAlign: "right",
    writingDirection: "rtl",
  },
  countBadge: {
    alignSelf: "flex-end",
    marginTop: 10,
    backgroundColor: "#E9EFEA",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: {
    ...typography.numberText,
    fontSize: 12,
    color: "#1B4332",
  },
});
