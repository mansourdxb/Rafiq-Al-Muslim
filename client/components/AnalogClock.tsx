import React, { useMemo } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Svg, { Circle, Line, Text as SvgText, G, Path } from "react-native-svg";

type ClockVariant =
  | "mint"
  | "minimal"
  | "classic"
  | "arabic"
  | "roman"
  | "sky"
  | "ring"
  | "graphite";

type AnalogClockProps = {
  size?: number;
  hours: number;
  minutes: number;
  seconds?: number;
  variant?: ClockVariant;
  accent?: string;
  style?: StyleProp<ViewStyle>;
};

type NumberMode = "none" | "full" | "cardinal";

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
};

const ROMAN = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
const ARABIC = ["١٢", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "١٠", "١١"];
const CARDINALS = ["12", "3", "6", "9"];

function variantColors(variant: ClockVariant, accent?: string): VariantStyle {
  const acc = accent ?? "#2F6E52";
  switch (variant) {
    case "minimal":
      return {
        face: "#FFFFFF",
        rim: "#E6ECE7",
        tick: "#9BA7A0",
        text: "#6E7B73",
        hour: "#2F6E52",
        minute: "#2F6E52",
        second: "#C19B53",
        accent: acc,
        inner: null,
        numberMode: "none",
        arc: null,
      };
    case "classic":
      return {
        face: "#FFFDF7",
        rim: "#D9D0C2",
        tick: "#6F6456",
        text: "#2B261F",
        hour: "#2B261F",
        minute: "#2B261F",
        second: "#C19B53",
        accent: acc,
        inner: null,
        numberMode: "full",
        arc: null,
      };
    case "arabic":
      return {
        face: "#FFFDF7",
        rim: "#E6E1D6",
        tick: "#7A746A",
        text: "#2B261F",
        hour: "#2B261F",
        minute: "#2B261F",
        second: "#C19B53",
        accent: acc,
        inner: null,
        numberMode: "full",
        arc: null,
      };
    case "roman":
      return {
        face: "#FFFFFF",
        rim: "#E6E6E6",
        tick: "#7A7A7A",
        text: "#2B2B2B",
        hour: "#2B2B2B",
        minute: "#2B2B2B",
        second: "#C19B53",
        accent: acc,
        inner: null,
        numberMode: "full",
        arc: null,
      };
    case "sky":
      return {
        face: "#7FA7C0",
        rim: "#5E8AA5",
        tick: "#E6F2F9",
        text: "#FFFFFF",
        hour: "#0B2A36",
        minute: "#0B2A36",
        second: "#FFFFFF",
        accent: "#FFFFFF",
        inner: "#0E2C38",
        numberMode: "cardinal",
        arc: null,
      };
    case "ring":
      return {
        face: "#7FA7C0",
        rim: "#5E8AA5",
        tick: "#E6F2F9",
        text: "#FFFFFF",
        hour: "#0B2A36",
        minute: "#0B2A36",
        second: "#FFFFFF",
        accent: "#FFFFFF",
        inner: "#0E2C38",
        numberMode: "cardinal",
        arc: { color: "#E2574C", startDeg: -15, endDeg: 25 },
      };
    case "graphite":
      return {
        face: "#1E2422",
        rim: "#2E3834",
        tick: "#A7B0AB",
        text: "#E6EAE7",
        hour: "#E6EAE7",
        minute: "#E6EAE7",
        second: "#C19B53",
        accent: acc,
        inner: "#141916",
        numberMode: "none",
        arc: null,
      };
    case "mint":
    default:
      return {
        face: "#E6F0E9",
        rim: "#D4E3D8",
        tick: "#7FA08C",
        text: "#3B5A4A",
        hour: "#3D5A47",
        minute: "#3D5A47",
        second: "#C19B53",
        accent: acc,
        inner: null,
        numberMode: "none",
        arc: null,
      };
  }
}

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

  const numbers = useMemo(() => {
    if (colors.numberMode === "none") return null;
    if (colors.numberMode === "cardinal") {
      const placements = [
        { label: CARDINALS[0], angle: -90 },
        { label: CARDINALS[1], angle: 0 },
        { label: CARDINALS[2], angle: 90 },
        { label: CARDINALS[3], angle: 180 },
      ];
      return placements.map((item) => {
        const rad = item.angle * (Math.PI / 180);
        const nx = center + Math.cos(rad) * (r * 0.64);
        const ny = center + Math.sin(rad) * (r * 0.64) + 4;
        return (
          <SvgText
            key={item.label}
            x={nx}
            y={ny}
            fill={colors.text}
            fontSize={12}
            fontWeight="700"
            textAnchor="middle"
          >
            {item.label}
          </SvgText>
        );
      });
    }
    const labels = variant === "roman" ? ROMAN : variant === "arabic" ? ARABIC : ROMAN;
    return labels.map((label, i) => {
      const angle = (i * 30 - 60) * (Math.PI / 180);
      const nx = center + Math.cos(angle) * (r * 0.72);
      const ny = center + Math.sin(angle) * (r * 0.72) + 4;
      return (
        <SvgText
          key={label}
          x={nx}
          y={ny}
          fill={colors.text}
          fontSize={variant === "roman" ? 11 : 12}
          fontWeight="700"
          textAnchor="middle"
        >
          {label}
        </SvgText>
      );
    });
  }, [variant, colors, center, r]);

  const arcPath = useMemo(() => {
    if (!colors.arc) return null;
    const radius = r * 0.88;
    const start = (colors.arc.startDeg - 90) * (Math.PI / 180);
    const end = (colors.arc.endDeg - 90) * (Math.PI / 180);
    const x1 = center + Math.cos(start) * radius;
    const y1 = center + Math.sin(start) * radius;
    const x2 = center + Math.cos(end) * radius;
    const y2 = center + Math.sin(end) * radius;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  }, [colors.arc, center, r]);

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
        <Circle cx={center} cy={center} r={r - 1} fill={colors.face} />
        <Circle cx={center} cy={center} r={r - 2} stroke={colors.rim} strokeWidth={2} />
        <Circle cx={center} cy={center} r={r * 0.84} stroke={colors.rim} strokeWidth={1} opacity={0.5} />
        {colors.inner ? <Circle cx={center} cy={center} r={r * 0.48} fill={colors.inner} /> : null}
        {arcPath ? (
          <Path d={arcPath} stroke={colors.arc?.color} strokeWidth={4} strokeLinecap="round" fill="none" />
        ) : null}

        {Array.from({ length: 60 }).map((_, i) => {
          const isHour = i % 5 === 0;
          const angle = (i * 6 - 90) * (Math.PI / 180);
          const inner = r * (isHour ? 0.76 : 0.82);
          const outer = r * 0.92;
          const x1 = center + Math.cos(angle) * inner;
          const y1 = center + Math.sin(angle) * inner;
          const x2 = center + Math.cos(angle) * outer;
          const y2 = center + Math.sin(angle) * outer;
          return (
            <Line
              key={`t-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={colors.tick}
              strokeWidth={isHour ? 2 : 1}
              strokeLinecap="round"
              opacity={isHour ? 1 : 0.6}
            />
          );
        })}

        {numbers}

        <G rotation={hourAngle} origin={`${center}, ${center}`}>
          <Line
            x1={center}
            y1={center}
            x2={center + r * 0.36}
            y2={center}
            stroke={colors.hour}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </G>
        <G rotation={minAngle} origin={`${center}, ${center}`}>
          <Line
            x1={center}
            y1={center}
            x2={center + r * 0.5}
            y2={center}
            stroke={colors.minute}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </G>
        {seconds !== undefined ? (
          <G rotation={secAngle} origin={`${center}, ${center}`}>
            <Line
              x1={center}
              y1={center}
              x2={center + r * 0.62}
              y2={center}
              stroke={colors.second}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </G>
        ) : null}

        <Circle cx={center} cy={center} r={6} fill={colors.accent} />
        <Circle cx={center} cy={center} r={3} fill="#FFFFFF" opacity={0.8} />
      </Svg>
    </View>
  );
}
