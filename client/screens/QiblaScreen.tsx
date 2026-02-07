import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Svg, { Circle } from "react-native-svg";
import { Feather } from "@expo/vector-icons";

import DrawerMenuButton from "@/components/navigation/DrawerMenuButton";
import CityPickerModal from "@/components/prayer/CityPickerModal";
import { useTheme } from "@/context/ThemeContext";
import type { City, PrayerSettings } from "@/src/lib/prayer/preferences";
import { getPrayerSettings, getSelectedCity, setSelectedCity } from "@/src/lib/prayer/preferences";
import { reschedulePrayerNotificationsIfEnabled } from "@/src/services/prayerNotifications";
import { computePrayerTimes, formatTimeInTZ, type PrayerName, type PrayerTimesResult } from "@/src/services/prayerTimes";
import { getCityFromGPS } from "@/src/services/cityService";
import tzLookup from "tz-lookup";

const PRAYER_ARABIC: Record<PrayerName, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

const DEFAULT_SETTINGS: PrayerSettings = {
  method: "MWL",
  madhab: "Shafi",
  adjustments: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  notificationsEnabled: false,
};

type DialProps = {
  nowMs: number;
  remainingRatio: number;
};

function SalatukDial({ nowMs, remainingRatio }: DialProps) {
  const now = new Date(nowMs);
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;

  const hourDeg = hours * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const secondDeg = seconds * 6;

  const size = 258;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = clamp01(remainingRatio);
  const arcLength = circumference * ratio;

  return (
    <View style={styles.dialWrap}>
      <View style={styles.dial}>
        <Svg width={size} height={size} style={styles.arcSvg}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#B90A12"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            originX={size / 2}
            originY={size / 2}
            rotation={90}
          />
        </Svg>

        <Text style={[styles.dialNumber, styles.n12]}>12</Text>
        <Text style={[styles.dialNumber, styles.n3]}>3</Text>
        <Text style={[styles.dialNumber, styles.n6]}>6</Text>
        <Text style={[styles.dialNumber, styles.n9]}>9</Text>

        <View style={styles.dialInner} />

        <View style={[styles.handLayer, { transform: [{ rotate: `${hourDeg}deg` }] }]}>
          <View style={styles.handHour} />
        </View>
        <View style={[styles.handLayer, { transform: [{ rotate: `${minuteDeg}deg` }] }]}>
          <View style={styles.handMinute} />
        </View>
        <View style={[styles.handLayer, { transform: [{ rotate: `${secondDeg}deg` }] }]}>
          <View style={styles.handSecond} />
        </View>
        <View style={styles.dialCenter} />
      </View>
    </View>
  );
}

export default function QiblaScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();

  const maxW = 430;
  const contentWidth = Math.min(width, maxW);
  const headerPadTop = useMemo(() => insets.top + 8, [insets.top]);

  const [selectedCity, setSelectedCityState] = useState<City | null>(null);
  const [prayerSettings, setPrayerSettingsState] = useState<PrayerSettings>(DEFAULT_SETTINGS);
  const [pt, setPt] = useState<PrayerTimesResult | null>(null);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);
  const [cityLookupFailed, setCityLookupFailed] = useState(false);
  const [autoOpenedPickerOnWeb, setAutoOpenedPickerOnWeb] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const hasLoadedRef = useRef(false);
  const cityVersionRef = useRef(0);

  const loadCityAndSettings = useCallback(async () => {
    setLoadingCity(true);
    setCityLookupFailed(false);
    const v = cityVersionRef.current;

    const settings = await getPrayerSettings().catch(() => DEFAULT_SETTINGS);
    if (v !== cityVersionRef.current) {
      setLoadingCity(false);
      return;
    }
    setPrayerSettingsState(settings);

    const savedCity = await getSelectedCity();
    if (v !== cityVersionRef.current) {
      setLoadingCity(false);
      return;
    }

    let cityToUse: City | null = null;
    if (savedCity) {
      if (savedCity.source === "manual" && savedCity.name?.trim()) {
        cityToUse = savedCity;
      } else if (!isUnknownCityName(savedCity.name)) {
        cityToUse = savedCity;
      }
    }

    if (!cityToUse && !selectedCity) {
      try {
        const gpsCity = await getCityFromGPS();
        if (v !== cityVersionRef.current) {
          setLoadingCity(false);
          return;
        }
        if (!isUnknownCityName(gpsCity.name)) {
          cityToUse = gpsCity;
          await setSelectedCity(gpsCity);
        } else {
          setCityLookupFailed(true);
          if (Platform.OS === "web" && !autoOpenedPickerOnWeb) {
            setIsCityPickerOpen(true);
            setAutoOpenedPickerOnWeb(true);
          }
        }
      } catch {
        if (v !== cityVersionRef.current) {
          setLoadingCity(false);
          return;
        }
        setCityLookupFailed(true);
        if (Platform.OS === "web" && !autoOpenedPickerOnWeb) {
          setIsCityPickerOpen(true);
          setAutoOpenedPickerOnWeb(true);
        }
      }
    }

    if (v !== cityVersionRef.current) {
      setLoadingCity(false);
      return;
    }
    setSelectedCityState(cityToUse);
    setLoadingCity(false);
  }, [autoOpenedPickerOnWeb, selectedCity]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    void loadCityAndSettings();
  }, [loadCityAndSettings]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedCity) {
      setPt(null);
      return;
    }
    const res = computePrayerTimes({
      city: { lat: selectedCity.lat, lon: selectedCity.lon },
      settings: prayerSettings,
      timeZone: tz ?? undefined,
    });
    setPt(res);
  }, [
    selectedCity?.lat,
    selectedCity?.lon,
    prayerSettings.method,
    prayerSettings.madhab,
    prayerSettings.adjustments.fajr,
    prayerSettings.adjustments.dhuhr,
    prayerSettings.adjustments.asr,
    prayerSettings.adjustments.maghrib,
    prayerSettings.adjustments.isha,
  ]);

  useEffect(() => {
    if (!selectedCity) return;
    void reschedulePrayerNotificationsIfEnabled({ city: selectedCity, settings: prayerSettings });
  }, [
    selectedCity?.lat,
    selectedCity?.lon,
    prayerSettings.method,
    prayerSettings.madhab,
    prayerSettings.adjustments.fajr,
    prayerSettings.adjustments.dhuhr,
    prayerSettings.adjustments.asr,
    prayerSettings.adjustments.maghrib,
    prayerSettings.adjustments.isha,
    prayerSettings.notificationsEnabled,
  ]);

  // Recompute once the next prayer passes
  useEffect(() => {
    if (!selectedCity || !pt) return;
    if (pt.nextPrayerTime.getTime() > nowMs) return;
    const res = computePrayerTimes({
      city: { lat: selectedCity.lat, lon: selectedCity.lon },
      settings: prayerSettings,
      timeZone: tz ?? undefined,
    });
    setPt(res);
  }, [nowMs, pt, prayerSettings, selectedCity]);

  const handleCitySelect = async (city: City) => {
    cityVersionRef.current += 1;
    setSelectedCityState(city);
    setCityLookupFailed(false);
    setIsCityPickerOpen(false);

    await setSelectedCity(city);

    const res = computePrayerTimes({
      city: { lat: city.lat, lon: city.lon },
      settings: prayerSettings,
      timeZone: tzLookup(city.lat, city.lon),
    });
    setPt(res);

    await reschedulePrayerNotificationsIfEnabled({ city, settings: prayerSettings });
  };

  const cityTitle =
    !selectedCity || isUnknownCityName(selectedCity.name) ? "اختر مدينة" : selectedCity.name;

  const citySourceText =
    selectedCity && !isUnknownCityName(selectedCity.name)
      ? selectedCity.source === "manual"
        ? "الموقع مثبت يدوياً"
        : "تم تحديد الموقع تلقائياً"
      : "";

  const shouldShowChangeCity = !selectedCity || cityLookupFailed;

  const tz = useMemo(
    () => (selectedCity ? tzLookup(selectedCity.lat, selectedCity.lon) : null),
    [selectedCity?.lat, selectedCity?.lon]
  );

  const remainingRatio = pt ? computeRemainingRatio(pt, nowMs) : 0;

  // NEW: upcoming prayer info (like your attached second screenshot)
  const nextPrayerLabel = pt ? PRAYER_ARABIC[pt.nextPrayerName] : "--";
  const nextPrayerTimeText =
    pt && tz ? formatTimeInTZ(pt.nextPrayerTime, tz, "ar") : "--:--";
  const countdownText = pt ? formatCountdownMinus(pt.nextPrayerTime.getTime() - nowMs) : "--:--";

  const mainText = isDarkMode ? "#FFFFFF" : "#0D1015";
  const subText = isDarkMode ? "rgba(255,255,255,0.55)" : "#737373";

  return (
    <View style={[styles.root, { backgroundColor: isDarkMode ? "#15140F" : "#F8F7F2" }]}>
      <ScrollView
        style={{ width: contentWidth }}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topRow, { paddingTop: headerPadTop }]}>
          <View style={styles.menuButton}>
            <DrawerMenuButton />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.cityRow}>
            <Text
              style={[styles.cityName, { color: mainText }]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {loadingCity ? "..." : cityTitle}
            </Text>
            <Pressable style={styles.pinButton} onPress={() => setIsCityPickerOpen(true)}>
              <Feather name="map-pin" size={20} color="#3D6FA3" />
            </Pressable>
          </View>

          {citySourceText ? <Text style={[styles.citySource, { color: subText }]}>{citySourceText}</Text> : null}

          {shouldShowChangeCity ? (
            <Pressable style={styles.changeCityBtn} onPress={() => setIsCityPickerOpen(true)}>
              <Text style={styles.changeCityBtnText}>تغيير المدينة</Text>
            </Pressable>
          ) : null}

          <SalatukDial nowMs={nowMs} remainingRatio={remainingRatio} />

          {/* REPLACED: removed 259° + qibla text and added next prayer block */}
          <View style={styles.nextPrayerWrap}>
            <Text style={styles.nextPrayerName}>{nextPrayerLabel}</Text>
            <Text style={styles.nextPrayerTime}>{nextPrayerTimeText}</Text>
            <Text style={styles.nextPrayerCountdown}>{countdownText}</Text>
          </View>
        </View>
      </ScrollView>

      <CityPickerModal
        visible={isCityPickerOpen}
        onClose={() => setIsCityPickerOpen(false)}
        onSelect={handleCitySelect}
      />
    </View>
  );
}

function computeRemainingRatio(prayerTimes: PrayerTimesResult, nowMs: number): number {
  const nextMs = prayerTimes.nextPrayerTime.getTime();
  const prevMs = getPrevPrayerTimeMs(prayerTimes);
  const total = Math.max(1, nextMs - prevMs);
  const remaining = Math.max(0, nextMs - nowMs);
  return clamp01(remaining / total);
}

function getPrevPrayerTimeMs(prayerTimes: PrayerTimesResult): number {
  const byName: Record<PrayerName, Date> = {
    Fajr: prayerTimes.fajr,
    Sunrise: prayerTimes.sunrise,
    Dhuhr: prayerTimes.dhuhr,
    Asr: prayerTimes.asr,
    Maghrib: prayerTimes.maghrib,
    Isha: prayerTimes.isha,
  };

  const sequence: PrayerName[] = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const nextIndex = sequence.indexOf(prayerTimes.nextPrayerName);
  if (nextIndex <= 0) return prayerTimes.isha.getTime();
  const prevName = sequence[nextIndex - 1];
  return byName[prevName].getTime();
}

// NEW: format countdown like screenshot: "-12:42" (HH:MM only)
function formatCountdownMinus(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const pad = (v: number) => String(v).padStart(2, "0");
  return `-${pad(h)}:${pad(m)}`;
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function isUnknownCityName(name?: string | null): boolean {
  if (!name) return true;
  const trimmed = name.trim().toLowerCase();
  if (trimmed === "" || trimmed === "unknown") return true;
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(trimmed);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
  },
  topRow: {
    width: "100%",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  menuButton: {
    zIndex: 5,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cityName: {
    fontFamily: "CairoBold",
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  pinButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  citySource: {
    marginTop: -2,
    fontFamily: "Cairo",
    fontSize: 16,
    textAlign: "center",
  },
  changeCityBtn: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: "#EAF3FF",
    paddingHorizontal: 18,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  changeCityBtnText: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#3D6FA3",
  },
  dialWrap: {
    marginTop: 8,
    marginBottom: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dial: {
    width: 258,
    height: 258,
    borderRadius: 129,
    backgroundColor: "#AFD8F4",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  arcSvg: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  dialInner: {
    position: "absolute",
    width: 146,
    height: 146,
    borderRadius: 73,
    backgroundColor: "#082434",
  },
  dialNumber: {
    position: "absolute",
    fontFamily: "CairoBold",
    fontSize: 36,
    color: "#FFFFFF",
  },
  n12: { top: 10 },
  n3: { right: 18 },
  n6: { bottom: 4 },
  n9: { left: 18 },
  handLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  handHour: {
    width: 6,
    height: 66,
    borderRadius: 6,
    backgroundColor: "#020202",
    marginBottom: 2,
  },
  handMinute: {
    width: 6,
    height: 88,
    borderRadius: 6,
    backgroundColor: "#9CA4A9",
    marginBottom: 2,
  },
  handSecond: {
    width: 2,
    height: 100,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
    marginBottom: 2,
  },
  dialCenter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },

  // NEW: next prayer block (matches your attached design)
  nextPrayerWrap: {
    alignItems: "center",
    marginTop: 14,
    marginBottom: 18,
  },
  nextPrayerName: {
    fontFamily: "CairoBold",
    fontSize: 28,
    color: "#2AA7C8",
    marginBottom: 6,
  },
  nextPrayerTime: {
    fontFamily: "CairoBold",
    fontSize: 52,
    color: "#6B6E72",
    marginBottom: 4,
  },
  nextPrayerCountdown: {
    fontFamily: "CairoBold",
    fontSize: 28,
    color: "#B90A12",
  },
});
