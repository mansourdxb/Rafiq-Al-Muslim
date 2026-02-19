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
  Vibration,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { getAthkarAudioUri, isAudioCached, type DownloadProgress } from "@/utils/athkarAudioCache";

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
  const [countsMap, setCountsMap] = useState<Record<number, number>>({});
  const [fontSize, setFontSize] = useState(18);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadPct, setDownloadPct] = useState(0);
  const [audioCached, setAudioCached] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const current = items[index];
  const currentNumber = index + 1;
  const progress = total > 0 ? currentNumber / total : 0;
  const maxRepeat = current?.count || 1;
  const repeatCount = countsMap[index] ?? 0;
  const isCompleted = repeatCount >= maxRepeat;

  // Get audio filename for current dhikr
  const audioFile = current?.audio || current?.filename || category?.audio || category?.filename || "";

  // Check if cached when index changes
  useEffect(() => {
    setAudioCached(false);
    if (audioFile) {
      isAudioCached(audioFile).then(setAudioCached).catch(() => {});
    }
  }, [audioFile]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // Stop audio when index changes
  useEffect(() => {
    stopAudio();
    setDownloadPct(0);
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

    if (!audioFile) {
      showToast("\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0644\u0641 \u0635\u0648\u062a\u064a");
      return;
    }

    try {
      // Download if not cached (shows progress)
      setIsDownloading(true);
      setDownloadPct(0);

      const uri = await getAthkarAudioUri(audioFile, (p) => {
        setDownloadPct(p.percent);
      });

      setIsDownloading(false);
      setAudioCached(true);

      if (!uri) {
        showToast("\u062a\u0639\u0630\u0651\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0635\u0648\u062a");
        return;
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
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
      showToast("\u062a\u0639\u0630\u0651\u0631 \u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0635\u0648\u062a");
      setIsPlaying(false);
      setIsDownloading(false);
    }
  }, [isPlaying, audioFile, stopAudio]);

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
      // Already completed — tap again to advance manually
      if (index < total - 1) {
        setIndex((prev) => prev + 1);
      }
      return;
    }

    // Haptic feedback on each tap
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}

    const newCount = repeatCount + 1;
    setCountsMap((prev) => ({ ...prev, [index]: newCount }));

    // Pulse animation on each tap
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    // Auto-advance when count reached
    if (newCount >= maxRepeat) {
      // Double vibration to signal completion
      Vibration.vibrate([0, 100, 50, 100]);

      // Auto-advance after brief delay so user sees the checkmark
      if (index < total - 1) {
        setTimeout(() => {
          setIndex((prev) => prev + 1);
        }, 600);
      }
    }
  }, [isCompleted, repeatCount, maxRepeat, index, total, pulseAnim]);

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

  // Navigation repeat ring
  const ringSize = 100;
  const ringStroke = 6;
  const ringR = (ringSize - ringStroke) / 2;
  const ringC = 2 * Math.PI * ringR;
  const repProgress = maxRepeat > 0 ? Math.min(1, repeatCount / maxRepeat) : 0;
  const ringDash = repProgress * ringC;

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
            <Pressable onPress={toggleAudio} hitSlop={10} style={[s.playBtn, isDownloading && s.playBtnDownloading]}>
              {isDownloading ? (
                <Text style={s.downloadPct}>{downloadPct}%</Text>
              ) : (
                <Ionicons name={isPlaying ? "pause" : "play"} size={16} color="#FFF" />
              )}
            </Pressable>
            {!audioCached && audioFile ? (
              <Ionicons name="cloud-download-outline" size={14} color={SECONDARY} style={{ marginLeft: -2 }} />
            ) : null}
            <View style={s.toolSpacer} />
            <Pressable onPress={() => adjustFont(-2)} hitSlop={10} style={s.toolBtn}>
              <Text style={s.toolText}>أ-</Text>
            </Pressable>
            <Pressable onPress={() => adjustFont(2)} hitSlop={10} style={s.toolBtn}>
              <Text style={s.toolTextLg}>أ+</Text>
            </Pressable>
          </View>

          {/* Dhikr text - tap to count */}
          <Pressable onPress={onCount}>
            <Text style={[s.dhikrText, { fontSize, lineHeight: fontSize * 1.9 }]}>
              {current?.text ?? ""}
            </Text>
          </Pressable>

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

        {/* Navigation with repeat counter ring */}
        <View style={s.navRow}>
          <Pressable
            style={[s.navBtn, s.navPrev, index <= 0 && s.navDisabled]}
            onPress={goPrev}
            disabled={index <= 0}
          >
            <Ionicons name="arrow-forward" size={18} color={index <= 0 ? "#C8B99A" : GOLD} />
            <Text style={[s.navPrevText, index <= 0 && s.navDisabledText]}>السابق</Text>
          </Pressable>

          {/* Repeat counter ring - tap to count */}
          <Pressable onPress={onCount} style={s.navRing}>
            <Svg width={ringSize} height={ringSize}>
              <Circle cx={ringSize / 2} cy={ringSize / 2} r={ringR} stroke="#E5E0D6" strokeWidth={ringStroke} fill="none" />
              <Circle cx={ringSize / 2} cy={ringSize / 2} r={ringR}
                stroke={isCompleted ? GREEN : GOLD}
                strokeWidth={ringStroke} fill="none" strokeLinecap="round"
                strokeDasharray={`${ringDash} ${ringC - ringDash}`}
                rotation={-90} originX={ringSize / 2} originY={ringSize / 2}
              />
            </Svg>
            <View style={s.navRingInner}>
              {isCompleted ? (
                <Ionicons name="checkmark-circle" size={36} color={GREEN} />
              ) : (
                <>
                  <Text style={s.navRingNum}>{repeatCount}</Text>
                  <Text style={s.navRingSub}>من {maxRepeat}</Text>
                </>
              )}
            </View>
          </Pressable>

          <Pressable
            style={[s.navBtn, s.navNext, index >= total - 1 && s.navDisabled]}
            onPress={goNext}
            disabled={index >= total - 1}
          >
            <Text style={[s.navNextText, index >= total - 1 && s.navDisabledText]}>التالي</Text>
            <Ionicons name="arrow-back" size={18} color={index >= total - 1 ? "#FFF" : "#FFF"} />
          </Pressable>
        </View>

        {/* Position indicator */}
        <Text style={s.positionText}>{currentNumber} من {total}</Text>

        {/* Tap anywhere hint + spacer */}
        <Pressable onPress={onCount} style={s.tapSpacer}>
          <Text style={s.hintText}>المس في أي مكان للعد</Text>
        </Pressable>
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
  playBtnDownloading: {
    backgroundColor: SECONDARY,
  },
  downloadPct: {
    fontFamily: "CairoBold", fontSize: 9, color: "#FFF",
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

  /* Navigation */
  navRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 10,
  },
  positionText: {
    fontFamily: "Cairo", fontSize: 12, color: SECONDARY,
    textAlign: "center", marginTop: 8,
  },
  tapSpacer: {
    flex: 1, minHeight: 120,
    alignItems: "center", justifyContent: "center",
    paddingTop: 20,
  },
  hintText: {
    fontFamily: "Cairo", fontSize: 13, color: SECONDARY,
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
