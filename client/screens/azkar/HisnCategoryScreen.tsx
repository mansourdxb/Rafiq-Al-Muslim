import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
  ScrollView,
  Share,
  Animated,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { Audio } from "expo-av";

import adhkarData from "@/assets/data/adhkar.json";

/* ─── Colors ─── */
const HEADER_BG = "#1B4332";
const PAGE_BG = "#F3EEE4";
const CARD_BG = "#FFFFFF";
const PRIMARY = "#1C1714";
const SECONDARY = "#968C80";
const GREEN = "#2D7A4E";
const DARK_GREEN = "#1B4332";
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F6F0E1";
const MINT = "#E8F5EE";

type DhikrItem = { id: number; text: string; count: number; audio?: string; filename?: string };
type DhikrCategory = { id: number; category: string; audio?: string; filename?: string; array: DhikrItem[] };
type RouteParams = { categoryId?: number; categoryTitle?: string };

const CATEGORIES = adhkarData as DhikrCategory[];
const PROGRESS_KEY = "athkar:categoryProgress";

function showToast(msg: string) {
  if (Platform.OS === "android") {
    const { ToastAndroid } = require("react-native");
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  }
}

export default function HisnCategoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = (route.params || {}) as RouteParams;
  const topInset = Math.max(insets.top, Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0);

  const category = useMemo(() => {
    if (params.categoryId != null) return CATEGORIES.find((c) => c.id === params.categoryId);
    if (params.categoryTitle) return CATEGORIES.find((c) => c.category === params.categoryTitle);
    return undefined;
  }, [params.categoryId, params.categoryTitle]);

  const items = category?.array ?? [];
  const total = items.length;

  const [index, setIndex] = useState(0);
  const [repeatCount, setRepeatCount] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const current = items[index];
  const currentNumber = index + 1;
  const progress = total > 0 ? currentNumber / total : 0;
  const maxRepeat = current?.count || 1;
  const isCompleted = repeatCount >= maxRepeat;

  // Get audio URL for current dhikr
  const audioUrl = current?.audio || category?.audio || "";

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // Stop audio when index changes
  useEffect(() => {
    stopAudio();
    setRepeatCount(0);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [index]);

  const stopAudio = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch {}
    setIsPlaying(false);
  }, []);

  const toggleAudio = useCallback(async () => {
    if (isPlaying) {
      await stopAudio();
      return;
    }

    if (!audioUrl) {
      showToast("\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0644\u0641 \u0635\u0648\u062a\u064a"); // لا يوجد ملف صوتي
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          soundRef.current = null;
        }
      });
    } catch (err) {
      console.error("Audio playback error:", err);
      showToast("\u062a\u0639\u0630\u0651\u0631 \u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0635\u0648\u062a"); // تعذّر تشغيل الصوت
      setIsPlaying(false);
    }
  }, [isPlaying, audioUrl, stopAudio]);

  // Save progress
  useEffect(() => {
    if (!category || total <= 0) return;
    const payload = { completed: Math.min(total, currentNumber), total, updatedAt: new Date().toISOString() };
    AsyncStorage.setItem(`athkar:progress:${category.id}`, JSON.stringify(payload)).catch(() => {});

    // If last item completed, mark category as done
    if (currentNumber === total && isCompleted) {
      AsyncStorage.getItem(PROGRESS_KEY)
        .then((val) => {
          const map = val ? JSON.parse(val) : {};
          map[category.id] = true;
          return AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
        })
        .catch(() => {});
    }
  }, [category, currentNumber, total, isCompleted]);

  const onCount = useCallback(() => {
    if (isCompleted) {
      // Auto advance to next
      if (index < total - 1) {
        setIndex((prev) => prev + 1);
      }
      return;
    }
    setRepeatCount((prev) => prev + 1);
    // Pulse animation
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  }, [isCompleted, index, total, pulseAnim]);

  const goPrev = () => { if (index > 0) setIndex((prev) => prev - 1); };
  const goNext = () => { if (index < total - 1) setIndex((prev) => prev + 1); };

  const onShare = async () => {
    if (!current) return;
    const text = `${current.text}\n\nمن حصن المسلم - ${category?.category}\n\nبواسطة تطبيق رفيق المسلم\nhttps://rafiqapp.me`;
    await Share.share({ message: text });
  };

  const onCopy = async () => {
    if (!current) return;
    await Clipboard.setStringAsync(current.text);
    showToast("تم النسخ");
  };

  const adjustFont = (delta: number) => {
    setFontSize((prev) => Math.max(16, Math.min(40, prev + delta)));
  };

  // Progress ring
  const ringSize = 100;
  const ringStroke = 6;
  const ringR = (ringSize - ringStroke) / 2;
  const ringC = 2 * Math.PI * ringR;
  const ringDash = progress * ringC;

  // Repeat ring
  const repSize = 80;
  const repStroke = 5;
  const repR = (repSize - repStroke) / 2;
  const repC = 2 * Math.PI * repR;
  const repProgress = maxRepeat > 0 ? Math.min(1, repeatCount / maxRepeat) : 0;
  const repDash = repProgress * repC;

  if (!category || total === 0) {
    return (
      <View style={s.root}>
        <View style={[s.header, { paddingTop: topInset + 8 }]}>
          <View style={s.headerRow}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </Pressable>
            <Text style={s.headerTitle}>حصن المسلم</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>
        <View style={s.emptyWrap}>
          <Ionicons name="book-outline" size={48} color={SECONDARY} />
          <Text style={s.emptyText}>لا توجد أذكار متاحة في هذا القسم</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <View style={s.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </Pressable>
          <Text style={s.headerTitle} numberOfLines={1}>{category.category}</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Progress bar in header */}
        <View style={s.headerProgress}>
          <View style={s.headerBar}>
            <View style={[s.headerBarFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={s.headerBarText}>{currentNumber} من {total}</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Dhikr Card */}
        <Animated.View style={[s.card, { transform: [{ scale: pulseAnim }] }]}>
          {/* Top tools */}
          <View style={s.cardTools}>
            <Pressable onPress={onShare} hitSlop={10} style={s.toolBtn}>
              <Ionicons name="share-social-outline" size={18} color={SECONDARY} />
            </Pressable>
            <Pressable onPress={onCopy} hitSlop={10} style={s.toolBtn}>
              <Ionicons name="copy-outline" size={18} color={SECONDARY} />
            </Pressable>
            <Pressable onPress={toggleAudio} hitSlop={10} style={s.playBtn}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={16} color="#FFF" />
            </Pressable>
            <View style={s.toolSpacer} />
            <Pressable onPress={() => adjustFont(-2)} hitSlop={10} style={s.toolBtn}>
              <Text style={s.toolText}>أ-</Text>
            </Pressable>
            <Pressable onPress={() => adjustFont(2)} hitSlop={10} style={s.toolBtn}>
              <Text style={s.toolTextLg}>أ+</Text>
            </Pressable>
          </View>

          {/* Dhikr text */}
          <Text style={[s.dhikrText, { fontSize, lineHeight: fontSize * 1.9 }]}>
            {current?.text ?? ""}
          </Text>

          {/* Source */}
          {(current?.filename || current?.audio || category?.filename) && (
            <>
              <View style={s.divider} />
              <Text style={s.sourceText}>
                {current?.filename || current?.audio || category?.filename || category?.audio || ""}
              </Text>
            </>
          )}
        </Animated.View>

        {/* Counter Section */}
        <View style={s.counterSection}>
          <Pressable onPress={onCount} style={s.counterBtn}>
            <Svg width={repSize} height={repSize}>
              <Circle cx={repSize / 2} cy={repSize / 2} r={repR} stroke="#E5E0D6" strokeWidth={repStroke} fill="none" />
              <Circle cx={repSize / 2} cy={repSize / 2} r={repR}
                stroke={isCompleted ? GREEN : GOLD}
                strokeWidth={repStroke} fill="none" strokeLinecap="round"
                strokeDasharray={`${repDash} ${repC - repDash}`}
                rotation={-90} originX={repSize / 2} originY={repSize / 2}
              />
            </Svg>
            <View style={s.counterInner}>
              {isCompleted ? (
                <Ionicons name="checkmark-circle" size={32} color={GREEN} />
              ) : (
                <>
                  <Text style={s.counterNum}>{repeatCount}</Text>
                  <Text style={s.counterMax}>من {maxRepeat}</Text>
                </>
              )}
            </View>
          </Pressable>
          <Text style={s.counterHint}>
            {isCompleted
              ? (index < total - 1 ? "اضغط للتالي" : "تم إنهاء الأذكار ✓")
              : "اضغط للعد"}
          </Text>
        </View>

        {/* Navigation */}
        <View style={s.navRow}>
          <Pressable
            style={[s.navBtn, s.navPrev, index <= 0 && s.navDisabled]}
            onPress={goPrev}
            disabled={index <= 0}
          >
            <Ionicons name="arrow-forward" size={18} color={index <= 0 ? "#C8B99A" : GOLD} />
            <Text style={[s.navPrevText, index <= 0 && s.navDisabledText]}>السابق</Text>
          </Pressable>

          {/* Mini ring */}
          <View style={s.navRing}>
            <Svg width={ringSize} height={ringSize}>
              <Circle cx={ringSize / 2} cy={ringSize / 2} r={ringR} stroke="#E5E0D6" strokeWidth={ringStroke} fill="none" />
              <Circle cx={ringSize / 2} cy={ringSize / 2} r={ringR}
                stroke={GOLD} strokeWidth={ringStroke} fill="none" strokeLinecap="round"
                strokeDasharray={`${ringDash} ${ringC - ringDash}`}
                rotation={-90} originX={ringSize / 2} originY={ringSize / 2}
              />
            </Svg>
            <View style={s.navRingInner}>
              <Text style={s.navRingNum}>{currentNumber}</Text>
              <Text style={s.navRingSub}>من {total}</Text>
            </View>
          </View>

          <Pressable
            style={[s.navBtn, s.navNext, index >= total - 1 && s.navDisabled]}
            onPress={goNext}
            disabled={index >= total - 1}
          >
            <Text style={[s.navNextText, index >= total - 1 && s.navDisabledText]}>التالي</Text>
            <Ionicons name="arrow-back" size={18} color={index >= total - 1 ? "#FFF" : "#FFF"} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },

  /* Header */
  header: {
    backgroundColor: HEADER_BG,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "CairoBold", fontSize: 18, color: "#FFF", textAlign: "center", flex: 1 },

  /* Header progress */
  headerProgress: { marginTop: 10, alignItems: "center", gap: 4 },
  headerBar: {
    width: "70%", height: 5, borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerBarFill: { height: 5, borderRadius: 3, backgroundColor: GOLD },
  headerBarText: { fontFamily: "Cairo", fontSize: 11, color: "rgba(255,255,255,0.5)" },

  /* Scroll */
  scroll: { paddingHorizontal: 14, paddingTop: 14 },

  /* Card */
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 22,
    padding: 18,
  },
  cardTools: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  toolBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "#F5F2EB",
    alignItems: "center", justifyContent: "center",
  },
  playBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: "center", justifyContent: "center",
  },
  toolSpacer: { flex: 1 },
  toolText: { fontFamily: "CairoBold", fontSize: 13, color: SECONDARY },
  toolTextLg: { fontFamily: "CairoBold", fontSize: 15, color: PRIMARY },

  dhikrText: {
    fontFamily: "Cairo",
    color: PRIMARY,
    textAlign: "center",
    writingDirection: "rtl",
    paddingHorizontal: 4,
  },
  divider: {
    width: 100, height: 1, backgroundColor: "#E8E3D9",
    alignSelf: "center", marginTop: 16,
  },
  sourceText: {
    fontFamily: "Cairo", fontSize: 12, color: GOLD,
    textAlign: "center", marginTop: 8,
  },

  /* Counter */
  counterSection: { alignItems: "center", marginTop: 20, gap: 10 },
  counterBtn: {
    width: 80, height: 80,
    alignItems: "center", justifyContent: "center",
  },
  counterInner: {
    position: "absolute",
    alignItems: "center", justifyContent: "center",
  },
  counterNum: { fontFamily: "CairoBold", fontSize: 24, color: PRIMARY },
  counterMax: { fontFamily: "Cairo", fontSize: 11, color: SECONDARY, marginTop: -4 },
  counterHint: { fontFamily: "Cairo", fontSize: 13, color: SECONDARY },

  /* Navigation */
  navRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  navBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  navPrev: {
    backgroundColor: CARD_BG,
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  navNext: {
    backgroundColor: GOLD,
  },
  navPrevText: { fontFamily: "CairoBold", fontSize: 16, color: GOLD },
  navNextText: { fontFamily: "CairoBold", fontSize: 16, color: DARK_GREEN },
  navDisabled: { opacity: 0.4 },
  navDisabledText: { opacity: 0.6 },

  navRing: { alignItems: "center", justifyContent: "center" },
  navRingInner: { position: "absolute", alignItems: "center" },
  navRingNum: { fontFamily: "CairoBold", fontSize: 28, color: DARK_GREEN },
  navRingSub: { fontFamily: "Cairo", fontSize: 11, color: GOLD, marginTop: -4 },

  /* Empty */
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontFamily: "Cairo", fontSize: 15, color: SECONDARY, textAlign: "center" },
});
