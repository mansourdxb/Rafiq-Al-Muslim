import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
  ScrollView,
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
    if (params.categoryId != null) return CATEGORIES.find((c) => c.id === params.categoryId);
    if (params.categoryTitle) return CATEGORIES.find((c) => c.category === params.categoryTitle);
    return undefined;
  }, [params.categoryId, params.categoryTitle]);

  const items = category?.array ?? [];
  const total = items.length;

  const [index, setIndex] = useState(0);
  const [repeat, setRepeat] = useState(0);

  const current = items[index];
  const target = current?.count ?? 0;

  const goPrev = () => {
    const nextIndex = Math.max(0, index - 1);
    setIndex(nextIndex);
    setRepeat(0);
  };

  const goNext = () => {
    const nextIndex = Math.min(total - 1, index + 1);
    setIndex(nextIndex);
    setRepeat(0);
  };

  const onRepeat = () => {
    if (!current) return;
    const nextRepeat = repeat + 1;

    if (nextRepeat >= target && target > 0) {
      if (index < total - 1) setIndex(index + 1);
      setRepeat(0);
      return;
    }

    setRepeat(nextRepeat);
  };

  if (!category || total === 0) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: topInset + 12, minHeight: topInset + 150 }]}>
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
        </View>

        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>لا توجد أذكار متاحة في هذا القسم.</Text>
        </View>
      </View>
    );
  }

  const progressText = `${index + 1} من ${total}`;
  const progressPct = total > 0 ? (index + 1) / total : 0;

  // ↑ زوّد/قلّل الرقم لو حبيت تنزّل/ترفع بلوك التقدم داخل الهيدر
  const HEADER_MIN_HEIGHT = 170;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 12,
            minHeight: topInset + HEADER_MIN_HEIGHT,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {category.category}
          </Text>
          <Pressable style={styles.headerIcon} onPress={() => navigation.goBack()} hitSlop={10}>
            <Feather name="chevron-right" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ✅ التقدم داخل الهيدر لكن "أسفل" وليس في بداية الهيدر */}
        <View style={styles.progressContainer}>
          <View style={styles.progressMetaRow}>
            <Text style={styles.progressCount}>{progressText}</Text>
            <Text style={styles.progressLabel}>التقدم الإجمالي</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Pressable style={styles.iconGhost} onPress={() => console.log("hisn:share")}>
              <Feather name="share-2" size={18} color="#B3BAB7" />
            </Pressable>

            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitleText}>الذكر رقم {index + 1}</Text>
            </View>

            <Pressable style={styles.playBtn} onPress={() => console.log("hisn:play")}>
              <Feather name="play" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={styles.dhikrText}>{current?.text ?? ""}</Text>

          <Pressable style={styles.ringWrap} onPress={onRepeat}>
            <View style={styles.ringOuter}>
              <View style={styles.ringInner}>
                <Text style={styles.ringText}>
                  {target} / {repeat}
                </Text>
                <Text style={styles.ringCaption}>اضغط للتكرار</Text>
              </View>
            </View>
          </Pressable>

          <View style={styles.navRow}>
            <Pressable style={styles.navBtn} onPress={goNext}>
              <Text style={styles.navText}>التالي</Text>
              <Feather name="arrow-left" size={16} color="#D4AF37" />
            </Pressable>

            <View style={styles.navDivider} />

            <Pressable style={styles.navBtn} onPress={goPrev}>
              <Feather name="arrow-right" size={16} color="#D4AF37" />
              <Text style={styles.navText}>السابق</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Pressable style={[styles.fab, { bottom: insets.bottom + 16 }]} onPress={() => {}}>
        <Feather name="moon" size={22} color="#1B4332" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F4F4F2",
  },

  header: {
    position: "relative",
    backgroundColor: "#1B4332",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingBottom: 18,
    paddingHorizontal: 18,
    marginHorizontal: -18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
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
    fontSize: 18,
    textAlign: "center",
    flex: 1,
  },

  // ✅ بلوك التقدم في منتصف/أسفل الهيدر مثل الصورة
  progressContainer: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 14,
  },
  progressMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    // يحرك "التقدم الإجمالي" قليلاً لليسار، والعدد قليلاً لليمين (للداخل)
    paddingHorizontal: 10,
  },
  progressLabel: {
    ...typography.itemSubtitle,
    color: "#D6DED7",
    fontSize: 13,
    textAlign: "right",
  },
  progressCount: {
    ...typography.itemSubtitle,
    color: "#D6DED7",
    fontSize: 13,
    textAlign: "left",
  },
  progressTrack: {
    marginTop: 8,
    height: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
    flexDirection: "row-reverse", // fill من اليمين لليسار
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#D4AF37",
    borderRadius: 6,
  },

  scroll: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E3E8E3",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconGhost: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F4F3",
  },
  cardTitleWrap: {
    alignItems: "center",
    flex: 1,
  },
  cardTitleText: {
    ...typography.itemTitle,
    fontSize: 16,
    color: "#D4AF37",
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D4AF37",
  },
  dhikrText: {
    ...typography.itemSubtitle,
    fontSize: 18,
    color: "#1F2D25",
    textAlign: "center",
    writingDirection: "rtl",
    marginTop: 16,
    lineHeight: 30,
  },

  ringWrap: {
    marginTop: 20,
    alignItems: "center",
  },
  ringOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "#DDE7DF",
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2,
    borderColor: "#F2E7C8",
    alignItems: "center",
    justifyContent: "center",
  },
  ringText: {
    ...typography.numberText,
    fontSize: 20,
    color: "#D4AF37",
  },
  ringCaption: {
    ...typography.itemSubtitle,
    fontSize: 12,
    color: "#A7B0AB",
    marginTop: 6,
  },

  navRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  navText: {
    ...typography.itemTitle,
    fontSize: 14,
    color: "#D4AF37",
  },
  navDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E3E8E3",
  },

  fab: {
    position: "absolute",
    left: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    ...typography.itemSubtitle,
    fontSize: 14,
    color: "#7C8A82",
    textAlign: "center",
  },
});
