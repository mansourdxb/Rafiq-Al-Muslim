import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Svg, {
  Circle as SvgCircle,
  Line,
  Path,
  Text as SvgText,
  G,
} from "react-native-svg";

import CityPickerModal from "@/screens/qibla/components/CityPickerModal";
import type { City } from "@/screens/qibla/services/preferences";
import { getSelectedCity, setSelectedCity } from "@/screens/qibla/services/preferences";
import { getCityFromGPS } from "@/screens/qibla/services/cityService";
import { useDeviceHeading } from "@/src/hooks/useDeviceHeading";

/* ═══════════════════════════════════════════════════════════════════════════
 *  CONSTANTS
 * ═══════════════════════════════════════════════════════════════════════════*/

const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

const C = {
  primary: "#3D5A47",
  accent: "#C19B53",
  green: "#2E7D32",
  bg: "#F5F6F5",
  card: "#FFFFFF",
  muted: "#8C8C8C",
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  SMOOTHING — timer-based polling, NOT reactive to every sensor update
 *
 *  The key insight: reacting to every sensor update (60/sec) causes jitter
 *  even with filtering, because each React state change interrupts the
 *  current animation. Instead, we:
 *
 *    1. Accumulate raw readings into a sin/cos low-pass filter (runs on
 *       every sensor event via a ref, NO re-render).
 *    2. A 500ms interval reads the filtered value and emits it — this is
 *       the ONLY thing that triggers re-renders and new animations.
 *    3. Dead zone: skip if change < 3°.
 *    4. Animations run for 800ms — they fully complete before the next
 *       update arrives (500ms interval + dead zone = very few updates).
 * ═══════════════════════════════════════════════════════════════════════════*/

function angleDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

/**
 * Accumulates raw heading into a low-pass filter (via ref, no re-render).
 * A 500ms timer polls the filtered value and emits it as state.
 */
function useStableHeading(rawDeg: number | null): number {
  const ALPHA = 0.008;          // extremely heavy — ~125 readings to settle
  const DEAD_ZONE = 3;          // ignore changes smaller than 3°
  const POLL_MS = 500;          // only check every 500ms

  // Filter state (refs — no re-renders)
  const sinRef = useRef(0);
  const cosRef = useRef(1);
  const filteredRef = useRef(0);
  const initRef = useRef(false);
  const lastRawRef = useRef<number | null>(null);

  // Output state (triggers re-render + animation)
  const outputRef = useRef(0);
  const [stable, setStable] = useState(0);

  // Step 1: Feed every raw reading into the low-pass filter (NO re-render)
  lastRawRef.current = rawDeg;
  if (rawDeg != null) {
    const rad = (rawDeg * Math.PI) / 180;
    if (!initRef.current) {
      sinRef.current = Math.sin(rad);
      cosRef.current = Math.cos(rad);
      filteredRef.current = rawDeg;
      outputRef.current = rawDeg;
      initRef.current = true;
    } else {
      sinRef.current += ALPHA * (Math.sin(rad) - sinRef.current);
      cosRef.current += ALPHA * (Math.cos(rad) - cosRef.current);
      let a = (Math.atan2(sinRef.current, cosRef.current) * 180) / Math.PI;
      filteredRef.current = (a + 360) % 360;
    }
  }

  // Step 2: Timer polls filtered value every 500ms
  useEffect(() => {
    const timer = setInterval(() => {
      if (!initRef.current) return;
      const filtered = filteredRef.current;
      const delta = Math.abs(angleDelta(outputRef.current, filtered));
      if (delta < DEAD_ZONE) return; // nothing meaningful changed
      outputRef.current = filtered;
      setStable(filtered);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  return stable;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  SVG COMPONENTS
 * ═══════════════════════════════════════════════════════════════════════════*/

/** Kaaba icon (simple cube) */
function KaabaIcon({ size = 40 }: { size?: number }) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 40 40">
      {/* Main cube face */}
      <Path d="M8 12L20 6L32 12V32H8V12Z" fill="#6B6B6B" />
      {/* Top face */}
      <Path d="M8 12L20 6L32 12L20 18Z" fill="#888" />
      {/* Side face */}
      <Path d="M20 18L32 12V32L20 38Z" fill="#555" />
      {/* Front face */}
      <Path d="M8 12L20 18V38L8 32Z" fill="#6B6B6B" />
      {/* Door */}
      <Path d="M16 32V25H22V32" fill="none" stroke="#DDD" strokeWidth={0.8} />
    </Svg>
  );
}

/**
 * Compass ring SVG — drawn once, rotated as a whole by the Animated wrapper.
 * Includes: outer ring, tick marks, N/S/E/W labels, and the Qibla triangle.
 */
function CompassDial({
  size,
  qiblaBearing,
}: {
  size: number;
  qiblaBearing: number | null;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 6;
  const tickOuter = outerR - 1;
  const tickInnerMajor = tickOuter - 16;
  const tickInnerMinor = tickOuter - 8;
  const labelR = outerR - 32;

  // Tick marks every 6°
  const ticks: React.ReactElement[] = [];
  for (let deg = 0; deg < 360; deg += 6) {
    const isMajor = deg % 30 === 0;
    const rad = ((deg - 90) * Math.PI) / 180;
    const r1 = tickOuter;
    const r2 = isMajor ? tickInnerMajor : tickInnerMinor;
    ticks.push(
      <Line
        key={deg}
        x1={cx + r1 * Math.cos(rad)}
        y1={cy + r1 * Math.sin(rad)}
        x2={cx + r2 * Math.cos(rad)}
        y2={cy + r2 * Math.sin(rad)}
        stroke={isMajor ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.15)"}
        strokeWidth={isMajor ? 2.5 : 1}
        strokeLinecap="round"
      />
    );
  }

  // Cardinal & intercardinal labels
  const labels = [
    { t: "N", deg: 0, bold: true, col: C.accent },
    { t: "NE", deg: 45, bold: false, col: "rgba(0,0,0,0.3)" },
    { t: "E", deg: 90, bold: true, col: "rgba(0,0,0,0.55)" },
    { t: "SE", deg: 135, bold: false, col: "rgba(0,0,0,0.3)" },
    { t: "S", deg: 180, bold: true, col: "rgba(0,0,0,0.55)" },
    { t: "SW", deg: 225, bold: false, col: "rgba(0,0,0,0.3)" },
    { t: "W", deg: 270, bold: true, col: "rgba(0,0,0,0.55)" },
    { t: "NW", deg: 315, bold: false, col: "rgba(0,0,0,0.3)" },
  ];

  // Qibla triangle on the ring
  const qiblaElements: React.ReactElement[] = [];
  if (qiblaBearing != null) {
    const qRad = ((qiblaBearing - 90) * Math.PI) / 180;
    const triR = outerR + 4; // just outside the ring
    const triCx = cx + triR * Math.cos(qRad);
    const triCy = cy + triR * Math.sin(qRad);
    // Triangle pointing inward toward center
    const triSize = 10;
    const inRad = qRad + Math.PI; // inward direction
    const perpRad = inRad + Math.PI / 2;
    const tipX = triCx + triSize * Math.cos(inRad);
    const tipY = triCy + triSize * Math.sin(inRad);
    const baseX1 = triCx + (triSize * 0.6) * Math.cos(perpRad);
    const baseY1 = triCy + (triSize * 0.6) * Math.sin(perpRad);
    const baseX2 = triCx - (triSize * 0.6) * Math.cos(perpRad);
    const baseY2 = triCy - (triSize * 0.6) * Math.sin(perpRad);
    qiblaElements.push(
      <Path
        key="qibla-tri"
        d={`M${tipX} ${tipY} L${baseX1} ${baseY1} L${baseX2} ${baseY2} Z`}
        fill="#333"
      />
    );
  }

  return (
    <Svg width={size} height={size}>
      {/* Outer ring */}
      <SvgCircle
        cx={cx}
        cy={cy}
        r={outerR}
        fill="none"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth={1}
      />
      {/* Ticks */}
      {ticks}
      {/* Labels */}
      {labels.map((l) => {
        const rad = ((l.deg - 90) * Math.PI) / 180;
        return (
          <SvgText
            key={l.t}
            x={cx + labelR * Math.cos(rad)}
            y={cy + labelR * Math.sin(rad) + 1}
            fill={l.col}
            fontSize={l.bold ? 14 : 10}
            fontWeight={l.bold ? "700" : "400"}
            textAnchor="middle"
            alignmentBaseline="central"
          >
            {l.t}
          </SvgText>
        );
      })}
      {/* Qibla triangle marker */}
      {qiblaElements}
      {/* Center dot */}
      <SvgCircle cx={cx} cy={cy} r={6} fill={C.accent} />
    </Svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════*/

export default function KaabaDirection() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 430);
  const headerPadTop = useMemo(() => insets.top + 8, [insets.top]);

  const [selectedCity, setSelectedCityState] = useState<City | null>(null);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);
  const [cityLookupFailed, setCityLookupFailed] = useState(false);
  const [autoOpenedPickerOnWeb, setAutoOpenedPickerOnWeb] = useState(false);
  const hasLoadedRef = useRef(false);
  const cityVersionRef = useRef(0);

  const { headingDeg, accuracy, source } = useDeviceHeading();

  /* ── Stable heading (heavy smoothing + dead zone + throttle) ──────── */
  const stableHeading = useStableHeading(headingDeg);

  /* ── Animated compass rotation ────────────────────────────────────── */
  const dialAnim = useRef(new Animated.Value(0)).current;
  const contAngle = useRef(0);

  useEffect(() => {
    // Compass ring rotates by -heading so N points to real north
    const target = -stableHeading;
    const delta = angleDelta(-contAngle.current % 360, target);
    contAngle.current += delta;

    Animated.timing(dialAnim, {
      toValue: contAngle.current,
      duration: 800,          // slow, smooth — completes before next poll
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [stableHeading]);

  const dialRotation = dialAnim.interpolate({
    inputRange: [-36000, 36000],
    outputRange: ["-36000deg", "36000deg"],
  });

  /* ── Qibla bearing ────────────────────────────────────────────────── */
  const qiblaBearing = selectedCity
    ? computeQiblaBearing(selectedCity.lat, selectedCity.lon)
    : null;

  // Is the qibla triangle near the top (within ±8°)?
  const isOnQibla =
    qiblaBearing != null && headingDeg != null
      ? Math.abs(angleDelta(stableHeading, qiblaBearing)) < 8
      : false;

  /* ── City loading ─────────────────────────────────────────────────── */
  const loadCity = useCallback(async () => {
    setLoadingCity(true);
    setCityLookupFailed(false);
    const v = cityVersionRef.current;
    const savedCity = await getSelectedCity();
    if (v !== cityVersionRef.current) { setLoadingCity(false); return; }

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
        if (v !== cityVersionRef.current) { setLoadingCity(false); return; }
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
        if (v !== cityVersionRef.current) { setLoadingCity(false); return; }
        setCityLookupFailed(true);
        if (Platform.OS === "web" && !autoOpenedPickerOnWeb) {
          setIsCityPickerOpen(true);
          setAutoOpenedPickerOnWeb(true);
        }
      }
    }

    if (v !== cityVersionRef.current) { setLoadingCity(false); return; }
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

  /* ── Display values ──────────────────────────────────────────────── */
  const cityTitle = !selectedCity || isUnknownCityName(selectedCity.name)
    ? "--"
    : selectedCity.name;
  const cityNameOnly = selectedCity?.name?.split(",")[0]?.trim() ?? "--";

  const headingText =
    headingDeg != null ? `${Math.round(stableHeading)}` : "--";
  const qiblaText =
    qiblaBearing != null ? `${Math.round(qiblaBearing)}` : "--";
  const distanceKm =
    selectedCity
      ? haversineKm(selectedCity.lat, selectedCity.lon, KAABA_LAT, KAABA_LON)
      : null;

  const compassSize = Math.min(contentWidth - 48, 320);

  return (
    <View style={styles.root}>
      {/* ─── Header ─── */}
      <View style={[styles.header, { paddingTop: headerPadTop }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => {
              if (navigation.canGoBack?.()) navigation.goBack();
              else navigation.navigate("PrayerTimes");
            }}
            hitSlop={8}
            style={styles.headerBtn}
          >
            <Ionicons name="chevron-back" size={18} color={C.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>اتجاه القبلة</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <View style={styles.body}>
        {/* ─── Fixed Kaaba at top ─── */}
        <View style={styles.kaabaWrap}>
          <KaabaIcon size={44} />
        </View>

        {/* ─── Compass ─── */}
        <View style={[styles.compassOuter, { width: compassSize, height: compassSize }]}>
          {/* Rotating dial */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { transform: [{ rotate: dialRotation }] },
            ]}
          >
            <CompassDial size={compassSize} qiblaBearing={qiblaBearing} />
          </Animated.View>
        </View>

        {/* ─── Heading degrees ─── */}
        <Text style={styles.headingDeg}>{headingText}°</Text>

        {/* ─── Info text ─── */}
        <Text style={styles.infoLine}>
          اتجاه للقبلة التقريبي في موقعك
        </Text>
        <Text style={styles.infoCity}>
          {loadingCity ? "..." : cityNameOnly} {qiblaText}°
        </Text>

        {/* ─── On-Qibla badge ─── */}
        {isOnQibla && (
          <View style={styles.onQiblaBadge}>
            <Ionicons name="checkmark-circle" size={16} color={C.green} />
            <Text style={styles.onQiblaText}>أنت تواجه القبلة</Text>
          </View>
        )}

        {/* ─── Distance ─── */}
        {distanceKm != null && (
          <Text style={styles.distance}>
            المسافة: {distanceKm.toFixed(1)} كم
          </Text>
        )}

        {headingDeg === null && Platform.OS === "web" ? (
          <Text style={styles.hint}>
            Compass sensor not available on web.
          </Text>
        ) : null}

        <Text style={styles.instruction}>
          يرجى وضع الهاتف بشكل مسطح وبعيداً عن الأجسام المغناطيسية
        </Text>

        {/* City change button */}
        <Pressable
          onPress={() => setIsCityPickerOpen(true)}
          style={styles.changeCityBtn}
        >
          <Ionicons name="locate" size={16} color={C.primary} />
          <Text style={styles.changeCityText}>تغيير المدينة</Text>
        </Pressable>
      </View>

      <CityPickerModal
        visible={isCityPickerOpen}
        onClose={() => setIsCityPickerOpen(false)}
        onSelect={handleCitySelect}
      />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  GEO MATH
 * ═══════════════════════════════════════════════════════════════════════════*/

function computeQiblaBearing(lat: number, lon: number): number {
  const phi1 = toRad(lat);
  const phi2 = toRad(KAABA_LAT);
  const dLon = toRad(KAABA_LON - lon);
  const y = Math.sin(dLon) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(d: number) { return (d * Math.PI) / 180; }
function toDeg(r: number) { return (r * 180) / Math.PI; }

function isUnknownCityName(name?: string | null): boolean {
  if (!name) return true;
  const t = name.trim().toLowerCase();
  if (t === "" || t === "unknown") return true;
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(t);
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  STYLES
 * ═══════════════════════════════════════════════════════════════════════════*/

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    width: "100%",
    paddingBottom: 4,
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
    color: C.primary,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "rgba(61,90,71,0.15)",
  },
  headerSpacer: { width: 36 },

  body: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },

  /* Kaaba fixed at top */
  kaabaWrap: {
    marginTop: 16,
    marginBottom: 16,
    alignItems: "center",
  },

  /* Compass */
  compassOuter: {
    alignItems: "center",
    justifyContent: "center",
  },

  /* Heading degrees (big text below compass) */
  headingDeg: {
    fontFamily: "CairoBold",
    fontSize: 48,
    color: "#222",
    marginTop: 24,
    letterSpacing: -1,
  },

  /* Info line */
  infoLine: {
    fontFamily: "Cairo",
    fontSize: 13,
    color: C.muted,
    marginTop: 8,
    textAlign: "center",
  },
  infoCity: {
    fontFamily: "CairoBold",
    fontSize: 15,
    color: "#444",
    marginTop: 2,
    textAlign: "center",
  },

  /* On-qibla badge */
  onQiblaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(46,125,50,0.1)",
  },
  onQiblaText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: C.green,
  },

  distance: {
    fontFamily: "Cairo",
    fontSize: 13,
    color: C.muted,
    marginTop: 10,
  },

  hint: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: C.muted,
    marginTop: 10,
    textAlign: "center",
  },
  instruction: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#AAA",
    marginTop: 16,
    textAlign: "center",
    lineHeight: 20,
  },

  changeCityBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(61,90,71,0.08)",
  },
  changeCityText: {
    fontFamily: "CairoBold",
    fontSize: 13,
    color: C.primary,
  },
});