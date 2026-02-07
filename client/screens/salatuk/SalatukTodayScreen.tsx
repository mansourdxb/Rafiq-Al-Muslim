import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/context/ThemeContext";
import type { City, PrayerSettings } from "@/src/lib/prayer/preferences";
import { getPrayerSettings, getSelectedCity } from "@/src/lib/prayer/preferences";
import { computePrayerTimes, formatTimeInTZ } from "@/src/services/prayerTimes";
import tzLookup from "tz-lookup";

type TodayTimes = {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
} | null;

export default function SalatukTodayScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const [city, setCity] = useState<City | null>(null);
  const [settings, setSettings] = useState<PrayerSettings | null>(null);
  const [times, setTimes] = useState<TodayTimes>(null);
  const isArabicUI = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().locale?.toLowerCase().startsWith("ar"),
    []
  );
  const tz = useMemo(
    () => (city ? tzLookup(city.lat, city.lon) : null),
    [city?.lat, city?.lon]
  );

  const contentWidth = Math.min(width, 430);
  const headerGradientColors = colors.headerGradient as [string, string, ...string[]];
  const headerPadTop = useMemo(() => insets.top + 8, [insets.top]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [savedCity, savedSettings] = await Promise.all([
        getSelectedCity(),
        getPrayerSettings(),
      ]);
      if (!mounted) return;
      setCity(savedCity);
      setSettings(savedSettings);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!city || !settings) {
      setTimes(null);
      return;
    }
    const tz = tzLookup(city.lat, city.lon);
    const computed = computePrayerTimes({
      city: { lat: city.lat, lon: city.lon },
      settings,
      timeZone: tz,
    });
    setTimes({
      fajr: computed.fajr,
      sunrise: computed.sunrise,
      dhuhr: computed.dhuhr,
      asr: computed.asr,
      maghrib: computed.maghrib,
      isha: computed.isha,
    });
  }, [city, settings]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={headerGradientColors} style={[styles.header, { paddingTop: headerPadTop }]}>
        <View style={[styles.headerInner, { width: contentWidth }]}>
          <Text style={styles.headerTitle}>اليوم</Text>
        </View>
      </LinearGradient>

      <View style={[styles.body, { width: contentWidth }]}>
        <View style={styles.card}>
          <Text style={styles.cityLine}>{city?.name ?? "Unknown"}</Text>
          {times ? (
            <>
              {tz ? renderRow("الفجر", times.fajr, isArabicUI, tz) : null}
              {renderDivider()}
              {tz ? renderRow("الشروق", times.sunrise, isArabicUI, tz) : null}
              {renderDivider()}
              {tz ? renderRow("الظهر", times.dhuhr, isArabicUI, tz) : null}
              {renderDivider()}
              {tz ? renderRow("العصر", times.asr, isArabicUI, tz) : null}
              {renderDivider()}
              {tz ? renderRow("المغرب", times.maghrib, isArabicUI, tz) : null}
              {renderDivider()}
              {tz ? renderRow("العشاء", times.isha, isArabicUI, tz) : null}
            </>
          ) : (
            <Text style={styles.empty}>اختر مدينة من تبويب المدن لعرض المواقيت</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function renderRow(label: string, date: Date, isArabicUI: boolean, tz: string) {
  return (
    <View style={styles.row}>
      <Text style={styles.time}>{formatTimeInTZ(date, tz, isArabicUI ? "ar" : "en")}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function renderDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F6F2E8",
  },
  header: {
    width: "100%",
    paddingBottom: 12,
    alignItems: "center",
  },
  headerInner: {
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontFamily: "CairoBold",
    fontSize: 32,
    textAlign: "center",
  },
  body: {
    flex: 1,
    padding: 18,
  },
  card: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(80,110,130,0.10)",
  },
  cityLine: {
    marginBottom: 8,
    fontFamily: "CairoBold",
    fontSize: 18,
    color: "#33475A",
    textAlign: "center",
  },
  row: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontFamily: "CairoBold",
    fontSize: 15,
    color: "#374656",
    textAlign: "right",
  },
  time: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#5A6E83",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(90,110,130,0.14)",
  },
  empty: {
    marginTop: 8,
    fontFamily: "Cairo",
    fontSize: 14,
    color: "#6F8398",
    textAlign: "center",
  },
});
