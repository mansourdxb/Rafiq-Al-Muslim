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
import { Feather, FontAwesome5 } from "@expo/vector-icons";

import DrawerMenuButton from "@/components/navigation/DrawerMenuButton";
import CityPickerModal from "@/screens/qibla/components/CityPickerModal";
import { useTheme } from "@/context/ThemeContext";
import type { City } from "@/screens/qibla/services/preferences";
import { getSelectedCity, setSelectedCity } from "@/screens/qibla/services/preferences";
import { getCityFromGPS } from "@/screens/qibla/services/cityService";
import { useDeviceHeading } from "@/src/hooks/useDeviceHeading";

const DIRECTION_LABELS = [
  { label: "N", angle: 0 },
  { label: "NE", angle: 45 },
  { label: "E", angle: 90 },
  { label: "SE", angle: 135 },
  { label: "S", angle: 180 },
  { label: "SW", angle: 225 },
  { label: "W", angle: 270 },
  { label: "NW", angle: 315 },
];

export default function KaabaDirection() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();

  const maxW = 430;
  const contentWidth = Math.min(width, maxW);
  const headerPadTop = useMemo(() => insets.top + 8, [insets.top]);

  const [selectedCity, setSelectedCityState] = useState<City | null>(null);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);
  const [cityLookupFailed, setCityLookupFailed] = useState(false);
  const [autoOpenedPickerOnWeb, setAutoOpenedPickerOnWeb] = useState(false);
  const { headingDeg, accuracy, source } = useDeviceHeading();
  const hasLoadedRef = useRef(false);
  const cityVersionRef = useRef(0);

  const loadCity = useCallback(async () => {
    setLoadingCity(true);
    setCityLookupFailed(false);
    const v = cityVersionRef.current;

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
    void loadCity();
  }, [loadCity]);

  const handleCitySelect = async (city: City) => {
    cityVersionRef.current += 1;
    setSelectedCityState(city);
    setCityLookupFailed(false);
    setIsCityPickerOpen(false);
    await setSelectedCity(city);
  };

  const cityTitle = !selectedCity || isUnknownCityName(selectedCity.name)
    ? "اختر مدينة"
    : selectedCity.name;
  const citySourceText = selectedCity && !isUnknownCityName(selectedCity.name)
    ? selectedCity.source === "manual"
      ? "الموقع مثبت يدوياً"
      : "تم تحديد الموقع تلقائياً"
    : "";

  const qiblaBearing = selectedCity
    ? computeQiblaBearing(selectedCity.lat, selectedCity.lon)
    : null;
  const headingText =
    headingDeg === null ? "--°" : `${Math.round(headingDeg)}°`;
  const qiblaDegreeText =
    qiblaBearing === null ? "--°" : `${Math.round(qiblaBearing)}°`;
  const qiblaCityLine =
    selectedCity && qiblaBearing !== null
      ? `${selectedCity.name} ${Math.round(qiblaBearing)}°`
      : "";
  const arrowAngle =
    qiblaBearing !== null && headingDeg !== null
      ? (qiblaBearing - headingDeg + 360) % 360
      : 0;

  const compassSize = 230;
  const ringRadius = compassSize / 2;

  return (
    <View style={[styles.root, { backgroundColor: isDarkMode ? "#15140F" : "#FFFFFF" }]}>
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
              style={styles.cityName}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {loadingCity ? "..." : cityTitle}
            </Text>
            <Pressable style={styles.pinButton} onPress={() => setIsCityPickerOpen(true)}>
              <Feather name="map-pin" size={18} color="#3D6FA3" />
            </Pressable>
          </View>
          {citySourceText ? <Text style={styles.citySource}>{citySourceText}</Text> : null}

          <View style={styles.compassSection}>
            <View style={styles.kaabaWrap}>
              <FontAwesome5 name="kaaba" size={34} color="#7B7B7B" />
            </View>

            <View style={[styles.compassWrap, { width: compassSize, height: compassSize }]}>
              <View style={[styles.ring, { width: compassSize, height: compassSize }]} />

              {DIRECTION_LABELS.map((item) => (
                <View
                  key={item.label}
                  style={[
                    styles.directionLabelWrap,
                    {
                      width: compassSize,
                      height: compassSize,
                      transform: [
                        { rotate: `${item.angle}deg` },
                        { translateY: -(ringRadius - 34) },
                        { rotate: `${-item.angle}deg` },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.directionLabel}>{item.label}</Text>
                </View>
              ))}

              {Array.from({ length: 12 }).map((_, idx) => (
                <View
                  key={`tick-${idx}`}
                  style={[
                    styles.tick,
                    {
                      transform: [
                        { rotate: `${idx * 30}deg` },
                        { translateY: -(ringRadius - 6) },
                      ],
                    },
                  ]}
                />
              ))}

              <View style={styles.centerDot} />

              <View
                style={[
                  styles.pointerWrap,
                  {
                    transform: [
                      { rotate: `${arrowAngle}deg` },
                      { translateY: -(ringRadius - 14) },
                    ],
                  },
                ]}
              >
                <View style={styles.pointerTriangle} />
              </View>
            </View>
          </View>

          <View style={styles.qiblaInfoWrap}>
            <Text style={styles.qiblaDegree}>{headingText}</Text>
            <Text style={styles.qiblaSubtitle}>اتجاه القبلة التقريبي في موقعك</Text>
            {qiblaCityLine ? <Text style={styles.qiblaCityLine}>{qiblaCityLine}</Text> : null}
            {__DEV__ ? (
              <Text style={styles.debugText}>
                {`Heading: ${headingDeg == null ? "--" : Math.round(headingDeg)}° (${source}) acc: ${accuracy ?? "--"}`}
              </Text>
            ) : null}
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

function computeQiblaBearing(lat: number, lon: number): number {
  const kaabaLat = 21.4225;
  const kaabaLon = 39.8262;
  const phi1 = toRad(lat);
  const phi2 = toRad(kaabaLat);
  const deltaLon = toRad(kaabaLon - lon);
  const y = Math.sin(deltaLon) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLon);
  let bearing = toDeg(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;
  return bearing;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function isUnknownCityName(name?: string | null): boolean {
  if (!name) return true;
  const trimmed = name.trim().toLowerCase();
  if (trimmed === "" || trimmed === "unknown") return true;
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(trimmed);
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
    marginBottom: 6,
  },
  menuButton: {
    zIndex: 5,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  compassSection: {
    width: "100%",
    alignItems: "center",
    marginTop: 22,
    paddingTop: 6,
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
    color: "#0D1015",
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
    fontSize: 18,
    color: "#737373",
    textAlign: "center",
  },
  kaabaWrap: {
    marginTop: 14,
    marginBottom: 14,
    alignItems: "center",
  },
  compassWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "#E4E6EA",
    borderRadius: 999,
  },
  directionLabelWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  directionLabel: {
    fontSize: 12,
    fontFamily: "CairoBold",
    color: "#3D9AD9",
  },
  tick: {
    position: "absolute",
    width: 3,
    height: 12,
    backgroundColor: "#111111",
    borderRadius: 2,
  },
  centerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F0A500",
  },
  pointerWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  pointerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#111111",
  },
  qiblaInfoWrap: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 18,
  },
  qiblaDegree: {
    fontFamily: "CairoBold",
    fontSize: 48,
    color: "#111111",
    marginBottom: 6,
  },
  qiblaSubtitle: {
    fontFamily: "Cairo",
    fontSize: 16,
    color: "#6B6E72",
    textAlign: "center",
  },
  qiblaCityLine: {
    marginTop: 2,
    fontFamily: "CairoBold",
    fontSize: 18,
    color: "#3B3F45",
  },
  debugText: {
    marginTop: 6,
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#7B7F86",
  },
});

