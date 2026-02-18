import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  I18nManager,
  Platform,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import tzLookup from "tz-lookup";

import type { City, PrayerSettings } from "@/screens/qibla/services/preferences";
import { getPrayerSettings, getSelectedCity, setSelectedCity, setPrayerSettings } from "@/screens/qibla/services/preferences";
import { getAthanPrefs, type AthanMode, type AthanPrefs } from "@/screens/qibla/services/athanPrefs";
import CityPickerModal from "@/screens/qibla/components/CityPickerModal";
import AnalogClock from "@/components/AnalogClock";
import {
  computePrayerTimes,
  formatTimeInTZ,
  getRecommendedMethod,
  type PrayerName,
  type PrayerTimesResult,
} from "@/screens/qibla/services/prayerTimes";
import { getCityFromGPS } from "@/screens/qibla/services/cityService";
import {
  cancelAllPrayerNotifications,
  initPrayerNotifications,
  schedulePrayerNotifications,
  scheduleTestNotification,
} from "@/src/services/prayerNotifications";

function pad2(v: number) {
  return String(v).padStart(2, "0");
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(Math.abs(ms) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getYMDInTZ(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getTimePartsInTZ(date: Date, timeZone?: string | null) {
  if (!timeZone) {
    return {
      hours: date.getHours(),
      minutes: date.getMinutes(),
      seconds: date.getSeconds(),
    };
  }
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    dtf
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  );
  return {
    hours: Number(parts.hour ?? 0),
    minutes: Number(parts.minute ?? 0),
    seconds: Number(parts.second ?? 0),
  };
}

function getCityOnlyLabel(city: City | null) {
  if (!city?.name) return "اختر مدينة";
  const name = city.name.split(",")[0]?.trim();
  return name || "اختر مدينة";
}

const COLORS = {
  header: "#799F84",
  headerLight: "#8EB098",
  background: "#FDFCF7",
  primary: "#B4945C",
  secondary: "#799F84",
  card: "#FFFFFF",
  divider: "#EEE8DA",
  text: "#2E2F2E",
  textMuted: "#8C8C8C",
  toggleTrack: "#E6E0D4",
  toggleThumb: "#FFFFFF",
  activeRowBg: "rgba(180, 148, 92, 0.12)",
};

const PRAYER_LABELS: Record<PrayerName, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

const CLOCK_VARIANTS = ["mint", "minimal", "classic", "arabic", "roman", "sky", "ring", "graphite", "ottoman", "andalusi", "mihrab", "zellige", "kaaba", "crescent"] as const;
type ClockVariant = (typeof CLOCK_VARIANTS)[number];

const CLOCK_FACE_OPTIONS: Array<{ key: ClockVariant; label: string }> = [
  { key: "mint", label: "\u0646\u0639\u0646\u0627\u0639" },
  { key: "minimal", label: "\u0628\u0633\u064a\u0637" },
  { key: "classic", label: "\u0643\u0644\u0627\u0633\u064a\u0643" },
  { key: "arabic", label: "\u0623\u0631\u0642\u0627\u0645 \u0639\u0631\u0628\u064a\u0629" },
  { key: "roman", label: "\u0623\u0631\u0642\u0627\u0645 \u0631\u0648\u0645\u0627\u0646\u064a\u0629" },
  { key: "sky", label: "\u0623\u0632\u0631\u0642 \u0633\u0645\u0627\u0648\u064a" },
  { key: "ring", label: "\u0623\u0632\u0631\u0642 \u0645\u0639 \u062d\u0644\u0642\u0629" },
  { key: "graphite", label: "\u062c\u0631\u0627\u0641\u064a\u062a" },
  { key: "ottoman", label: "عثماني" },
  { key: "andalusi", label: "أندلسي" },
  { key: "mihrab", label: "محراب" },
  { key: "zellige", label: "زليج" },
  { key: "kaaba", label: "الكعبة" },
  { key: "crescent", label: "هلال" },
];

const CLOCK_VARIANT_KEY = "prayerClock:variant";
const CLOCK_FACES = CLOCK_FACE_OPTIONS;
const CLOCK_SIZE = 170;
const HALO_SIZE = Math.round(CLOCK_SIZE * 1.28);
const HALO2 = Math.round(CLOCK_SIZE * 1.1);
const FACE_ITEM_W = 86;
const FACE_ITEM_GAP = 10;
const FACE_ITEM_SNAP = FACE_ITEM_W + FACE_ITEM_GAP;
const CLOCK_HINT_OPEN = "\u0627\u0636\u063a\u0637 \u0644\u062a\u063a\u064a\u064a\u0631 \u0634\u0643\u0644 \u0627\u0644\u0633\u0627\u0639\u0629";
const CLOCK_HINT_CLOSE = "\u0625\u062e\u0641\u0627\u0621 \u0623\u0634\u0643\u0627\u0644 \u0627\u0644\u0633\u0627\u0639\u0629";

export default function SalatukPrayerTimesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tabBarHeight = insets.bottom;
  const [city, setCity] = useState<City | null>(null);
  const [loadingCity, setLoadingCity] = useState(false);
  const [settings, setSettings] = useState<PrayerSettings | null>(null);
  const [times, setTimes] = useState<PrayerTimesResult | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [athanPrefs, setAthanPrefs] = useState<AthanPrefs | null>(null);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [clockFace, setClockFace] = useState<ClockVariant>("mint");
  const [facePickerOpen, setFacePickerOpen] = useState(false);
  const faceListRef = useRef<FlatList<any>>(null);
  const [faceIndex, setFaceIndex] = useState(0);
  const openFacePicker = () => setFacePickerOpen(true);
  const toggleFacePicker = () => setFacePickerOpen((v) => !v);
  const closeFacePicker = () => setFacePickerOpen(false);
  const openCityPicker = () => setIsCityPickerOpen(true);
  const closeCityPicker = () => setIsCityPickerOpen(false);

  const contentWidth = Math.min(width, 430);
  const topPad = useMemo(() => insets.top + 8, [insets.top]);
  const tz = useMemo(
    () => (city ? tzLookup(city.lat, city.lon) : null),
    [city?.lat, city?.lon]
  );
  const scrollStyle = useMemo(
    () => (Platform.OS === "web" ? ({ overflowY: "auto" } as any) : undefined),
    []
  );

  const refreshFromStorage = React.useCallback(async () => {
    setLoadingCity(true);
    try {
      const [savedCity, savedSettings] = await Promise.all([
        getSelectedCity(),
        getPrayerSettings(),
      ]);

      let resolvedCity = savedCity;
      let resolvedSettings = savedSettings;

      if (!resolvedCity) {
        try {
          const gpsCity = await getCityFromGPS();
          await setSelectedCity(gpsCity);
          resolvedCity = gpsCity;
          // First-time GPS detection: auto-select best method for this region
          const recommended = getRecommendedMethod(
            gpsCity.country,
            gpsCity.lat,
            gpsCity.lon
          );
          resolvedSettings = { ...savedSettings, method: recommended };
          await setPrayerSettings({ method: recommended });
        } catch {
          resolvedCity = null;
        }
      }

      setSettings(resolvedSettings);
      setCity(resolvedCity);
    } finally {
      setLoadingCity(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void refreshFromStorage();
    }, [refreshFromStorage])
  );

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      getAthanPrefs().then((prefs) => {
        if (active) setAthanPrefs(prefs);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  useEffect(() => {
    let lastDate = new Date().getDate();
    const timer = setInterval(() => {
      const now = new Date();
      setNowMs(now.getTime());

      // Check if day changed (midnight passed)
      if (now.getDate() !== lastDate) {
        lastDate = now.getDate();
        // Update to current date to trigger prayer time recalculation
        setSelectedDate(new Date());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(CLOCK_VARIANT_KEY).then((stored) => {
      if (!active || !stored) return;
      if (CLOCK_VARIANTS.includes(stored as ClockVariant)) {
        setClockFace(stored as ClockVariant);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(CLOCK_VARIANT_KEY, clockFace);
  }, [clockFace]);

  useEffect(() => {
    const idx = CLOCK_FACES.findIndex((face) => face.key === clockFace);
    if (idx >= 0) setFaceIndex(idx);
  }, [clockFace]);

  useEffect(() => {
    if (!city || !settings) {
      setTimes(null);
      return;
    }
    const computed = computePrayerTimes({
      city: { lat: city.lat, lon: city.lon, tz: city.tz },
      settings,
      date: selectedDate,
      timeZone: tz ?? undefined,
    });
    setTimes(computed);
  }, [city?.lat, city?.lon, city?.tz, settings, selectedDate, tz]);

  useEffect(() => {
    void (async () => {
      if (!settings?.notificationsEnabled) {
        await cancelAllPrayerNotifications();
        return;
      }
      if (!city || !times) {
        await cancelAllPrayerNotifications();
        return;
      }
      const ok = await initPrayerNotifications();
      if (!ok) return;
      await schedulePrayerNotifications({
        prayerTimes: {
          fajr: times.fajr,
          dhuhr: times.dhuhr,
          asr: times.asr,
          maghrib: times.maghrib,
          isha: times.isha,
        },
        cityName: city.name,
        tz,
      });
    })();
  }, [
    city?.lat,
    city?.lon,
    city?.tz,
    settings?.method,
    settings?.madhab,
    settings?.adjustments,
    settings?.notificationsEnabled,
    times,
    tz,
  ]);

  const handleCitySelect = async (selected: City) => {
    setCity(selected);
    await setSelectedCity(selected);
    // Reset to today when switching cities so next prayer / countdown work
    const today = new Date();
    setSelectedDate(today);
    if (settings) {
      // Auto-select the best calculation method for this city's region
      const recommended = getRecommendedMethod(
        selected.country,
        selected.lat,
        selected.lon
      );
      const updatedSettings = { ...settings, method: recommended };
      setSettings(updatedSettings);
      await setPrayerSettings({ method: recommended });

      const computed = computePrayerTimes({
        city: { lat: selected.lat, lon: selected.lon, tz: selected.tz },
        settings: updatedSettings,
        date: today,
        timeZone: tzLookup(selected.lat, selected.lon),
      });
      setTimes(computed);
    }
    setIsCityPickerOpen(false);
  };

  const cityLabel = getCityOnlyLabel(city);
  const subtitle =
    city?.source === "manual"
      ? "الموقع مثبت يدوياً"
      : city?.source === "gps"
        ? "تم تحديد الموقع تلقائياً"
        : loadingCity
          ? "جارٍ تحديد المدينة..."
          : "الموقع غير محدد";

  const isFriday = selectedDate.getDay() === 5;
  const rows: Array<{ key: PrayerName; label: string; time?: Date }> = [
    { key: "Fajr", label: "الفجر", time: times?.fajr },
    { key: "Sunrise", label: "الشروق", time: times?.sunrise },
    { key: "Dhuhr", label: isFriday ? "الجمعة" : "الظهر", time: times?.dhuhr },
    { key: "Asr", label: "العصر", time: times?.asr },
    { key: "Maghrib", label: "المغرب", time: times?.maghrib },
    { key: "Isha", label: "العشاء", time: times?.isha },
  ];

  const isToday = tz
    ? getYMDInTZ(selectedDate, tz) === getYMDInTZ(new Date(), tz)
    : isSameDay(selectedDate, new Date());
  const nextPrayer = isToday ? times?.nextPrayerName : null;
  const countdown =
    isToday && times
      ? formatCountdown(times.nextPrayerTime.getTime() - Date.now())
      : "--:--:--";
  const nextPrayerLabel = nextPrayer ? PRAYER_LABELS[nextPrayer] : "—";

  const timeParts = useMemo(
    () => getTimePartsInTZ(new Date(nowMs), tz),
    [nowMs, tz]
  );

  const modeForPrayer = (key: PrayerName): AthanMode =>
    athanPrefs?.[key as keyof AthanPrefs]?.mode ?? "sound";

  const goToFace = (idx: number) => {
    const clamped = Math.max(0, Math.min(CLOCK_FACES.length - 1, idx));
    setFaceIndex(clamped);
    setClockFace(CLOCK_FACES[clamped].key);
    requestAnimationFrame(() => {
      faceListRef.current?.scrollToIndex({
        index: clamped,
        animated: true,
        viewPosition: 0.5,
      });
    });
  };

  const openAthanSettings = () => {
    const parent = navigation.getParent?.();
    if (parent?.navigate) {
      parent.navigate("SalatukAthanSettings");
      return;
    }
    navigation.navigate("SalatukAthanSettings");
  };

  const dayName = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("ar-EG", {
      weekday: "long",
      timeZone: tz ?? undefined,
    });
    return formatter.format(selectedDate);
  }, [selectedDate, tz]);
  const hijriDate = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: tz ?? undefined,
    });
    return formatter.format(selectedDate);
  }, [selectedDate, tz]);
  const gregDate = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: tz ?? undefined,
    });
    return formatter.format(selectedDate);
  }, [selectedDate, tz]);


  const countdownParts = useMemo(() => {
    const raw = countdown;
    const parts = raw.split(":");
    return { h: parts[0] ?? "--", m: parts[1] ?? "--", s: parts[2] ?? "--" };
  }, [countdown]);

  const nextPrayerTime = useMemo(() => {
    if (!nextPrayer || !times || !tz) return "";
    const keyMap: Record<string, string> = {
      Fajr: "fajr", Sunrise: "sunrise", Dhuhr: "dhuhr",
      Asr: "asr", Maghrib: "maghrib", Isha: "isha",
    };
    const t = times[keyMap[nextPrayer] as keyof PrayerTimesResult] as Date | undefined;
    if (!t) return "";
    return formatTimeInTZ(t, tz, "ar");
  }, [nextPrayer, times, tz]);


  return (
    <>
      <View style={styles.root}>
        <ScrollView
          style={[{ flex: 1, width: "100%" }, scrollStyle]}
          contentContainerStyle={{ alignItems: "center", paddingBottom: tabBarHeight + 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Header ─── */}
          <LinearGradient
            colors={["#5A8F6A", "#79A688", "#8EB89C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: topPad }]}
          >
            <View style={[styles.headerInner, { width: contentWidth }]}>
              <View style={styles.headerSpacer} />
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>مواقيت الصلاة</Text>
                <Pressable onPress={openCityPicker} hitSlop={8} style={styles.headerLocationRow}>
                  <Ionicons name="location" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.headerLocationText}>{cityLabel}</Text>
                </Pressable>
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </LinearGradient>

          <View style={[styles.body, { width: contentWidth }]}>
            {/* ─── Hero Card: Next Prayer + Clock ─── */}
            <View style={styles.heroCard}>
              <View style={styles.heroInner}>
                {/* Text side (right in RTL) */}
                <View style={styles.heroLeft}>
                  <Text style={styles.heroLabel}>الصلاة القادمة</Text>
                  <Text style={styles.heroPrayerName}>{nextPrayerLabel}</Text>
                  <Text style={styles.heroTime}>{nextPrayerTime || "--:--"}</Text>
                  {/* Countdown - force LTR so digits read H:M:S left-to-right */}
                  <View style={styles.countdownWrap}>
                    <View style={[styles.countdownDigitsRow, { flexDirection: I18nManager.isRTL ? "row-reverse" : "row" }]}>
                      <View style={styles.countdownDigitBox}>
                        <Text style={styles.countdownDigit}>{countdownParts.h}</Text>
                      </View>
                      <Text style={styles.countdownSep}>:</Text>
                      <View style={styles.countdownDigitBox}>
                        <Text style={styles.countdownDigit}>{countdownParts.m}</Text>
                      </View>
                      <Text style={styles.countdownSep}>:</Text>
                      <View style={styles.countdownDigitBox}>
                        <Text style={styles.countdownDigit}>{countdownParts.s}</Text>
                      </View>
                    </View>
                    <View style={[styles.countdownLabelsRow, { flexDirection: I18nManager.isRTL ? "row-reverse" : "row" }]}>
                      <Text style={styles.countdownLabelText}>ساعة</Text>
                      <Text style={styles.countdownLabelText}>دقيقة</Text>
                      <Text style={styles.countdownLabelText}>ثانية</Text>
                    </View>
                  </View>
                </View>
                {/* Clock side (left in RTL) */}
                <Pressable onPress={toggleFacePicker} hitSlop={12} style={styles.heroRight}>
                  <AnalogClock
                    size={120}
                    hours={timeParts.hours}
                    minutes={timeParts.minutes}
                    seconds={timeParts.seconds}
                    variant={clockFace}
                    accent={COLORS.primary}
                  />
                </Pressable>
              </View>
            </View>

            {/* ─── Clock Face Picker (collapsible) ─── */}
            {facePickerOpen && (
              <View style={styles.faceSliderWrap}>
                <View style={styles.faceSliderRow}>
                  <Pressable
                    onPress={() => goToFace(faceIndex - 1)}
                    disabled={faceIndex === 0}
                    style={[styles.faceArrowBtn, styles.faceArrowLeft, faceIndex === 0 && styles.faceArrowDisabled]}
                    accessibilityRole="button"
                    accessibilityLabel="السابق"
                    hitSlop={12}
                  >
                    <Feather name="chevron-left" size={18} color={COLORS.primary} />
                  </Pressable>
                  <View style={styles.faceSliderCenter}>
                    <FlatList
                      ref={faceListRef}
                      data={CLOCK_FACES}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 12, gap: FACE_ITEM_GAP }}
                      keyExtractor={(i) => i.key}
                      snapToInterval={FACE_ITEM_SNAP}
                      decelerationRate="fast"
                      onMomentumScrollEnd={(e) => {
                        const x = e.nativeEvent.contentOffset.x;
                        const idx = Math.round(x / FACE_ITEM_SNAP);
                        if (CLOCK_FACES[idx]) {
                          setFaceIndex(idx);
                          setClockFace(CLOCK_FACES[idx].key);
                        }
                      }}
                      renderItem={({ item, index }) => {
                        const active = item.key === clockFace;
                        return (
                          <Pressable
                            onPress={() => { setClockFace(item.key); setFaceIndex(index); closeFacePicker(); }}
                            style={[styles.clockCarouselItem, active && styles.clockCarouselItemActive]}
                          >
                            <AnalogClock size={56} hours={timeParts.hours} minutes={timeParts.minutes} seconds={timeParts.seconds} variant={item.key} accent={COLORS.primary} />
                            <Text style={[styles.clockCarouselLabel, active && styles.clockCarouselLabelActive]}>{item.label}</Text>
                          </Pressable>
                        );
                      }}
                    />
                  </View>
                  <Pressable
                    onPress={() => goToFace(faceIndex + 1)}
                    disabled={faceIndex === CLOCK_FACES.length - 1}
                    style={[styles.faceArrowBtn, styles.faceArrowRight, faceIndex === CLOCK_FACES.length - 1 && styles.faceArrowDisabled]}
                    accessibilityRole="button"
                    accessibilityLabel="التالي"
                    hitSlop={12}
                  >
                    <Feather name="chevron-right" size={18} color={COLORS.primary} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* ─── Date Row ─── */}
            <View style={styles.dateRow}>
              <Pressable
                onPress={() => setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1))}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={styles.dateArrow}
              >
                <Feather name={I18nManager.isRTL ? "chevron-right" : "chevron-left"} size={18} color={COLORS.secondary} />
              </Pressable>
              <View style={styles.dateCenter}>
                <Text style={styles.hijriDate}>{hijriDate}</Text>
                <Text style={styles.gregDate}>{dayName}، {gregDate}</Text>
              </View>
              <Pressable
                onPress={() => setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1))}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={styles.dateArrow}
              >
                <Feather name={I18nManager.isRTL ? "chevron-left" : "chevron-right"} size={18} color={COLORS.secondary} />
              </Pressable>
            </View>

            {/* ─── Quick Actions ─── */}
            <View style={styles.quickActions}>
              {[
                { key: "world", label: "مدن العالم", icon: "globe", tint: COLORS.primary },
                { key: "qibla", label: "إتجاه القبلة", icon: "compass", tint: COLORS.secondary },
                { key: "mosques", label: "المساجد القريبة", icon: "home", tint: COLORS.primary },
                { key: "times", label: "إعدادات التوقيت", icon: "clock", tint: COLORS.secondary },
              ].map((item) => (
                <Pressable
                  key={item.key}
                  style={styles.quickCard}
                  onPress={() => {
                    if (item.key === "world") navigation.navigate("WorldCities");
                    if (item.key === "qibla") navigation.navigate("QiblaDirection");
                    if (item.key === "times") navigation.navigate("PrayerSettings");
                    if (item.key === "mosques") navigation.navigate("MasjidsComingSoon");
                  }}
                >
                  <View style={[styles.quickIconWrap, { backgroundColor: `${item.tint}14` }]}>
                    <Feather name={item.icon as any} size={16} color={item.tint} />
                  </View>
                  <Text style={styles.quickLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* ─── Prayer Times List ─── */}
            <View style={styles.list}>
              {rows.map((row, index) => {
                const isNext = row.key === nextPrayer;
                const isPast = isToday && times && row.time && row.time.getTime() < nowMs && !isNext;
                const timeText = row.time && tz ? formatTimeInTZ(row.time, tz, "ar") : "--:--";
                const mode = modeForPrayer(row.key);
                const isEnabled = mode !== "mute";
                return (
                  <View
                    key={row.key}
                    style={[
                      styles.listRow,
                      isNext && styles.listRowActive,
                      isPast ? styles.listRowPast : null,
                    ]}
                  >
                    <View style={styles.nameCol}>
                      {isNext && <View style={styles.activeDot} />}
                      <Text style={[styles.nameText, isNext && styles.nameTextActive]}>
                        {row.label}
                      </Text>
                    </View>
                    <Text style={[styles.timeText, isNext && styles.timeTextActive]}>
                      {timeText}
                    </Text>
                    <Pressable
                      onPress={openAthanSettings}
                      hitSlop={6}
                      style={[styles.soundBtn, isNext && styles.soundBtnActive]}
                      accessibilityRole="button"
                      accessibilityLabel={isEnabled ? `إيقاف صوت ${row.label}` : `تفعيل صوت ${row.label}`}
                    >
                      <Ionicons
                        name={isEnabled ? "volume-high" : "volume-mute"}
                        size={20}
                        color={isNext ? "#FFFFFF" : isEnabled ? COLORS.secondary : COLORS.textMuted}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>

      <CityPickerModal
        visible={isCityPickerOpen}
        onClose={closeCityPicker}
        onSelect={handleCitySelect}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  /* ─── Header ─── */
  header: {
    width: "100%",
    paddingBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  headerInner: {
    minHeight: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "CairoBold",
    fontSize: 19,
    color: "#FFFFFF",
  },
  headerLocationRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    marginTop: -2,
  },
  headerLocationText: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  headerSpacer: {
    width: 28,
  },
  /* ─── Body ─── */
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    alignItems: "center",
  },
  /* ─── Hero Card ─── */
  heroCard: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  heroInner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: 18,
    paddingLeft: 14,
    paddingRight: 18,
    gap: 14,
  },
  heroLeft: {
    flex: 1,
    alignItems: "flex-end",
  },
  heroLabel: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: COLORS.textMuted,
  },
  heroPrayerName: {
    fontFamily: "CairoBold",
    fontSize: 30,
    color: COLORS.text,
    lineHeight: 40,
    marginTop: -2,
  },
  heroTime: {
    fontFamily: "CairoBold",
    fontSize: 20,
    color: COLORS.secondary,
    fontVariant: ["tabular-nums"],
    marginTop: 0,
    marginBottom: 8,
  },
  heroRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  /* ─── Countdown ─── */
  countdownWrap: {
    alignItems: "flex-end",
    gap: 3,
  },
  countdownDigitsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  countdownDigitBox: {
    backgroundColor: "rgba(61,92,68,0.06)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 34,
    alignItems: "center",
  },
  countdownDigit: {
    fontFamily: "CairoBold",
    fontSize: 20,
    color: COLORS.text,
    fontVariant: ["tabular-nums"],
  },
  countdownSep: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: COLORS.textMuted,
    marginHorizontal: 1,
  },
  countdownLabelsRow: {
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 4,
  },
  countdownLabelText: {
    fontFamily: "Cairo",
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: "center",
    minWidth: 34,
  },
  /* ─── Date Row ─── */
  dateRow: {
    width: "100%",
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateCenter: {
    flex: 1,
    alignItems: "center",
  },
  dateArrow: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(61,92,68,0.10)",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  hijriDate: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: COLORS.secondary,
  },
  gregDate: {
    fontFamily: "Cairo",
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: -1,
  },
  /* ─── Quick Actions ─── */
  quickActions: {
    width: "100%",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 8,
  },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    gap: 4,
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontFamily: "CairoBold",
    fontSize: 10,
    color: COLORS.text,
    textAlign: "center",
  },
  /* ─── Prayer List ─── */
  list: {
    width: "100%",
    marginTop: 12,
    gap: 6,
  },
  listRow: {
    height: 54,
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  listRowActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  listRowPast: {
    opacity: 0.4,
  },
  nameCol: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    width: 90,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#B8D4A0",
  },
  nameText: {
    textAlign: "right",
    fontFamily: "CairoBold",
    fontSize: 16,
    color: COLORS.text,
  },
  nameTextActive: {
    color: "#FFFFFF",
  },
  timeText: {
    flex: 1,
    textAlign: "center",
    fontFamily: "CairoBold",
    fontSize: 17,
    color: COLORS.text,
    fontVariant: ["tabular-nums"],
  },
  timeTextActive: {
    color: "rgba(255,255,255,0.9)",
  },
  divider: {
    height: 0,
  },
  soundBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(61,92,68,0.04)",
    borderWidth: 1,
    borderColor: "rgba(61,92,68,0.06)",
  },
  soundBtnActive: {
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  /* ─── Clock Face Picker ─── */
  faceSliderWrap: {
    width: "100%",
    marginTop: 8,
    marginBottom: 4,
    minHeight: 110,
  },
  faceSliderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  faceSliderCenter: {
    flex: 1,
  },
  faceArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  faceArrowLeft: {
    marginRight: 8,
  },
  faceArrowRight: {
    marginLeft: 8,
  },
  faceArrowDisabled: {
    opacity: 0.35,
  },
  clockCarouselItem: {
    width: FACE_ITEM_W,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EFE8D8",
    backgroundColor: "#FFFFFF",
  },
  clockCarouselItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(180, 148, 92, 0.08)",
    transform: [{ scale: 1.03 }],
  },
  clockCarouselLabel: {
    marginTop: 6,
    fontFamily: "CairoBold",
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  clockCarouselLabelActive: {
    color: COLORS.primary,
  },
});