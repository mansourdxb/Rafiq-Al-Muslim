import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { typography } from "@/theme/typography";
import { quranFiles } from "@/lib/quran/quranFiles";
import { StackActions, useNavigation } from "@react-navigation/native";
import { getPageForAyah } from "@/src/lib/quran/mushaf";

function getMeta(data: any) {
  const meta = data?.surah ?? data?.chapter ?? data?.meta ?? data?.metadata ?? {};
  const number = meta?.number ?? data?.number ?? meta?.id;
  const nameAr =
    meta?.name_ar ??
    meta?.arabic_name ??
    meta?.arabic ??
    meta?.name?.arabic ??
    meta?.name_arabic ??
    "";
  const nameEn =
    meta?.name_en ??
    meta?.english_name ??
    meta?.english ??
    meta?.name?.english ??
    meta?.name_english ??
    "";
  return { number, nameAr, nameEn };
}

export default function QuranSurahListScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const openSurah = (sura: number, aya = 1) => {
    const page = getPageForAyah(sura, aya);
    console.log("[QuranList] MANUAL open", { sura, aya, page });
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

  const items = useMemo(() => {
    return quranFiles.map((f) => {
      const meta = getMeta(f.data);
      const ayahs =
        f.data?.ayahs ??
        f.data?.verses ??
        f.data?.aya ??
        f.data?.items ??
        f.data?.data ??
        [];
      const ayahCount = Array.isArray(ayahs) ? ayahs.length : 0;
      return {
        number: f.number,
        fileName: f.fileName,
        nameAr: meta.nameAr || `???? ??? ${f.number}`,
        nameEn: meta.nameEn || "",
        ayahCount,
      };
    });
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.headerGradient as [string, string, ...string[]]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerInner}>
          <Text style={styles.headerTitle}>??????</Text>
        </View>
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.number)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openSurah(item.number, 1)}
            style={({ pressed }) => [styles.row, pressed ? { opacity: 0.9 } : null]}
          >
            <View style={styles.rowText}>
              <Text style={styles.ar} numberOfLines={1}>
                {item.nameAr}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {`??? ?????? ${item.ayahCount}`}
              </Text>
            </View>
            <Pressable
              onPress={() => openSurah(item.number, 1)}
              style={styles.badge}
            >
              <Text style={styles.badgeText}>{item.number}</Text>
            </Pressable>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3EEE8" },
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
    ...typography.screenTitle,
    color: "#FFFFFF",
    fontSize: 32,
    textAlign: "center",
  },
  list: { padding: 16, paddingBottom: 24 },
  resumeRow: {
    backgroundColor: "#1E8B5A",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  resumeText: {
    ...typography.buttonText,
    color: "#FFFFFF",
    fontSize: 14,
  },
  row: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  rowText: { flex: 1, alignItems: "flex-end" },
  ar: {
    ...typography.itemTitle,
    fontSize: 20,
    textAlign: "right",
    writingDirection: "rtl",
  },
  meta: {
    ...typography.itemSubtitle,
    fontSize: 13,
    opacity: 0.7,
    marginTop: 4,
    textAlign: "right",
    writingDirection: "rtl",
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1E8B5A",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    ...typography.numberText,
    color: "#FFFFFF",
    fontSize: 14,
  },
});
