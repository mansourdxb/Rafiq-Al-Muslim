import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
  ScrollView,
  SafeAreaView,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

type ProgressRingProps = {
  progress: number;
  current: number;
  total: number;
};

const CATEGORIES = adhkarData as DhikrCategory[];
const HISN_PROGRESS_KEY = "athkar:hisnProgress";

function ProgressRing({ progress, current, total }: ProgressRingProps) {
  const size = 160;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = Math.max(0, Math.min(1, progress)) * circumference;

  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#BEEEDB"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#C9A23A"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={styles.ringTextWrap}>
        <Text style={styles.ringCurrent}>{current}</Text>
        <Text style={styles.ringTotal}>{`من ${total}`}</Text>
      </View>
    </View>
  );
}

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
  const current = items[index];
  const currentNumber = index + 1;
  const progress = total > 0 ? currentNumber / total : 0;
  const sourceLabel =
    current?.filename || current?.audio || category?.filename || category?.audio || "مرجع الذكر";

  useEffect(() => {
    if (!category || total <= 0) return;
    if (category.category !== "أذكار الصباح والمساء") return;

    const payload = {
      completed: Math.min(total, Math.max(0, currentNumber)),
      total,
      updatedAt: new Date().toISOString(),
    };

    AsyncStorage.setItem(HISN_PROGRESS_KEY, JSON.stringify(payload)).catch(() => undefined);
  }, [category, currentNumber, total]);

  const goPrev = () => setIndex((prev) => Math.max(0, prev - 1));
  const goNext = () => setIndex((prev) => Math.min(total - 1, prev + 1));
  const isPrevDisabled = index <= 0;
  const isNextDisabled = index >= total - 1;

  if (!category || total === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.header, { paddingTop: topInset + 8 }]}>
          <Text style={styles.headerTitle}>حصن المسلم</Text>
          <Pressable style={styles.headerBackBtn} onPress={() => navigation.goBack()} hitSlop={10}>
            <Feather name="chevron-right" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>لا توجد أذكار متاحة في هذا القسم.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {category.category}
        </Text>

        <View style={styles.headerProgressWrap}>
          <View style={styles.headerProgressTrack}>
            <View style={[styles.headerProgressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.headerProgressText}>{`${currentNumber} من ${total}`}</Text>
        </View>

        <Pressable style={styles.headerBackBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Feather name="chevron-right" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardTopActions}>
            <Pressable style={styles.iconGhost} onPress={() => console.log("zikr:share-top")}>
              <Feather name="share-2" size={18} color="#A8B0AD" />
            </Pressable>
            <Pressable style={styles.iconPlay} onPress={() => console.log("zikr:audio-top")}>
              <Feather name="play" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.zikrTextScroll}
            contentContainerStyle={styles.zikrTextScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.zikrText}>{current?.text ?? ""}</Text>
          </ScrollView>

          <View style={styles.sourceDivider} />
          <Text style={styles.sourceText}>{sourceLabel}</Text>
        </View>

        <View style={styles.mintSection}>
          <ProgressRing progress={progress} current={currentNumber} total={total} />
        </View>

        <View style={styles.navRow}>
          <Pressable
            style={[styles.navBtnSecondary, isPrevDisabled && styles.disabledBtn]}
            onPress={goPrev}
            disabled={isPrevDisabled}
          >
            <Feather name="arrow-right" size={18} color="#C9A23A" />
            <Text style={[styles.navBtnSecondaryText, isPrevDisabled && styles.disabledText]}>
              السابق
            </Text>
          </Pressable>

          <Pressable
            style={[styles.navBtnPrimary, isNextDisabled && styles.disabledBtn]}
            onPress={goNext}
            disabled={isNextDisabled}
          >
            <Text style={[styles.navBtnPrimaryText, isNextDisabled && styles.disabledText]}>
              التالي
            </Text>
            <Feather name="arrow-left" size={18} color="#143A2D" />
          </Pressable>
        </View>

        <View style={styles.toolsRow}>
          {/* TODO: connect text size controls to a real font scale setting */}
          <Pressable style={styles.toolBtn} onPress={() => console.log("zikr:text-size")}>
            <Text style={styles.toolText}>TT</Text>
          </Pressable>
          {/* TODO: wire zikr audio playback */}
          <Pressable style={styles.toolBtn} onPress={() => console.log("zikr:audio")}>
            <Feather name="volume-2" size={22} color="#13835D" />
          </Pressable>
          {/* TODO: wire native share */}
          <Pressable style={styles.toolBtn} onPress={() => console.log("zikr:share")}>
            <Feather name="share-2" size={22} color="#13835D" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F4F4F2",
  },
  header: {
    backgroundColor: "#174B3B",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    paddingBottom: 14,
    paddingHorizontal: 18,
  },
  headerTitle: {
    ...typography.screenTitle,
    color: "#FFFFFF",
    fontSize: 34,
    textAlign: "center",
  },
  headerBackBtn: {
    position: "absolute",
    right: 12,
    top: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  headerProgressWrap: {
    marginTop: 8,
  },
  headerProgressTrack: {
    height: 8,
    borderRadius: 99,
    backgroundColor: "#6C8D84",
    overflow: "hidden",
  },
  headerProgressFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: "#C9A23A",
  },
  headerProgressText: {
    ...typography.itemSubtitle,
    marginTop: 6,
    color: "#C9A23A",
    fontSize: 16,
    textAlign: "center",
  },
  scroll: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTopActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconGhost: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F5F4",
  },
  iconPlay: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C9A23A",
  },
  zikrTextScroll: {
    maxHeight: 360,
    marginTop: 12,
  },
  zikrTextScrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  zikrText: {
    ...typography.itemSubtitle,
    color: "#123B2E",
    textAlign: "center",
    writingDirection: "rtl",
    fontSize: 48,
    lineHeight: 76,
  },
  sourceDivider: {
    width: 140,
    height: 1,
    backgroundColor: "#E8DBAF",
    alignSelf: "center",
    marginTop: 12,
  },
  sourceText: {
    ...typography.itemSubtitle,
    marginTop: 10,
    textAlign: "center",
    color: "#C9A23A",
    fontSize: 14,
  },
  mintSection: {
    marginTop: 10,
    borderRadius: 24,
    backgroundColor: "#EAF7F1",
    paddingVertical: 16,
    alignItems: "center",
  },
  ringWrap: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  ringTextWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  ringCurrent: {
    ...typography.numberText,
    color: "#174B3B",
    fontSize: 52,
  },
  ringTotal: {
    ...typography.itemSubtitle,
    color: "#C9A23A",
    fontSize: 18,
    marginTop: 2,
  },
  navRow: {
    marginTop: 14,
    flexDirection: "row-reverse",
    gap: 12,
  },
  navBtnPrimary: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: "#C9A23A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  navBtnPrimaryText: {
    ...typography.buttonText,
    color: "#143A2D",
    fontSize: 20,
  },
  navBtnSecondary: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#C9A23A",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  navBtnSecondaryText: {
    ...typography.buttonText,
    color: "#C9A23A",
    fontSize: 20,
  },
  disabledBtn: {
    opacity: 0.45,
  },
  disabledText: {
    opacity: 0.7,
  },
  toolsRow: {
    marginTop: 14,
    flexDirection: "row-reverse",
    justifyContent: "center",
    gap: 14,
  },
  toolBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#BEEEDB",
    alignItems: "center",
    justifyContent: "center",
  },
  toolText: {
    ...typography.buttonText,
    color: "#13835D",
    fontSize: 20,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    ...typography.itemSubtitle,
    color: "#6E7A73",
    textAlign: "center",
    fontSize: 16,
  },
});
