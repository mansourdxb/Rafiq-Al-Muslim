import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  Platform,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

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

const CATEGORIES = adhkarData as DhikrCategory[];

export default function HisnAlMuslimScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState("");
  const { width } = useWindowDimensions();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0
  );

  const maxW = 430;
  const contentWidth = Math.min(width, maxW);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter((item) => item.category.includes(q));
  }, [query]);

  return (
    <View style={styles.root}>
      <View style={[styles.phone, { width: contentWidth }]}>
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerTitle}>حصن المسلم</Text>
            <Pressable
              style={styles.headerIcon}
              onPress={() => navigation.goBack()}
              hitSlop={10}
            >
              <Feather name="chevron-right" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <Feather name="search" size={18} color="#B8C3B6" style={styles.searchIcon} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="البحث في حصن المسلم..."
              placeholderTextColor="#B8C3B6"
              style={styles.searchInput}
              textAlign="right"
              writingDirection="rtl"
            />
          </View>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate("HisnCategory", {
                  categoryId: item.id,
                  categoryTitle: item.category,
                })
              }
              style={styles.rowCard}
            >
              <View style={styles.countPill}>
                <Text style={styles.countText}>{item.array?.length ?? 0}</Text>
              </View>
              <Text style={styles.rowTitle}>{item.category}</Text>
              <Feather name="chevron-left" size={18} color="#D4AF37" />
            </Pressable>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>

     
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F4F4F2",
    alignItems: "center",
  },
  phone: {
    flex: 1,
    alignSelf: "center",
  },
  header: {
    backgroundColor: "#1B4332",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingBottom: 22,
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
    fontSize: 22,
    textAlign: "center",
    flex: 1,
  },
  searchWrap: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  searchIcon: {
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    ...typography.inputText,
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "right",
    writingDirection: "rtl",
  },
  list: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  rowCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  rowTitle: {
    ...typography.itemTitle,
    fontSize: 16,
    color: "#1F2D25",
    textAlign: "right",
    flex: 1,
  },
  countPill: {
    minWidth: 32,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#DFF3E8",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  countText: {
    ...typography.numberText,
    fontSize: 12,
    color: "#1B4332",
  },

});
