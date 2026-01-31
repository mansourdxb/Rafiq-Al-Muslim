import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
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
  const chartHeight = 120;
  const barWidth = 28;
  const barGap = (chartWidth - barWidth * 7) / 6;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }, Shadows.small]}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: theme.text }]}>This Week</ThemedText>
        <ThemedText style={[styles.total, { color: theme.primary }]}>
          {weekTotal.toLocaleString()} total
        </ThemedText>
      </View>
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight + 24}>
          {days.map((day, index) => {
            const barHeight = day.total > 0 ? (day.total / maxTotal) * chartHeight : 4;
            const x = index * (barWidth + barGap);
            const y = chartHeight - barHeight;

            return (
              <React.Fragment key={day.date}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill={day.total > 0 ? theme.primary : theme.progressBackground}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight + 18}
                  fontSize={12}
                  fill={theme.textSecondary}
                  textAnchor="middle"
                >
                  {day.label}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  total: {
    fontSize: 14,
    fontWeight: "500",
  },
  chartContainer: {
    alignItems: "center",
  },
});
