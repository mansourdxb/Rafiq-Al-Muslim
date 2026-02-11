import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  ImageBackground,
  Modal,
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
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import CityPickerModal from "@/screens/qibla/components/CityPickerModal";
import { useTheme } from "@/context/ThemeContext";
import type { City } from "@/screens/qibla/services/preferences";
import { getSelectedCity, setSelectedCity } from "@/screens/qibla/services/preferences";
import { getCityFromGPS } from "@/screens/qibla/services/cityService";
import { useDeviceHeading } from "@/src/hooks/useDeviceHeading";

const BG_IMAGE = require("@/assets/qibla/qibla-bg.png");
const COMPASS_BASE = require("@/assets/qibla/compass-base.png");
const COMPASS_NEEDLE = require("@/assets/qibla/compass-needle.png");

export default function KaabaDirection() {
  const navigation = useNavigation<any>();
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
  const [showCalibration, setShowCalibration] = useState(false);
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
  const qiblaDegreeText =
    qiblaBearing === null ? "--°" : `${Math.round(qiblaBearing)}°`;
  const arrowAngle =
    qiblaBearing !== null && headingDeg !== null
      ? (qiblaBearing - headingDeg + 360) % 360
      : 0;

  const compassSize = Math.min(contentWidth - 40, 290);

  return (
    <View style={[styles.root, { backgroundColor: isDarkMode ? "#15140F" : "#F7F2E7" }]}>
      <ImageBackground
        source={BG_IMAGE}
        resizeMode="cover"
        style={styles.bg}
        imageStyle={styles.bgImage}
      >
        <ScrollView
          style={{ width: contentWidth }}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { paddingTop: headerPadTop }]}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={() => {
                  if (navigation.canGoBack?.()) {
                    navigation.goBack();
                  } else {
                    navigation.navigate("PrayerTimes");
                  }
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.headerBtn}
              >
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.headerTitle}>بوصلة اتجاه القبلة</Text>
              <Pressable
                onPress={() => navigation.navigate("SalatukSettings")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.headerBtn}
              >
                <Ionicons name="settings" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.cityRow}>
              <Text
                style={styles.cityName}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {loadingCity ? "..." : cityTitle}
              </Text>
              <Pressable style={styles.pinButton} onPress={() => setIsCityPickerOpen(true)}>
                <Feather name="map-pin" size={18} color="#2F6E52" />
              </Pressable>
            </View>
            {citySourceText ? <Text style={styles.citySource}>{citySourceText}</Text> : null}

            <View style={styles.compassSection}>
              <View style={[styles.compassWrap, { width: compassSize, height: compassSize }]}>
                <Image source={COMPASS_BASE} style={styles.compassBase} />
                <Image
                  source={COMPASS_NEEDLE}
                  style={[
                    styles.compassNeedle,
                    { transform: [{ rotate: `${arrowAngle}deg` }] },
                  ]}
                />
              </View>
            </View>

            <View style={styles.qiblaInfoWrap}>
              <View style={styles.degreeRow}>
                <Text style={styles.qiblaDegree}>{qiblaDegreeText}</Text>
                <Ionicons name="arrow-undo" size={20} color="#2F6E52" />
              </View>
              <Text style={styles.qiblaLabel}>القبلة</Text>
              {headingDeg === null && Platform.OS === "web" ? (
                <Text style={styles.webHint}>ميزة البوصلة غير متاحة على الويب.</Text>
              ) : null}
              {__DEV__ ? (
                <Text style={styles.debugText}>
                  {`Heading: ${headingDeg == null ? "--" : Math.round(headingDeg)}° (${source}) acc: ${accuracy ?? "--"}`}
                </Text>
              ) : null}
            </View>

            <Pressable
              onPress={() => setShowCalibration(true)}
              style={styles.calibrateBtn}
            >
              <Text style={styles.calibrateText}>معايرة</Text>
            </Pressable>
          </View>
        </ScrollView>

        <CityPickerModal
          visible={isCityPickerOpen}
          onClose={() => setIsCityPickerOpen(false)}
          onSelect={handleCitySelect}
        />
        <Modal transparent visible={showCalibration} animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setShowCalibration(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>معايرة البوصلة</Text>
              <Text style={styles.modalText}>حرّك الهاتف بحركة رقم ٨ حتى تتحسن الدقة.</Text>
              <Pressable
                onPress={() => setShowCalibration(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>حسنًا</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </ImageBackground>
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
  },
  bg: {
    flex: 1,
    alignItems: "center",
  },
  bgImage: {
    opacity: 0.16,
  },
  header: {
    width: "100%",
    backgroundColor: "#1E5A47",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerTitle: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cityName: {
    fontFamily: "CairoBold",
    fontSize: 20,
    lineHeight: 26,
    color: "#2B2B2B",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  pinButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  citySource: {
    marginTop: 4,
    fontFamily: "Cairo",
    fontSize: 14,
    color: "#7C7C7C",
    textAlign: "center",
  },
  compassSection: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  compassWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  compassBase: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  compassNeedle: {
    position: "absolute",
    width: "80%",
    height: "80%",
    resizeMode: "contain",
  },
  qiblaInfoWrap: {
    alignItems: "center",
    marginTop: 14,
  },
  degreeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  qiblaDegree: {
    fontFamily: "CairoBold",
    fontSize: 28,
    color: "#1F1F1F",
  },
  qiblaLabel: {
    marginTop: 4,
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#2F6E52",
  },
  webHint: {
    marginTop: 4,
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#8A8A8A",
  },
  debugText: {
    marginTop: 6,
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#7B7F86",
  },
  calibrateBtn: {
    marginTop: 18,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#C6A86A",
    backgroundColor: "#F6EFE1",
  },
  calibrateText: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#3F3B2F",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  modalTitle: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: "#2B2B2B",
    marginBottom: 6,
  },
  modalText: {
    fontFamily: "Cairo",
    fontSize: 14,
    color: "#6B6B6B",
    textAlign: "center",
    marginBottom: 14,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#1E5A47",
  },
  modalButtonText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
});
