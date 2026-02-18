import React, { useMemo } from "react";
import { Platform, StyleProp, Text, View, ViewStyle } from "react-native";
import Svg, { Circle, Line, Text as SvgText, G, Path, Rect } from "react-native-svg";

type ClockVariant =
  | "mint"
  | "minimal"
  | "classic"
  | "arabic"
  | "roman"
  | "sky"
  | "ring"
  | "graphite"
  | "ottoman"
  | "andalusi"
  | "mihrab"
  | "zellige"
  | "kaaba"
  | "crescent";

type AnalogClockProps = {
  size?: number;
  hours: number;
  minutes: number;
  seconds?: number;
  variant?: ClockVariant;
  accent?: string;
  style?: StyleProp<ViewStyle>;
};

type NumberMode = "none" | "full" | "cardinal" | "arabic";

type VariantStyle = {
  face: string;
  rim: string;
  tick: string;
  text: string;
  hour: string;
  minute: string;
  second: string;
  accent: string;
  inner: string | null;
  numberMode: NumberMode;
  arc: { color: string; startDeg: number; endDeg: number } | null;
  islamic?: string;
};

const ROMAN = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
const ARABIC = [
  "\u0661\u0662", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665",
  "\u0666", "\u0667", "\u0668", "\u0669", "\u0661\u0660", "\u0661\u0661",
];
const CARDINALS = ["12", "3", "6", "9"];

/* ────────────────────────────────────────────────
 * Variant colour palettes
 * ──────────────────────────────────────────────── */
function variantColors(variant: ClockVariant, accent?: string): VariantStyle {
  const acc = accent ?? "#2F6E52";
  switch (variant) {
    case "minimal":
      return { face: "#FFFFFF", rim: "#EAEAEA", tick: "#B5B5B5", text: "#6A6A6A", hour: "#111111", minute: "#111111", second: "#C19B53", accent: acc, inner: null, numberMode: "none", arc: null };
    case "classic":
      return { face: "#FFF7E6", rim: "#E4D2B0", tick: "#7D6A4B", text: "#4A3B28", hour: "#4A3B28", minute: "#4A3B28", second: "#B77A2F", accent: acc, inner: null, numberMode: "full", arc: null };
    case "arabic":
      return { face: "#F1F7FF", rim: "#C9DAF2", tick: "#6F89B5", text: "#2A3F63", hour: "#2A3F63", minute: "#2A3F63", second: "#D46B6B", accent: "#3E6AA7", inner: null, numberMode: "full", arc: null };
    case "roman":
      return { face: "#F5F1FF", rim: "#D6C7F1", tick: "#7A6DA8", text: "#3E2F66", hour: "#3E2F66", minute: "#3E2F66", second: "#C19B53", accent: "#6B57A8", inner: null, numberMode: "full", arc: null };
    case "sky":
      return { face: "#7FA7C0", rim: "#5E8AA5", tick: "#E6F2F9", text: "#FFFFFF", hour: "#0B2A36", minute: "#0B2A36", second: "#FFFFFF", accent: "#FFFFFF", inner: "#0E2C38", numberMode: "cardinal", arc: null };
    case "ring":
      return { face: "#7FA7C0", rim: "#5E8AA5", tick: "#E6F2F9", text: "#FFFFFF", hour: "#0B2A36", minute: "#0B2A36", second: "#FFFFFF", accent: "#FFFFFF", inner: "#0E2C38", numberMode: "cardinal", arc: { color: "#E2574C", startDeg: -15, endDeg: 25 } };
    case "graphite":
      return { face: "#1E2422", rim: "#2E3834", tick: "#A7B0AB", text: "#E6EAE7", hour: "#E6EAE7", minute: "#E6EAE7", second: "#C19B53", accent: acc, inner: "#141916", numberMode: "none", arc: null };
    /* ── Islamic variants ── */
    case "ottoman":
      return { face: "#FDF5E6", rim: "#C9A84C", tick: "#8B7332", text: "#5C4A1E", hour: "#4A3B18", minute: "#4A3B18", second: "#C9A84C", accent: "#C9A84C", inner: null, numberMode: "arabic", arc: null, islamic: "ottoman" };
    case "andalusi":
      return { face: "#FDF6EC", rim: "#8B3A3A", tick: "#8B3A3A", text: "#5C1E1E", hour: "#5C1E1E", minute: "#5C1E1E", second: "#C9A84C", accent: "#8B3A3A", inner: null, numberMode: "arabic", arc: null, islamic: "andalusi" };
    case "mihrab":
      return { face: "#E8F0E4", rim: "#5A8A5E", tick: "#3D6B40", text: "#2D5230", hour: "#2D5230", minute: "#2D5230", second: "#C9A84C", accent: "#5A8A5E", inner: null, numberMode: "arabic", arc: null, islamic: "mihrab" };
    case "zellige":
      return { face: "#F4F0E6", rim: "#1B6B5A", tick: "#1B6B5A", text: "#1B6B5A", hour: "#0E3F33", minute: "#0E3F33", second: "#C9A84C", accent: "#1B6B5A", inner: null, numberMode: "arabic", arc: null, islamic: "zellige" };
    case "kaaba":
      return { face: "#F0E8D8", rim: "#8B7332", tick: "#6B5A28", text: "#5C4A1E", hour: "#4A3B18", minute: "#4A3B18", second: "#C9A84C", accent: "#8B7332", inner: "#E8DCC8", numberMode: "arabic", arc: null, islamic: "kaaba" };
    case "crescent":
      return { face: "#E8EDF8", rim: "#9AADD4", tick: "#6B82B8", text: "#4A5E8A", hour: "#3A4D72", minute: "#3A4D72", second: "#C9A84C", accent: "#C9A84C", inner: "#D8E0F0", numberMode: "arabic", arc: null, islamic: "crescent" };
    case "mint":
    default:
      return { face: "#E6F0E9", rim: "#D4E3D8", tick: "#7FA08C", text: "#3B5A4A", hour: "#3D5A47", minute: "#3D5A47", second: "#C19B53", accent: acc, inner: null, numberMode: "none", arc: null };
  }
}

/* ────────────────────────────────────────────────
 * Helpers for SVG geometric patterns
 * ──────────────────────────────────────────────── */
const DEG = Math.PI / 180;

/** Build an 8-pointed star polygon path string */
function eightPointStar(cx: number, cy: number, outerR: number, innerRatio = 0.45): string {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const oA = (i * 45 - 90) * DEG;
    const iA = (i * 45 + 22.5 - 90) * DEG;
    pts.push(`${cx + Math.cos(oA) * outerR},${cy + Math.sin(oA) * outerR}`);
    pts.push(`${cx + Math.cos(iA) * outerR * innerRatio},${cy + Math.sin(iA) * outerR * innerRatio}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

/** Build a 4-pointed star (sparkle) path */
function fourPointStar(cx: number, cy: number, s: number): string {
  return [
    `M ${cx},${cy - s}`, `L ${cx + s * 0.3},${cy - s * 0.3}`,
    `L ${cx + s},${cy}`, `L ${cx + s * 0.3},${cy + s * 0.3}`,
    `L ${cx},${cy + s}`, `L ${cx - s * 0.3},${cy + s * 0.3}`,
    `L ${cx - s},${cy}`, `L ${cx - s * 0.3},${cy - s * 0.3}`, "Z",
  ].join(" ");
}

/* ────────────────────────────────────────────────
 * Islamic decorative overlays
 * ──────────────────────────────────────────────── */
function IslamicOverlay({ type, cx, cy, r, c }: { type: string; cx: number; cy: number; r: number; c: VariantStyle }) {
  const gold = c.accent;

  switch (type) {
    /* ═══ Ottoman: deep navy + gold ═══
       8-point star centre, tulip-arch ring, crescent at 12 */
    case "ottoman": {
      const arches: React.ReactNode[] = [];
      for (let i = 0; i < 8; i++) {
        const a = i * 45;
        const aR = r * 0.88;
        const rad = (a - 90) * DEG;
        const tipX = cx + Math.cos(rad) * aR;
        const tipY = cy + Math.sin(rad) * aR;
        const rL = (a - 12 - 90) * DEG;
        const rR = (a + 12 - 90) * DEG;
        const base = aR - r * 0.1;
        arches.push(
          <Path key={i} d={`M ${cx + Math.cos(rL) * base} ${cy + Math.sin(rL) * base} Q ${tipX} ${tipY} ${cx + Math.cos(rR) * base} ${cy + Math.sin(rR) * base}`}
            stroke={gold} strokeWidth={1.2} fill="none" opacity={0.55} />
        );
      }
      const cY = cy - r * 0.62;
      const cR = r * 0.07;
      return (
        <G>
          <Circle cx={cx} cy={cy} r={r * 0.52} stroke={gold} strokeWidth={0.8} fill="none" opacity={0.22} />
          <Circle cx={cx} cy={cy} r={r * 0.3} stroke={gold} strokeWidth={0.5} fill="none" opacity={0.18} />
          <Path d={eightPointStar(cx, cy, r * 0.2)} fill={gold} opacity={0.1} />
          <Path d={eightPointStar(cx, cy, r * 0.2)} stroke={gold} strokeWidth={0.8} fill="none" opacity={0.3} />
          {arches}
          <Circle cx={cx} cy={cY} r={cR} fill={gold} opacity={0.5} />
          <Circle cx={cx + cR * 0.38} cy={cY - cR * 0.12} r={cR * 0.75} fill={c.face} />
        </G>
      );
    }

    /* ═══ Andalusi: cream + burgundy ═══
       12 pointed arches around rim, Rub el Hizb (two overlapping squares) */
    case "andalusi": {
      const ac = c.rim;
      const arches: React.ReactNode[] = [];
      for (let i = 0; i < 12; i++) {
        const a = i * 30;
        const aR = r * 0.9;
        const rad = (a - 90) * DEG;
        const tip = aR + r * 0.02;
        const rL = (a - 10 - 90) * DEG;
        const rR = (a + 10 - 90) * DEG;
        const base = aR - r * 0.1;
        arches.push(
          <Path key={i} d={`M ${cx + Math.cos(rL) * base} ${cy + Math.sin(rL) * base} Q ${cx + Math.cos(rad) * tip} ${cy + Math.sin(rad) * tip} ${cx + Math.cos(rR) * base} ${cy + Math.sin(rR) * base}`}
            stroke={ac} strokeWidth={1.4} fill="none" opacity={0.35} />
        );
      }
      const sq = r * 0.22;
      return (
        <G>
          <Circle cx={cx} cy={cy} r={r * 0.55} stroke={ac} strokeWidth={0.8} fill="none" opacity={0.14} />
          {arches}
          <Rect x={cx - sq / 2} y={cy - sq / 2} width={sq} height={sq} stroke={ac} strokeWidth={1} fill="none" opacity={0.18} rotation={0} origin={`${cx}, ${cy}`} />
          <Rect x={cx - sq / 2} y={cy - sq / 2} width={sq} height={sq} stroke={ac} strokeWidth={1} fill="none" opacity={0.18} rotation={45} origin={`${cx}, ${cy}`} />
        </G>
      );
    }

    /* ═══ Mihrab: deep green + gold ═══
       Pointed arch at 12 o'clock, concentric rings, 6-pointed seal */
    case "mihrab": {
      const gold = "#C9A84C";
      const aW = r * 0.28;
      const aH = r * 0.22;
      const top = cy - r * 0.72;
      const L = cx - aW / 2;
      const R = cx + aW / 2;
      const bot = top + aH;
      const peak = top - r * 0.06;
      const rings = [0.5, 0.38, 0.26].map((ratio, i) => (
        <Circle key={i} cx={cx} cy={cy} r={r * ratio} stroke={gold} strokeWidth={0.7} fill="none" opacity={0.14 + i * 0.04} />
      ));
      const sR = r * 0.18;
      const hex1: string[] = [];
      const hex2: string[] = [];
      for (let i = 0; i < 3; i++) {
        hex1.push(`${cx + Math.cos((i * 120 - 90) * DEG) * sR},${cy + Math.sin((i * 120 - 90) * DEG) * sR}`);
        hex2.push(`${cx + Math.cos((i * 120 - 30) * DEG) * sR},${cy + Math.sin((i * 120 - 30) * DEG) * sR}`);
      }
      return (
        <G>
          {rings}
          <Path d={`M ${L} ${bot} L ${L} ${top + r * 0.04} Q ${L} ${peak} ${cx} ${peak} Q ${R} ${peak} ${R} ${top + r * 0.04} L ${R} ${bot}`}
            stroke={gold} strokeWidth={1.5} fill="none" opacity={0.4} />
          <Path d={`M ${L + r * 0.04} ${bot - r * 0.02} L ${L + r * 0.04} ${top + r * 0.06} Q ${L + r * 0.04} ${peak + r * 0.03} ${cx} ${peak + r * 0.03} Q ${R - r * 0.04} ${peak + r * 0.03} ${R - r * 0.04} ${top + r * 0.06} L ${R - r * 0.04} ${bot - r * 0.02}`}
            stroke={gold} strokeWidth={0.8} fill="none" opacity={0.25} />
          <Path d={`M ${hex1.join(" L ")} Z`} stroke={gold} strokeWidth={0.8} fill="none" opacity={0.13} />
          <Path d={`M ${hex2.join(" L ")} Z`} stroke={gold} strokeWidth={0.8} fill="none" opacity={0.13} />
          <Circle cx={cx} cy={cy} r={r * 0.04} fill={gold} opacity={0.12} />
        </G>
      );
    }

    /* ═══ Zellige: cream + teal Moroccan mosaic ═══
       Ring of 8 mini 8-point stars + connecting lines + centre star */
    case "zellige": {
      const tc = c.rim;
      const ring = r * 0.68;
      const els: React.ReactNode[] = [];
      for (let i = 0; i < 8; i++) {
        const a = (i * 45 - 90) * DEG;
        const sx = cx + Math.cos(a) * ring;
        const sy = cy + Math.sin(a) * ring;
        const mR = r * 0.07;
        els.push(<Path key={`sf-${i}`} d={eightPointStar(sx, sy, mR)} fill={tc} opacity={0.07} />);
        els.push(<Path key={`so-${i}`} d={eightPointStar(sx, sy, mR)} stroke={tc} strokeWidth={0.8} fill="none" opacity={0.28} />);
        const a2 = ((i + 1) * 45 - 90) * DEG;
        els.push(
          <Line key={`ln-${i}`}
            x1={cx + Math.cos(a) * ring} y1={cy + Math.sin(a) * ring}
            x2={cx + Math.cos(a2) * ring} y2={cy + Math.sin(a2) * ring}
            stroke={tc} strokeWidth={0.6} opacity={0.18} />
        );
      }
      return (
        <G>
          <Circle cx={cx} cy={cy} r={r * 0.52} stroke={tc} strokeWidth={0.6} fill="none" opacity={0.1} />
          {els}
          <Path d={eightPointStar(cx, cy, r * 0.15)} fill={tc} opacity={0.05} />
          <Path d={eightPointStar(cx, cy, r * 0.15)} stroke={tc} strokeWidth={0.8} fill="none" opacity={0.2} />
        </G>
      );
    }

    /* ═══ Kaaba: black + gold Kiswah band ═══
       Geometric diamond band at ~70 % radius, inner star */
    case "kaaba": {
      const gold = "#C9A84C";
      const bR = r * 0.7;
      const bW = r * 0.08;
      const dCount = 16;
      const diamonds: React.ReactNode[] = [];
      for (let i = 0; i < dCount; i++) {
        const a = (i * (360 / dCount) - 90) * DEG;
        const aN = ((i + 0.5) * (360 / dCount) - 90) * DEG;
        diamonds.push(
          <Path key={i}
            d={`M ${cx + Math.cos(a) * bR} ${cy + Math.sin(a) * bR} L ${cx + Math.cos(aN) * (bR - bW / 2)} ${cy + Math.sin(aN) * (bR - bW / 2)} L ${cx + Math.cos(a) * (bR - bW)} ${cy + Math.sin(a) * (bR - bW)}`}
            stroke={gold} strokeWidth={0.6} fill="none" opacity={0.32} />
        );
      }
      return (
        <G>
          <Circle cx={cx} cy={cy} r={bR} stroke={gold} strokeWidth={0.8} fill="none" opacity={0.28} />
          <Circle cx={cx} cy={cy} r={bR - bW} stroke={gold} strokeWidth={0.8} fill="none" opacity={0.28} />
          {diamonds}
          <Circle cx={cx} cy={cy} r={r * 0.35} stroke={gold} strokeWidth={0.5} fill="none" opacity={0.14} />
          <Path d={eightPointStar(cx, cy, r * 0.1)} stroke={gold} strokeWidth={0.8} fill={gold} opacity={0.1} />
        </G>
      );
    }

    /* ═══ Crescent: night sky with crescent moon + sparkle stars ═══ */
    case "crescent": {
      const mR = r * 0.13;
      const mX = cx;
      const mY = cy - r * 0.55;
      const starSpots = [
        { a: 30, d: 0.65, s: 0.025 }, { a: 60, d: 0.7, s: 0.02 },
        { a: 120, d: 0.62, s: 0.018 }, { a: 150, d: 0.68, s: 0.025 },
        { a: 200, d: 0.6, s: 0.015 }, { a: 240, d: 0.66, s: 0.022 },
        { a: 300, d: 0.64, s: 0.018 }, { a: 330, d: 0.7, s: 0.02 },
      ];
      return (
        <G>
          <Circle cx={cx} cy={cy} r={r * 0.5} stroke={c.text} strokeWidth={0.5} fill="none" opacity={0.07} />
          <Circle cx={cx} cy={cy} r={r * 0.35} stroke={c.text} strokeWidth={0.4} fill="none" opacity={0.05} />
          <Circle cx={mX} cy={mY} r={mR} fill={c.second} opacity={0.55} />
          <Circle cx={mX + mR * 0.35} cy={mY - mR * 0.12} r={mR * 0.78} fill={c.face} />
          {starSpots.map((sp, i) => {
            const rad = (sp.a - 90) * DEG;
            return (
              <Path key={i}
                d={fourPointStar(cx + Math.cos(rad) * r * sp.d, cy + Math.sin(rad) * r * sp.d, r * sp.s)}
                fill={c.text} opacity={0.3 + (i % 3) * 0.1} />
            );
          })}
        </G>
      );
    }

    default:
      return null;
  }
}

/* ────────────────────────────────────────────────
 * Main component
 * ──────────────────────────────────────────────── */
export default function AnalogClock({
  size = 180,
  hours,
  minutes,
  seconds = 0,
  variant = "mint",
  accent,
  style,
}: AnalogClockProps) {
  const r = size / 2;
  const center = r;
  const colors = variantColors(variant, accent);

  const hourAngle = ((hours % 12) + minutes / 60) * 30 - 90;
  const minAngle = (minutes + seconds / 60) * 6 - 90;
  const secAngle = seconds * 6 - 90;

  const svgFontFamily = Platform.OS === "web" ? undefined : "CairoBold";
  const isWeb = Platform.OS === "web";
  const isIslamic = !!colors.islamic;

  const numberFontSize = Math.max(10, Math.round(size * 0.08));
  const romanFontSize = Math.max(10, Math.round(size * 0.07));
  const cardinalFontSize = Math.max(9, Math.round(size * 0.07));

  const numDist = isIslamic ? r * 0.68 : r * 0.72;

  const labelPositions = useMemo(() => {
    if (colors.numberMode === "none") return [];
    const positions: { label: string; x: number; y: number; kind: string }[] = [];
    if (colors.numberMode === "cardinal") {
      const placements = [
        { label: CARDINALS[0], angle: -90 },
        { label: CARDINALS[1], angle: 0 },
        { label: CARDINALS[2], angle: 90 },
        { label: CARDINALS[3], angle: 180 },
      ];
      for (const item of placements) {
        const rad = item.angle * DEG;
        positions.push({ label: item.label, x: center + Math.cos(rad) * (r * 0.64), y: center + Math.sin(rad) * (r * 0.64), kind: "cardinal" });
      }
      return positions;
    }
    const labels =
      variant === "roman" ? ROMAN :
      (colors.numberMode === "arabic" || variant === "arabic") ? ARABIC : ROMAN;
    labels.forEach((label, i) => {
      const angle = (i * 30 - 60) * DEG;
      positions.push({ label, x: center + Math.cos(angle) * numDist, y: center + Math.sin(angle) * numDist, kind: "full" });
    });
    return positions;
  }, [variant, colors.numberMode, isIslamic, center, r, numDist]);

  const numbers = useMemo(() => {
    if (isWeb) return null;
    if (colors.numberMode === "none") return null;
    if (colors.numberMode === "cardinal") {
      const placements = [
        { label: CARDINALS[0], angle: -90 },
        { label: CARDINALS[1], angle: 0 },
        { label: CARDINALS[2], angle: 90 },
        { label: CARDINALS[3], angle: 180 },
      ];
      return placements.map((item) => {
        const rad = item.angle * DEG;
        return (
          <SvgText key={item.label} x={center + Math.cos(rad) * (r * 0.64)} y={center + Math.sin(rad) * (r * 0.64) + 4}
            fill={colors.text} fontSize={cardinalFontSize} fontWeight="700" fontFamily={svgFontFamily as any} textAnchor="middle">
            {item.label}
          </SvgText>
        );
      });
    }
    const labels =
      variant === "roman" ? ROMAN :
      (colors.numberMode === "arabic" || variant === "arabic") ? ARABIC : ROMAN;
    return labels.map((label, i) => {
      const angle = (i * 30 - 60) * DEG;
      return (
        <SvgText key={label} x={center + Math.cos(angle) * numDist} y={center + Math.sin(angle) * numDist + 4}
          fill={colors.text} fontSize={variant === "roman" ? romanFontSize : numberFontSize}
          fontWeight="700" fontFamily={svgFontFamily as any} textAnchor="middle">
          {label}
        </SvgText>
      );
    });
  }, [variant, colors, center, r, numDist]);

  const arcPath = useMemo(() => {
    if (!colors.arc) return null;
    const radius = r * 0.88;
    const start = (colors.arc.startDeg - 90) * DEG;
    const end = (colors.arc.endDeg - 90) * DEG;
    const x1 = center + Math.cos(start) * radius;
    const y1 = center + Math.sin(start) * radius;
    const x2 = center + Math.cos(end) * radius;
    const y2 = center + Math.sin(end) * radius;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  }, [colors.arc, center, r]);

  const tickInner = isIslamic ? r * 0.78 : r * 0.76;
  const tickInnerMin = isIslamic ? r * 0.84 : r * 0.82;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 4,
          backgroundColor: "transparent",
        },
        style as any,
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Face & rim */}
        <Circle cx={center} cy={center} r={r - 1} fill={colors.face} />
        <Circle cx={center} cy={center} r={r - 2} stroke={colors.rim} strokeWidth={isIslamic ? 3 : 2} />
        {!isIslamic && <Circle cx={center} cy={center} r={r * 0.84} stroke={colors.rim} strokeWidth={1} opacity={0.5} />}
        {colors.inner ? <Circle cx={center} cy={center} r={r * 0.48} fill={colors.inner} /> : null}
        {arcPath ? <Path d={arcPath} stroke={colors.arc?.color} strokeWidth={4} strokeLinecap="round" fill="none" /> : null}

        {/* Islamic decorative overlay (behind ticks & hands) */}
        {colors.islamic ? <IslamicOverlay type={colors.islamic} cx={center} cy={center} r={r} c={colors} /> : null}

        {/* Ticks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const isHour = i % 5 === 0;
          const angle = (i * 6 - 90) * DEG;
          const inner = isHour ? tickInner : tickInnerMin;
          const outer = r * 0.92;
          return (
            <Line key={`t-${i}`}
              x1={center + Math.cos(angle) * inner} y1={center + Math.sin(angle) * inner}
              x2={center + Math.cos(angle) * outer} y2={center + Math.sin(angle) * outer}
              stroke={colors.tick} strokeWidth={isHour ? (isIslamic ? 2.5 : 2) : 1}
              strokeLinecap="round" opacity={isHour ? 1 : 0.6} />
          );
        })}

        {/* Numbers */}
        {numbers}

        {/* Hour hand */}
        <G rotation={hourAngle} origin={`${center}, ${center}`}>
          <Line x1={center} y1={center} x2={center + r * 0.36} y2={center} stroke={colors.hour} strokeWidth={5} strokeLinecap="round" />
        </G>
        {/* Minute hand */}
        <G rotation={minAngle} origin={`${center}, ${center}`}>
          <Line x1={center} y1={center} x2={center + r * 0.5} y2={center} stroke={colors.minute} strokeWidth={3} strokeLinecap="round" />
        </G>
        {/* Second hand */}
        {seconds !== undefined ? (
          <G rotation={secAngle} origin={`${center}, ${center}`}>
            <Line x1={center} y1={center} x2={center + r * 0.62} y2={center} stroke={colors.second} strokeWidth={2} strokeLinecap="round" />
          </G>
        ) : null}

        {/* Center dot */}
        <Circle cx={center} cy={center} r={6} fill={colors.accent} />
        <Circle cx={center} cy={center} r={3} fill="#FFFFFF" opacity={0.8} />
      </Svg>

      {/* Web number overlay */}
      {isWeb && labelPositions.length ? (
        <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, width: size, height: size }}>
          {labelPositions.map((item) => {
            const fontSize = item.kind === "cardinal" ? cardinalFontSize : (variant === "roman" ? romanFontSize : numberFontSize);
            return (
              <Text key={`${item.label}-${item.x}-${item.y}`}
                style={{
                  position: "absolute", left: item.x, top: item.y,
                  transform: [{ translateX: -10 }, { translateY: -8 }],
                  minWidth: 20, textAlign: "center",
                  color: colors.text, fontSize, fontWeight: "700",
                }}>
                {item.label}
              </Text>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}