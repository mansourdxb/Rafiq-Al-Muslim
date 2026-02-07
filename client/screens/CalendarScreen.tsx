import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { typography } from "@/theme/typography";
import DrawerMenuButton from "@/components/navigation/DrawerMenuButton";

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function clamp0(n: number) {
  return n < 0 ? 0 : n;
}

function getCountdown(target: Date): Countdown {
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const totalSec = clamp0(Math.floor(diffMs / 1000));

  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  return { days, hours, minutes, seconds };
}

function TimeCell({
  value,
  label,
  primaryText,
  secondaryText,
}: {
  value: number;
  label: string;
  primaryText: string;
  secondaryText: string;
}) {
  return (
    <View style={styles.timeCell}>
      <Text style={[styles.timeValue, { color: primaryText }]}>
        {String(value).padStart(2, "0")}
      </Text>
      <Text style={[styles.timeLabel, { color: secondaryText }]}>{label}</Text>
    </View>
  );
}

type CalendarColors = {
  cardOuterBackground: string;
  cardInnerBackground: string;
  cardTitleColor: string;
  dividerColor: string;
  primaryText: string;
  secondaryText: string;
};

function CountdownCard({
  title,
  subtitle,
  target,
  colors,
}: {
  title: string;
  subtitle: string;
  target: Date;
  colors: CalendarColors;
}) {
  const [cd, setCd] = useState<Countdown>(() => getCountdown(target));

  useEffect(() => {
    const t = setInterval(() => setCd(getCountdown(target)), 1000);
    return () => clearInterval(t);
  }, [target]);

  const dateStr = `${target.getFullYear()}/${String(target.getMonth() + 1).padStart(2, "0")}/${String(
    target.getDate()
  ).padStart(2, "0")}`;

  return (
    <View style={[styles.cardOuter, { backgroundColor: colors.cardOuterBackground }]}>
      <View style={[styles.cardInner, { backgroundColor: colors.cardInnerBackground }]}>
        <View style={styles.cardTopRow}>
          <Text style={styles.moonIcon}>🌙</Text>
          <Text style={[styles.cardTitle, { color: colors.cardTitleColor }]}>{title}</Text>
        </View>

        <View style={[styles.cardDivider, { backgroundColor: colors.dividerColor }]} />

        <View style={styles.timeRow}>
          <TimeCell
            value={cd.seconds}
            label="ثانية"
            primaryText={colors.primaryText}
            secondaryText={colors.secondaryText}
          />
          <TimeCell
            value={cd.minutes}
            label="دقيقة"
            primaryText={colors.primaryText}
            secondaryText={colors.secondaryText}
          />
          <TimeCell
            value={cd.hours}
            label="ساعة"
            primaryText={colors.primaryText}
            secondaryText={colors.secondaryText}
          />
          <TimeCell
            value={cd.days}
            label="يوم"
            primaryText={colors.primaryText}
            secondaryText={colors.secondaryText}
          />
        </View>

        <Text style={[styles.dateText, { color: colors.secondaryText }]}>{dateStr}</Text>

        <Text style={[styles.cardSubtitle, { color: colors.secondaryText }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const { colors, isDarkMode } = useTheme();

  // Keep phone-like layout even on web
  const maxW = 430;
  const contentWidth = Math.min(width, maxW);
  const headerGradientColors = colors.headerGradient as [string, string, ...string[]];

  const pageBackground = colors.background;
  const calendarColors: CalendarColors = {
    cardOuterBackground: isDarkMode ? "#000000" : "#E7EDF4",
    cardInnerBackground: isDarkMode ? "#2F2F30" : "#FFFFFF",
    cardTitleColor: isDarkMode ? "#FFFFFF" : "#111418",
    dividerColor: isDarkMode ? "rgba(255,255,255,0.10)" : "rgba(17,20,24,0.08)",
    primaryText: isDarkMode ? "#FFFFFF" : "#111418",
    secondaryText: isDarkMode ? "rgba(255,255,255,0.65)" : "rgba(17,20,24,0.55)",
  };
  const sheetBackground = isDarkMode ? "#0D0F12" : "#E9EFF5";

  // ✅ Replace these with your real dates (or compute from Hijri later)
  // For now, using upcoming example dates:
  const ramadanTarget = useMemo(() => {
    // Example: Feb 18, 2026 (matches your screenshot format)
    return new Date(2026, 1, 18, 0, 0, 0);
  }, []);

  const lastTenTarget = useMemo(() => {
    // Example: 10 days after Ramadan start (placeholder)
    const d = new Date(ramadanTarget);
    d.setDate(d.getDate() + 10);
    return d;
  }, [ramadanTarget]);

  return (
    <View style={[styles.root, { backgroundColor: pageBackground }]}>
      <LinearGradient
        colors={headerGradientColors}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={[styles.headerInner, { width: contentWidth }]}>
          <View style={styles.menuButton}>
            <DrawerMenuButton />
          </View>
          <Text style={styles.headerTitle}>المواعيد الإسلامية</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ width: contentWidth }}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.sheet, { backgroundColor: sheetBackground }]}>
          <CountdownCard
            title="رمضان"
            subtitle="العد التنازلي لرمضان"
            target={ramadanTarget}
            colors={calendarColors}
          />

          <View style={{ height: 16 }} />

          <CountdownCard
            title="العشر الأواخر"
            subtitle="العد التنازلي للعشر الأواخر"
            target={lastTenTarget}
            colors={calendarColors}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
  },

  header: {
    width: "100%",
    paddingBottom: 18,
    alignItems: "center",
  },
  headerInner: {
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.screenTitle,
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "900",
    textAlign: "center",
  },
  menuButton: {
    position: "absolute",
    right: 4,
    top: 2,
    zIndex: 5,
  },

  body: {
    flex: 1,
    paddingTop: 12,
  },

  sheet: {
    flex: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 18,
    paddingHorizontal: 14,
  },

  cardOuter: {
    borderRadius: 28,
    padding: 10,
    ...(Platform.OS === "web" ? ({ boxShadow: "0 12px 30px rgba(0,0,0,0.12)" } as any) : null),
  },
  cardInner: {
    borderRadius: 22,
    padding: 18,
  },
  cardTopRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moonIcon: {
    ...typography.numberText,
    fontSize: 22,
    opacity: 0.9,
  },
  cardTitle: {
    ...typography.sectionTitle,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "right",
  },
  cardDivider: {
    marginTop: 12,
    height: 1,
  },

  timeRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeCell: {
    width: "23%",
    alignItems: "center",
  },
  timeValue: {
    ...typography.numberText,
    fontSize: 34,
    fontWeight: "900",
  },
  timeLabel: {
    ...typography.itemSubtitle,
    marginTop: 6,
    fontSize: 14,
    fontWeight: "800",
  },

  dateText: {
    ...typography.itemSubtitle,
    marginTop: 16,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "left",
  },

  cardSubtitle: {
    ...typography.itemSubtitle,
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
});
