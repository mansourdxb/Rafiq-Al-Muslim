import React, { useEffect, useMemo, useState } from "react";
import {
  I18nManager,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import tzLookup from "tz-lookup";

import type { City, PrayerSettings } from "@/screens/qibla/services/preferences";
import { getPrayerSettings, getSelectedCity, setSelectedCity } from "@/screens/qibla/services/preferences";
import { getAthanPrefs, type AthanMode, type AthanPrefs } from "@/screens/qibla/services/athanPrefs";
import CityPickerModal from "@/screens/qibla/components/CityPickerModal";
import {
  computePrayerTimes,
  formatTimeInTZ,
  type PrayerName,
  type PrayerTimesResult,
} from "@/screens/qibla/services/prayerTimes";
import { getCityFromGPS } from "@/screens/qibla/services/cityService";

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
      setSettings(savedSettings);

      let resolvedCity = savedCity;
      if (!resolvedCity) {
        try {
          const gpsCity = await getCityFromGPS();
          await setSelectedCity(gpsCity);
          resolvedCity = gpsCity;
        } catch {
          resolvedCity = null;
        }
      }
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
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const handleCitySelect = async (selected: City) => {
    setCity(selected);
    await setSelectedCity(selected);
    if (settings) {
      const computed = computePrayerTimes({
        city: { lat: selected.lat, lon: selected.lon, tz: selected.tz },
        settings,
        date: selectedDate,
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

  console.log("[TZ]", {
    city: city?.name,
    tz,
    deviceNow: new Date().toString(),
    cityNow: tz ? formatTimeInTZ(new Date(), tz, "en") : "n/a",
    nowISO: new Date().toISOString(),
    tzOffsetMin: new Date().getTimezoneOffset(),
  });
  console.log("[PT]", {
    fajr: tz && times ? formatTimeInTZ(times.fajr, tz, "en") : "n/a",
    maghrib: tz && times ? formatTimeInTZ(times.maghrib, tz, "en") : "n/a",
    fajrLocal: times ? times.fajr.toString() : null,
    fajrISO: times ? times.fajr.toISOString() : null,
  });

  return (
    <>
      <View style={styles.root}>
        <ScrollView
          style={[{ flex: 1, width: "100%" }, scrollStyle]}
          contentContainerStyle={{ alignItems: "center", paddingBottom: tabBarHeight + 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { paddingTop: topPad }]}>
            <View style={[styles.headerInner, { width: contentWidth }]}>
              <View style={styles.headerSpacer} />
              <Text style={styles.headerTitle}>مواقيت الصلاة</Text>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          <View style={[styles.body, { width: contentWidth }]}>
            <View style={styles.hero}>
              <Text style={styles.currentPrayer}>{nextPrayerLabel}</Text>
              <View style={styles.countdownRow}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
              <View style={styles.countdownUnits}>
                <Text style={styles.unitText}>ساعة</Text>
                <Text style={styles.unitText}>دقيقة</Text>
                <Text style={styles.unitText}>ثانية</Text>
              </View>
              <Pressable
                onPress={() => setIsCityPickerOpen(true)}
                hitSlop={6}
                style={styles.cityRow}
              >
                <Feather name="map-pin" size={16} color={COLORS.primary} />
                <Text
                  style={styles.cityName}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  ellipsizeMode="tail"
                >
                  {cityLabel}
                </Text>
              </Pressable>
              <Text style={styles.cityMeta}>{subtitle}</Text>
            </View>

            <View style={styles.dateRow}>
              <Pressable
                onPress={() =>
                  setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1))
                }
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={styles.chevronBtn}
              >
                <Feather name={I18nManager.isRTL ? "chevron-right" : "chevron-left"} size={20} color={COLORS.secondary} />
              </Pressable>

              <View style={styles.dateCenter}>
                <Text style={styles.dayName}>{dayName}</Text>
                <Text style={styles.hijriDate}>{hijriDate}</Text>
                <Text style={styles.gregDate}>{gregDate}</Text>
              </View>

              <View style={styles.dateRight}>
                <Pressable
                  onPress={() =>
                    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1))
                  }
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={styles.chevronBtn}
                >
                  <Feather name={I18nManager.isRTL ? "chevron-left" : "chevron-right"} size={20} color={COLORS.secondary} />
                </Pressable>
                <Pressable
                  onPress={() => {}}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={styles.calendarBtn}
                >
                  <Feather name="calendar" size={20} color={COLORS.secondary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.dateDivider} />

            <View style={styles.clockWrap}>
              <View style={styles.clockGlow} />
              <View style={styles.clock}>
                <View style={styles.clockRing} />
                <AnalogClock
                  size={170}
                  hours={timeParts.hours}
                  minutes={timeParts.minutes}
                  seconds={timeParts.seconds}
                  variant="mint"
                  accent={COLORS.primary}
                />
              </View>
            </View>

            <View style={styles.quickActions}>
              {[
                
                { key: "world", label: "مدن\nالعالم", icon: "globe", tint: COLORS.primary },
                { key: "qibla", label: "إتجاه\nالقبلة", icon: "compass", tint: COLORS.secondary },
                { key: "mosques", label: "المساجد\n القريبة", icon: "home", tint: COLORS.primary },
                { key: "times", label: "إعدادات \nالتوقيق", icon: "clock", tint: COLORS.secondary },
              ].map((item) => (
                <Pressable
                  key={item.key}
                  style={styles.quickCard}
                  onPress={() => {
                    if (item.key === "world") {
                      navigation.navigate("WorldCities");
                    }
                    if (item.key === "qibla") {
                      navigation.navigate("QiblaDirection");
                    }
                    if (item.key === "times") {
                      navigation.navigate("PrayerSettings");
                    }
                    if (item.key === "mosques") {
                      navigation.navigate("MasjidsComingSoon");
                    }
                  }}
                >
                  <View style={[styles.quickIconWrap, { backgroundColor: `${item.tint}1A` }]}> 
                    <Feather name={item.icon as any} size={18} color={item.tint} />
                  </View>
                  <Text style={styles.quickLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.list}>
              {rows.map((row, index) => {
                const isNext = row.key === nextPrayer;
                const timeText =
                  row.time && tz ? formatTimeInTZ(row.time, tz, "ar") : "--:--";
                const mode = modeForPrayer(row.key);
                const isEnabled = mode !== "mute";
                return (
                  <View key={row.key}>
                    <View style={[styles.listRow, isNext && styles.listRowActive]}>
                      <Text style={[styles.nameText, isNext && styles.nameTextActive]}>
                        {row.label}
                      </Text>
                      <Text style={[styles.timeText, isNext && styles.timeTextActive]}>{timeText}</Text>
                      <Pressable
                        onPress={openAthanSettings}
                        hitSlop={6}
                        style={styles.soundBtn}
                        accessibilityRole="button"
                        accessibilityLabel={
                          isEnabled ? `إيقاف صوت ${row.label}` : `تفعيل صوت ${row.label}`
                        }
                      >
                        <Ionicons
                          name={isEnabled ? "volume-high" : "volume-mute"}
                          size={22}
                          color={isEnabled ? COLORS.primary : COLORS.textMuted}
                        />
                      </Pressable>
                    </View>
                    {index < rows.length - 1 ? <View style={styles.divider} /> : null}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>

      <CityPickerModal
        visible={isCityPickerOpen}
        onClose={() => setIsCityPickerOpen(false)}
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
  header: {
    width: "100%",
    paddingBottom: 8,
    alignItems: "center",
    backgroundColor: COLORS.header,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  headerInner: {
    minHeight: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "CairoBold",
    fontSize: 20,
    color: "#FFFFFF",
  },
  headerSpacer: {
    width: 28,
  },
  body: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    alignItems: "center",
  },
  hero: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
  },
  currentPrayer: {
    fontFamily: "CairoBold",
    fontSize: 30,
    color: COLORS.primary,
  },
  countdownRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  countdownText: {
    fontFamily: "CairoBold",
    fontSize: 40,
    color: COLORS.primary,
    fontVariant: ["tabular-nums"],
  },
  countdownUnits: {
    marginTop: 4,
    flexDirection: "row-reverse",
    gap: 18,
  },
  unitText: {
    fontFamily: "CairoBold",
    fontSize: 12,
    color: COLORS.textMuted,
  },
  cityRow: {
    marginTop: 10,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cityName: {
    fontFamily: I18nManager.isRTL ? "CairoBold" : undefined,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    paddingHorizontal: 6,
  },
  cityMeta: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontFamily: "Cairo",
    fontSize: 13,
  },
  dateRow: {
    width: "100%",
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateCenter: {
    flex: 1,
    alignItems: "center",
  },
  dateRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chevronBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  dayName: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: COLORS.text,
  },
  hijriDate: {
    marginTop: 2,
    fontFamily: "Cairo",
    fontSize: 14,
    color: COLORS.primary,
  },
  gregDate: {
    marginTop: 2,
    fontFamily: "Cairo",
    fontSize: 12,
    color: COLORS.textMuted,
  },
  dateDivider: {
    width: "100%",
    height: 1,
    backgroundColor: COLORS.divider,
    marginTop: 10,
  },
  clockWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    marginBottom: 8,
  },
  clockGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(121, 159, 132, 0.08)",
  },
  clock: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#E6F0E9",
    borderWidth: 6,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  clockRing: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(121, 159, 132, 0.35)",
  },
  quickActions: {
    width: "100%",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 10,
  },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0ECE2",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickLabel: {
    fontFamily: "CairoBold",
    fontSize: 11,
    color: COLORS.text,
    textAlign: "center",
  },
  list: {
    width: "100%",
    marginTop: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0ECE2",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  listRow: {
    minHeight: 50,
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  listRowActive: {
    backgroundColor: COLORS.activeRowBg,
    borderRightWidth: 4,
    borderRightColor: COLORS.primary,
  },
  nameText: {
    width: 80,
    textAlign: "right",
    fontFamily: "CairoBold",
    fontSize: 16,
    color: COLORS.text,
  },
  nameTextActive: {
    color: COLORS.primary,
  },
  timeText: {
    flex: 1,
    textAlign: "center",
    fontFamily: "CairoBold",
    fontSize: 18,
    color: COLORS.text,
    fontVariant: ["tabular-nums"],
  },
  timeTextActive: {
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
  soundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
