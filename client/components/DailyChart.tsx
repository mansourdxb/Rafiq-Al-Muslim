import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import Animated, { FadeIn } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { DailyLog } from "@/types";

interface DailyChartProps {
  dailyLogs: DailyLog[];
}

export function DailyChart({ dailyLogs }: DailyChartProps) {
  const { theme } = useTheme();

  const getLast7Days = () => {
    const days: { date: string; label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayLabel = date.toLocaleDateString("en", { weekday: "short" }).charAt(0);
      const log = dailyLogs.find((l) => l.date === dateStr);
      days.push({ date: dateStr, label: dayLabel, total: log?.total || 0 });
    }
    return days;
  };

  const days = getLast7Days();
  const maxTotal = Math.max(...days.map((d) => d.total), 1);
  const weekTotal = days.reduce((sum, d) => sum + d.total, 0);

  const chartWidth = 280;
  const chartHeight = 100;
  const barWidth = 32;
  const barGap = (chartWidth - barWidth * 7) / 6;

  return (
    <Animated.View 
      entering={FadeIn.duration(400)}
      style={[
        styles.container, 
        { 
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.borderLight,
        }, 
        Shadows.medium
      ]}
    >
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: theme.text }]}>Activity</ThemedText>
        <View style={[styles.totalBadge, { backgroundColor: `${theme.primary}12` }]}>
          <ThemedText style={[styles.total, { color: theme.primary }]}>
            {weekTotal.toLocaleString()} taps
          </ThemedText>
        </View>
      </View>
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight + 28}>
          {days.map((day, index) => {
            const barHeight = day.total > 0 ? Math.max((day.total / maxTotal) * chartHeight, 8) : 8;
            const x = index * (barWidth + barGap);
            const y = chartHeight - barHeight;
            const isToday = index === 6;

            return (
              <React.Fragment key={day.date}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={6}
                  fill={day.total > 0 ? (isToday ? theme.primary : theme.accent) : theme.progressTrack}
                  opacity={day.total > 0 ? (isToday ? 1 : 0.7) : 0.5}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight + 20}
                  fontSize={12}
                  fontWeight={isToday ? "600" : "400"}
                  fill={isToday ? theme.primary : theme.textMuted}
                  textAnchor="middle"
                >
                  {day.label}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  totalBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  total: {
    fontSize: 13,
    fontWeight: "600",
  },
  chartContainer: {
    alignItems: "center",
  },
});
