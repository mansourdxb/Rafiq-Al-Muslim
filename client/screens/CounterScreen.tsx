import React, { useMemo } from "react";

import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Share,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";

import { useApp } from "@/context/AppContext";
import { typography } from "@/theme/typography";

const AR_TITLE: Record<string, string> = {
  "Allahu Akbar": "تكبير",
  SubhanAllah: "تسبيح",
  Alhamdulillah: "تحميد",
  "La ilaha illa Allah": "تهليل",
  Astaghfirullah: "استغفار",
};

const AR_TEXT: Record<string, string> = {
  "Allahu Akbar": "الله أكبر الله أكبر",
  SubhanAllah: "سبحان الله",
  Alhamdulillah: "الحمد لله",
  "La ilaha illa Allah": "لا إله إلا الله",
  Astaghfirullah: "أستغفر الله",
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export default function CounterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();

  const {
    currentPreset,
    increment,
    reset,
    deletePreset,
  } = useApp();

  // Mobile-first container width (helps web look like a phone)
  const maxW = 430;
  const contentWidth = Math.min(width, maxW);

  const name = currentPreset?.name ?? "SubhanAllah";
  const title = AR_TITLE[name] ?? name;
  const dhikrText = currentPreset?.text || AR_TEXT[name] || "";

  const count = currentPreset?.count ?? 0;
  const target = currentPreset?.target ?? 33;
  const countDisplay = Number(count).toLocaleString("en-US");
  const targetDisplay = Number(target).toLocaleString("en-US");

  const pct = clamp01(target > 0 ? count / target : 0);

  const ring = useMemo(() => {
    const size = 260;
    const stroke = 18;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = c * pct;
    return { size, stroke, r, c, dash };
  }, [pct]);

  const goToPresets = () => {
    navigation.goBack();
  };

  const onClose = () => {
    goToPresets();
  };

  const onShare = async () => {
    try {
      const msg = `${title}\n${dhikrText ? dhikrText + "\n" : ""}${countDisplay} / ${targetDisplay}`;
      await Share.share({ message: msg });
    } catch {}
  };

  const onTrash = () => {
    if (!currentPreset) return;

    const isBuiltIn = Boolean((currentPreset as any).isBuiltIn);

    if (!isBuiltIn) {
      // Logic for Custom Presets (Delete)
      if (Platform.OS === "web") {
        const confirmed = window.confirm("هل تريد حذف هذا الذكر؟");
        if (confirmed) {
          deletePreset(currentPreset.id);
          goToPresets();
        }
      } else {
        Alert.alert(
          "حذف الذكر",
          "هل تريد حذف هذا الذكر؟",
          [
            { text: "إلغاء", style: "cancel" },
            {
              text: "حذف",
              style: "destructive",
              onPress: () => {
                deletePreset(currentPreset.id);
                goToPresets();
              },
            },
          ],
          { cancelable: true }
        );
      }
    } else {
      // Logic for Built-in Presets (Reset only)
      if (Platform.OS === "web") {
        const confirmed = window.confirm("هل تريد تصفير العدّاد؟");
        if (confirmed) reset();
      } else {
        Alert.alert(
          "تصفير العدّاد",
          "هل تريد تصفير العدّاد؟",
          [
            { text: "إلغاء", style: "cancel" },
            {
              text: "تصفير",
              style: "destructive",
              onPress: () => reset(),
            },
          ],
          { cancelable: true }
        );
      }
    }
  };

  const onReset = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("هل تريد تصفير العدّاد؟");
      if (confirmed) reset();
      return;
    }

    Alert.alert(
      "تصفير العدّاد",
      "هل تريد تصفير العدّاد؟",
      [
        { text: "إلغاء", style: "cancel" },
        { text: "تصفير", style: "destructive", onPress: () => reset() },
      ],
      { cancelable: true }
    );
  };

  const handleTap = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    increment();
  };

  const headerColor = "#1B4332";
  const gold = "#D4AF37";
  const textColor = "#1F3D2C";
  const secondaryTextColor = "#6C7A73";
  const ringBackgroundColor = "#E5E6E0";
  const ringTrackColor = "#F3F1EA";

  return (
    <View style={[styles.root, { backgroundColor: "#F8F4EC" }]}>
      <View style={[styles.pageBg, { backgroundColor: "#F8F4EC" }]} />

      <View style={[styles.phone, { width: contentWidth }]}>
        <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: headerColor }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Pressable
                onPress={onReset}
                style={({ pressed }) => [styles.hIconBtn, pressed && { opacity: 0.7 }]}
                hitSlop={10}
              >
                <Feather name="rotate-ccw" size={22} color={gold} />
              </Pressable>

              <Pressable
                onPress={onTrash}
                style={({ pressed }) => [styles.hIconBtn, pressed && { opacity: 0.7 }]}
                hitSlop={10}
              >
                <Feather name="trash-2" size={22} color={gold} />
              </Pressable>

              <Pressable
                onPress={onShare}
                style={({ pressed }) => [styles.hIconBtn, pressed && { opacity: 0.7 }]}
                hitSlop={10}
              >
                <Feather name="share-2" size={22} color={gold} />
              </Pressable>
            </View>

            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>

            <View style={styles.headerRight}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.hIconBtn, pressed && { opacity: 0.7 }]}
                hitSlop={10}
              >
                <Feather name="x" size={24} color={gold} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.dhikrText, { color: textColor }]} numberOfLines={2}>
            {dhikrText || " "}
          </Text>
          <View style={styles.divider} />

          <Pressable
            onPress={handleTap}
            style={({ pressed }) => [styles.ringWrap, pressed && { transform: [{ scale: 0.99 }] }]}
          >
            <Svg width={ring.size} height={ring.size}>
              <Circle
                cx={ring.size / 2}
                cy={ring.size / 2}
                r={ring.r + 12}
                stroke={ringTrackColor}
                strokeWidth={ring.stroke}
                fill="none"
              />
              <Circle
                cx={ring.size / 2}
                cy={ring.size / 2}
                r={ring.r}
                stroke={ringBackgroundColor}
                strokeWidth={ring.stroke}
                fill="none"
              />
              <Circle
                cx={ring.size / 2}
                cy={ring.size / 2}
                r={ring.r}
                stroke={gold}
                strokeWidth={ring.stroke}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${ring.dash} ${ring.c - ring.dash}`}
                rotation={-90}
                originX={ring.size / 2}
                originY={ring.size / 2}
              />
            </Svg>

            <View style={styles.centerText}>
              <Text style={[styles.big, { color: textColor }]}>{countDisplay}</Text>
              <View style={styles.targetPill}>
                <Text style={[styles.from, { color: secondaryTextColor }]}>من {targetDisplay}</Text>
              </View>
            </View>
          </Pressable>

          <View style={styles.hintRow}>
            <Text style={styles.hintText}>المس للعد</Text>
            <Feather name="mouse-pointer" size={16} color="#8D998F" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pageBg: { ...StyleSheet.absoluteFillObject },
  phone: {
    flex: 1,
    alignSelf: "center",
  },
  header: {
    width: "100%",
    paddingBottom: 26,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  hIconBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null),
  },
  headerTitle: {
    ...typography.screenTitle,
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  dhikrText: {
    ...typography.itemSubtitle,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  divider: {
    width: 56,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#E2C97B",
    marginBottom: 18,
  },
  ringWrap: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null),
  },
  centerText: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  big: {
    ...typography.numberText,
    fontSize: 56,
    fontWeight: "900",
    lineHeight: 62,
  },
  targetPill: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F0EEE6",
  },
  from: {
    ...typography.numberText,
    fontSize: 16,
    fontWeight: "700",
  },
  hintRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hintText: {
    ...typography.itemSubtitle,
    fontSize: 14,
    fontWeight: "600",
    color: "#8D998F",
  },
});
