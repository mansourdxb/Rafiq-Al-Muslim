import React, { useMemo } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Svg, { Circle, Line, Text as SvgText, G } from "react-native-svg";

type ClockVariant = "mint" | "minimal" | "classic" | "arabic" | "roman";

type AnalogClockProps = {
  size?: number;
  hours: number;
  minutes: number;
  seconds?: number;
  variant?: ClockVariant;
  accent?: string;
  style?: StyleProp<ViewStyle>;
};

const ROMAN = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
const ARABIC = ["??", "?", "?", "?", "?", "?", "?", "?", "?", "?", "??", "??"];

function variantColors(variant: ClockVariant, accent?: string) {
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
    if (variant === "minimal" || variant === "mint") return null;
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
  }, [variant, colors.text, center, r]);

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
