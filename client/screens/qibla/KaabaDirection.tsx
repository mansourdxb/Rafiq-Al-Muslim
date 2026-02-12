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
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import CityPickerModal from "@/screens/qibla/components/CityPickerModal";
import { useTheme } from "@/context/ThemeContext";
import type { City } from "@/screens/qibla/services/preferences";
import { getSelectedCity, setSelectedCity } from "@/screens/qibla/services/preferences";
import { getCityFromGPS } from "@/screens/qibla/services/cityService";
import { useDeviceHeading } from "@/src/hooks/useDeviceHeading";

const COLORS = {
  primary: "#3D5A47",
  accent: "#C19B53",
  backgroundLight: "#F3F5F4",
  backgroundDark: "#1A241E",
  cardDark: "#243129",
};

export default function KaabaDirection() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
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
    ? "--"
    : selectedCity.name;

  const qiblaBearing = selectedCity
    ? computeQiblaBearing(selectedCity.lat, selectedCity.lon)
    : null;
  const qiblaDegreeText =
    qiblaBearing === null ? "--°" : `${Math.round(qiblaBearing)}°`;
  const needleDeg =
    qiblaBearing !== null
      ? (qiblaBearing - (headingDeg ?? 0) + 360) % 360
      : 0;

  const bearingCardinal = qiblaBearing === null ? "--" : toCardinal(qiblaBearing);
  const distanceKm =
    selectedCity ? haversineKm(selectedCity.lat, selectedCity.lon, 21.4225, 39.8262) : null;

  const compassSize = Math.min(contentWidth - 40, 300);
  const ringInset = 12;
  const innerInset = 24;

  const bgColor = isDarkMode ? COLORS.backgroundDark : COLORS.backgroundLight;
  const cardColor = isDarkMode ? COLORS.cardDark : "#FFFFFF";

  return (
    <View style={[styles.root, { backgroundColor: bgColor }]}>
      <View style={[styles.blob, styles.blobLeft, { backgroundColor: "rgba(61,90,71,0.08)" }]} />
      <View style={[styles.blob, styles.blobRight, { backgroundColor: "rgba(193,155,83,0.08)" }]} />

      <ScrollView
        style={{ width: contentWidth }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
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
              <Ionicons name="chevron-back" size={18} color={COLORS.primary} />
            </Pressable>
            <Text style={styles.headerTitle}>اتجاه القبلة</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <View style={styles.content}>
          <View style={[styles.compassWrap, { width: compassSize, height: compassSize }]}> 
            <View style={[styles.ringOuter, { borderColor: "rgba(61,90,71,0.2)" }]} />
            <View style={[styles.ringInner, { borderColor: "rgba(61,90,71,0.12)" }]} />

            <Text style={[styles.cardinal, styles.cardinalN]}>N</Text>
            <Text style={[styles.cardinal, styles.cardinalS]}>S</Text>
            <Text style={[styles.cardinal, styles.cardinalE]}>E</Text>
            <Text style={[styles.cardinal, styles.cardinalW]}>W</Text>

            <View style={[styles.centerDisc, { backgroundColor: cardColor }]} />

            <View style={[styles.needleWrap, { transform: [{ rotate: `${needleDeg}deg` }] }]}> 
              <View style={styles.kaabaMarker}>
                <View style={styles.kaabaDot} />
                <Text style={styles.kaabaText}>KAABA</Text>
              </View>
              <View style={styles.needleStemTop} />
              <View style={styles.needleStemBottom} />
              <View style={[styles.needleCenter, { borderColor: bgColor }]} />
            </View>
          </View>

          {headingDeg === null && Platform.OS === "web" ? (
            <Text style={styles.webHint}>Compass sensor not available on web. Use phone for live compass.</Text>
          ) : null}

          <View style={[styles.infoCard, { backgroundColor: cardColor }]}> 
            <View style={styles.infoTopRow}>
              <View>
                <Text style={styles.infoLabel}>المدينة الحالية</Text>
                <Text style={styles.infoCity}>{loadingCity ? "..." : cityTitle}</Text>
              </View>
              <Pressable
                onPress={loadCity}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.refreshBtn}
              >
                <Ionicons name="locate" size={18} color={COLORS.primary} />
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text style={styles.infoSmall}>الزاوية</Text>
                <Text style={styles.infoValue}>
                  {qiblaDegreeText} <Text style={styles.infoSub}>{bearingCardinal}</Text>
                </Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoSmall}>المسافة</Text>
                <Text style={styles.infoValue}>
                  {distanceKm === null ? "--" : distanceKm.toFixed(1)} <Text style={styles.infoSub}>كم</Text>
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.instruction}>
            يرجى وضع الهاتف بشكل مسطح وبعيداً عن الأجسام المغناطيسية للحصول على أدق النتائج.
          </Text>

          {__DEV__ ? (
            <Text style={styles.debugText}>
              {`Heading: ${headingDeg == null ? "--" : Math.round(headingDeg)}° (${source}) acc: ${accuracy ?? "--"}`}
            </Text>
          ) : null}
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

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toCardinal(deg: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
  const idx = Math.round(((deg % 360) / 45));
  return dirs[idx] ?? "N";
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
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 1,
  },
  blobLeft: {
    width: 240,
    height: 200,
    top: -80,
    left: -80,
  },
  blobRight: {
    width: 240,
    height: 200,
    bottom: -80,
    right: -80,
  },
  header: {
    width: "100%",
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: COLORS.primary,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "rgba(61,90,71,0.2)",
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  compassWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  ringOuter: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 999,
    borderWidth: 2,
  },
  ringInner: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 999,
    borderWidth: 1,
    transform: [{ scale: 0.86 }],
  },
  centerDisc: {
    width: "70%",
    height: "70%",
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardinal: {
    position: "absolute",
    fontFamily: "CairoBold",
    fontSize: 12,
    color: COLORS.primary,
  },
  cardinalN: {
    top: 6,
    color: COLORS.accent,
  },
  cardinalS: {
    bottom: 6,
  },
  cardinalE: {
    right: 6,
  },
  cardinalW: {
    left: 6,
  },
  needleWrap: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  needleStemTop: {
    width: 4,
    height: "32%",
    backgroundColor: "#C13C3C",
    borderRadius: 2,
    marginBottom: 6,
  },
  needleStemBottom: {
    width: 4,
    height: "22%",
    backgroundColor: "rgba(61,90,71,0.25)",
    borderRadius: 2,
  },
  needleCenter: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
  },
  kaabaMarker: {
    position: "absolute",
    top: 12,
    alignItems: "center",
  },
  kaabaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginBottom: 4,
  },
  kaabaText: {
    fontFamily: "CairoBold",
    fontSize: 10,
    color: COLORS.accent,
    letterSpacing: 1,
  },
  infoCard: {
    width: "100%",
    borderRadius: 24,
    padding: 16,
    marginTop: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  infoTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#7C7C7C",
  },
  infoCity: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: COLORS.primary,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(61,90,71,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(61,90,71,0.1)",
    marginVertical: 12,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoCol: {
    flex: 1,
    alignItems: "flex-start",
  },
  infoSmall: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#7C7C7C",
  },
  infoValue: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: COLORS.primary,
  },
  infoSub: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#9AA2A9",
  },
  instruction: {
    marginTop: 16,
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#8C8C8C",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  webHint: {
    marginTop: 10,
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#8C8C8C",
    textAlign: "center",
  },
  debugText: {
    marginTop: 6,
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#7B7F86",
  },
});
