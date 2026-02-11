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
import { DrawerActions, useFocusEffect, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import tzLookup from "tz-lookup";

import type { City, PrayerSettings } from "@/screens/qibla/services/preferences";
import { getPrayerSettings, getSelectedCity, setSelectedCity } from "@/screens/qibla/services/preferences";
import { getAthanPrefs, type AthanMode, type AthanPrefs } from "@/screens/qibla/services/athanPrefs";
import CityPickerModal from "@/screens/qibla/components/CityPickerModal";
import {
  computePrayerTimes,
  formatTime,
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
  return ms > 0 ? `-${pad2(h)}:${pad2(m)}` : `+${pad2(h)}:${pad2(m)}`;
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

function getCityOnlyLabel(city: City | null) {
  if (!city?.name) return "اختر مدينة";
  const name = city.name.split(",")[0]?.trim();
  return name || "اختر مدينة";
}

export default function SalatukPrayerTimesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
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
      ? "الموقع مثبت يدويًا"
      : city?.source === "gps"
        ? "تم تحديد الموقع تلقائيًا"
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
      : "--:--";

  const iconForMode = (mode: AthanMode) => {
    switch (mode) {
      case "mute":
        return "volume-x";
      case "vibrate":
        return "smartphone";
      default:
        return "volume-1";
    }
  };

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
              <Pressable
                onPress={() => {
                  let current: any = navigation;
                  while (current) {
                    const state = current.getState?.();
                    if (state?.type === "drawer") {
                      current.dispatch(DrawerActions.openDrawer());
                      return;
                    }
                    current = current.getParent?.();
                  }
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.menuBtn}
              >
                <Feather name="menu" size={28} color="#111111" />
              </Pressable>
            </View>
          </View>

          <View style={[styles.body, { width: contentWidth }]}>
            <View style={styles.cityRow}>
              <Pressable onPress={() => setIsCityPickerOpen(true)} hitSlop={6}>
                <Feather name="map-pin" size={16} color="#39A9F4" />
              </Pressable>
              <Text
                style={styles.cityName}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                ellipsizeMode="tail"
              >
                {cityLabel}
              </Text>
            </View>
            <Text style={styles.cityMeta}>{subtitle}</Text>

            <View style={styles.dateRow}>
              <Pressable
                onPress={() =>
                  setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1))
                }
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={styles.chevronBtn}
              >
                <Feather name={I18nManager.isRTL ? "chevron-right" : "chevron-left"} size={20} color="#2FA8EE" />
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
                  <Feather name={I18nManager.isRTL ? "chevron-left" : "chevron-right"} size={20} color="#2FA8EE" />
                </Pressable>
                <Pressable
                  onPress={() => {}}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={styles.calendarBtn}
                >
                  <Feather name="calendar" size={20} color="#2FA8EE" />
                </Pressable>
              </View>
            </View>

            <View style={styles.dateDivider} />

            <View style={styles.list}>
              {rows.map((row, index) => {
                const isNext = row.key === nextPrayer;
                const timeText =
                  row.time && tz ? formatTimeInTZ(row.time, tz, "ar") : "--:--";
                const mode = modeForPrayer(row.key);
                const iconColor = mode === "mute" ? "#9AA2A9" : "#F0A500";
                return (
                  <View key={row.key}>
                    <View style={[styles.listRow, isNext && styles.listRowActive]}>
                      <Pressable onPress={openAthanSettings} hitSlop={6} style={styles.speakerBtn}>
                        <Feather
                          name={iconForMode(mode)}
                          size={18}
                          color={iconColor}
                        />
                      </Pressable>
                      <Text style={styles.nameText}>{row.label}</Text>
                      <Text style={[styles.timeText, isNext && styles.timeTextActive]}>{timeText}</Text>
                    </View>
                    {index < rows.length - 1 ? <View style={styles.divider} /> : null}
                  </View>
                );
              })}
            </View>

            <Text style={styles.countdown}>{countdown}</Text>
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
    backgroundColor: "#F2F1EA",
  },
  header: {
    width: "100%",
    paddingBottom: 4,
    alignItems: "center",
  },
  headerInner: {
    minHeight: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  menuBtn: {
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  body: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    alignItems: "center",
  },
  cityRow: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cityName: {
    fontFamily: I18nManager.isRTL ? "CairoBold" : undefined,
    fontSize: 26,
    fontWeight: "800",
    color: "#0E0F10",
    paddingHorizontal: 12,
  },
  cityMeta: {
    marginTop: 2,
    color: "#6B6E72",
    fontFamily: "Cairo",
    fontSize: 15,
  },
  dateRow: {
    width: "100%",
    marginTop: 18,
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
    fontSize: 18,
    color: "#22272E",
  },
  hijriDate: {
    marginTop: 2,
    fontFamily: "Cairo",
    fontSize: 16,
    color: "#2FA8EE",
  },
  gregDate: {
    marginTop: 2,
    fontFamily: "Cairo",
    fontSize: 14,
    color: "#6B6E72",
  },
  dateDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginTop: 14,
  },
  list: {
    width: "100%",
    marginTop: 10,
  },
  listRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  speakerBtn: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  listRowActive: {
    backgroundColor: "rgba(255, 210, 110, 0.12)",
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  nameText: {
    flex: 1,
    textAlign: "center",
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#2F435A",
  },
  timeText: {
    minWidth: 86,
    textAlign: "right",
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#5A7090",
  },
  timeTextActive: {
    color: "#2B2F35",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(91,119,146,0.14)",
  },
  countdown: {
    marginTop: 12,
    alignSelf: "flex-start",
    fontFamily: "CairoBold",
    fontSize: 18,
    color: "#BE1144",
  },
});

