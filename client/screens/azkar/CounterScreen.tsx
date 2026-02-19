import React, { useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  StatusBar,
  Share,
  Alert,
  Vibration,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";

import { useApp } from "@/context/AppContext";

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

/* ─── Colors ─── */
const HEADER_BG = "#1B4332";
const PAGE_BG = "#F3EEE4";
const CARD_BG = "#FFFFFF";
const PRIMARY = "#1C1714";
const SECONDARY = "#968C80";
const GREEN = "#2D7A4E";
const GOLD = "#D4AF37";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export default function CounterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0
  );

  const { currentPreset, increment, reset, deletePreset } = useApp();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const completedRef = useRef(false);

  const name = currentPreset?.name ?? "SubhanAllah";
  const title = (currentPreset as any)?.arabicName ?? AR_TITLE[name] ?? name;
  const dhikrText = currentPreset?.text || AR_TEXT[name] || "";

  const count = currentPreset?.count ?? 0;
  const target = currentPreset?.target ?? 33;
  const pct = clamp01(target > 0 ? count / target : 0);
  const isCompleted = count >= target && target > 0;

  // Vibrate when target reached
  useEffect(() => {
    if (isCompleted && !completedRef.current) {
      completedRef.current = true;
      Vibration.vibrate([0, 100, 50, 100]);
    }
    if (!isCompleted) {
      completedRef.current = false;
    }
  }, [isCompleted]);

  const ring = useMemo(() => {
    const size = 240;
    const stroke = 14;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = c * pct;
    return { size, stroke, r, c, dash };
  }, [pct]);

  const goBack = () => navigation.goBack();

  const onShare = async () => {
    try {
      const msg = `${dhikrText}\n${count} / ${target}\n\nبواسطة تطبيق رفيق المسلم\nhttps://rafiqapp.me`;
      await Share.share({ message: msg });
    } catch {}
  };

  const onTrash = () => {
    if (!currentPreset) return;
    const isBuiltIn = Boolean((currentPreset as any).isBuiltIn);

    if (!isBuiltIn) {
      Alert.alert("حذف الذكر", "هل تريد حذف هذا الذكر؟", [
        { text: "إلغاء", style: "cancel" },
        { text: "حذف", style: "destructive", onPress: () => { deletePreset(currentPreset.id); goBack(); } },
      ]);
    } else {
      onReset();
    }
  };

  const onReset = () => {
    Alert.alert("تصفير العدّاد", "هل تريد تصفير العدّاد؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "تصفير", style: "destructive", onPress: () => reset() },
    ]);
  };

  const handleTap = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    increment();

    // Pulse animation
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.03, duration: 60, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <View style={s.headerRow}>
          {/* Left: action buttons */}
          <View style={s.headerActions}>
            <Pressable onPress={onReset} hitSlop={10} style={s.hBtn}>
              <Feather name="rotate-ccw" size={20} color={GOLD} />
            </Pressable>
            <Pressable onPress={onTrash} hitSlop={10} style={s.hBtn}>
              <Feather name="trash-2" size={20} color={GOLD} />
            </Pressable>
            <Pressable onPress={onShare} hitSlop={10} style={s.hBtn}>
              <Ionicons name="share-social-outline" size={20} color={GOLD} />
            </Pressable>
          </View>

          {/* Title */}
          <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>

          {/* Right: back button */}
          <Pressable onPress={goBack} hitSlop={12} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </Pressable>
        </View>
      </View>

      {/* Full screen tap area */}
      <Pressable style={s.tapArea} onPress={handleTap}>
        {/* Dhikr text */}
        <Text style={s.dhikrText} numberOfLines={2}>{dhikrText || " "}</Text>
        <View style={s.divider} />

        {/* Ring counter */}
        <Animated.View style={[s.ringWrap, { transform: [{ scale: pulseAnim }] }]}>
          <Svg width={ring.size} height={ring.size}>
            <Circle
              cx={ring.size / 2} cy={ring.size / 2} r={ring.r}
              stroke="#E8E3D9" strokeWidth={ring.stroke} fill="none"
            />
            <Circle
              cx={ring.size / 2} cy={ring.size / 2} r={ring.r}
              stroke={isCompleted ? GREEN : GOLD}
              strokeWidth={ring.stroke} fill="none" strokeLinecap="round"
              strokeDasharray={`${ring.dash} ${ring.c - ring.dash}`}
              rotation={-90} originX={ring.size / 2} originY={ring.size / 2}
            />
          </Svg>
          <View style={s.centerText}>
            {isCompleted ? (
              <>
                <Ionicons name="checkmark-circle" size={48} color={GREEN} />
                <Text style={s.completedText}>تم</Text>
              </>
            ) : (
              <>
                <Text style={s.bigNum}>{count}</Text>
                <View style={s.targetPill}>
                  <Text style={s.targetText}>من {target}</Text>
                </View>
              </>
            )}
          </View>
        </Animated.View>

        {/* Hint */}
        <View style={s.hintRow}>
          <Text style={s.hintText}>المس في أي مكان للعد</Text>
        </View>
      </Pressable>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  hBtn: {
    width: 34, height: 34,
    alignItems: "center", justifyContent: "center",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "CairoBold",
    color: "#FFF",
    fontSize: 22,
    textAlign: "center",
    flex: 1,
    marginHorizontal: 8,
  },

  /* Tap area */
  tapArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  /* Dhikr */
  dhikrText: {
    fontFamily: "CairoBold",
    fontSize: 26,
    color: PRIMARY,
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  divider: {
    width: 56, height: 3, borderRadius: 2,
    backgroundColor: GOLD,
    marginBottom: 24,
  },

  /* Ring */
  ringWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  bigNum: {
    fontFamily: "CairoBold",
    fontSize: 52,
    color: PRIMARY,
    lineHeight: 72,
    includeFontPadding: true,
  },
  targetPill: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: CARD_BG,
  },
  targetText: {
    fontFamily: "Cairo",
    fontSize: 15,
    color: SECONDARY,
  },
  completedText: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: GREEN,
    marginTop: 4,
  },

  /* Hint */
  hintRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hintText: {
    fontFamily: "Cairo",
    fontSize: 14,
    color: SECONDARY,
  },
});
