import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { typography } from "@/theme/typography";

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type EventItem = {
  id: string;
  title: string;
  date: Date;
  dateLabel: string;
  showBell?: boolean;
  bellText?: string;
  unavailable?: boolean;
};

const EVENTS: EventItem[] = [
  {
    id: "ramadan",
    title: "رمضان",
    date: new Date(2026, 2, 1, 0, 0, 0),
    dateLabel: "1 مارس 2026",
    showBell: true,
    bellText: "التنبيه قبل الحدث",
  },
  {
    id: "last-ten",
    title: "العشر الأواخر",
    date: new Date(2026, 2, 20, 0, 0, 0),
    dateLabel: "20 مارس 2026",
    showBell: true,
    bellText: "تذكير عند بداية العشر",
  },
  {
    id: "eid",
    title: "عيد الفطر",
    date: new Date(2026, 3, 1, 0, 0, 0),
    dateLabel: "1 أبريل 2026",
  },
];

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

function formatNumber(n: number) {
  return String(n).toLocaleString("en-US");
}

function getIslamicParts(date: Date): { iy: number; im: number; id: number } | null {
  try {
    const fmt = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    const parts = fmt.formatToParts(date);
    const day = Number(parts.find((p) => p.type === "day")?.value);
    const month = Number(parts.find((p) => p.type === "month")?.value);
    const year = Number(parts.find((p) => p.type === "year")?.value);
    if (!day || !month || !year) return null;
    return { iy: year, im: month, id: day };
  } catch {
    return null;
  }
}

function findNextIslamicDate(
  target: { month: number; day: number },
  fromDate: Date
): Date | null {
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i <= 400; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const parts = getIslamicParts(d);
    if (!parts) return null;
    if (parts.im === target.month && parts.id === target.day) {
      return d;
    }
  }
  return null;
}

function useCountdown(target: Date | null) {
  const [cd, setCd] = useState<Countdown>(() =>
    target ? getCountdown(target) : { days: 0, hours: 0, minutes: 0, seconds: 0 }
  );

  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setCd(getCountdown(target)), 1000);
    return () => clearInterval(t);
  }, [target]);

  return cd;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.countCell}>
      <Text style={styles.countValue}>{pad2(value)}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const cd = useCountdown(event.unavailable ? null : event.date);

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardTextWrap}>
          <Text style={styles.cardTitle}>{event.title}</Text>
          <Text style={styles.cardDate}>{event.dateLabel}</Text>
          {event.unavailable ? (
            <Text style={styles.unavailableText}>غير متاح على هذا الجهاز</Text>
          ) : null}
        </View>
        <View style={styles.iconTile}>
          <Feather name="calendar" size={20} color="#F0A33A" />
        </View>
      </View>

      <View style={styles.countRow}>
        <CountdownCell value={event.unavailable ? 0 : cd.seconds} label="ثانية" />
        <CountdownCell value={event.unavailable ? 0 : cd.minutes} label="دقيقة" />
        <CountdownCell value={event.unavailable ? 0 : cd.hours} label="ساعة" />
        <CountdownCell value={event.unavailable ? 0 : cd.days} label="يوم" />
      </View>

      {event.showBell ? (
        <View style={styles.bellRow}>
          <Text style={styles.bellText}>{event.bellText}</Text>
          <Feather name="bell" size={14} color="#9AA5A0" />
        </View>
      ) : null}
    </View>
  );
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0
  );

  // Doubling header height (approx): old ~66px on web -> ~132px
  const HEADER_MIN_HEIGHT = 132;

  const footerYear = useMemo(() => formatNumber(new Date().getFullYear()), []);
  const extraEvents = useMemo<EventItem[]>(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const buildEvent = (id: string, title: string, month: number, day: number): EventItem => {
      const targetDate = findNextIslamicDate({ month, day }, now);
      if (!targetDate) {
        return {
          id,
          title,
          date: now,
          dateLabel: "--",
          unavailable: true,
        };
      }
      return {
        id,
        title,
        date: targetDate,
        dateLabel: formatter.format(targetDate),
      };
    };

    return [
      buildEvent("arafah", "يوم عرفة", 12, 9),
      buildEvent("adha", "عيد الأضحى", 12, 10),
      buildEvent("new-hijri", "رأس السنة الهجرية", 1, 1),
    ];
  }, []);

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 12,
            minHeight: topInset + HEADER_MIN_HEIGHT,
          },
        ]}
      >
        <View style={styles.headerRow}>
          {/* Back button on the LEFT like StatsScreen */}
          <Pressable
            style={styles.headerIcon}
            onPress={() => navigation.goBack()}
            hitSlop={10}
          >
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </Pressable>

          {/* Centered title */}
          <Text style={styles.headerTitle}>المواعيد الإسلامية</Text>

          {/* Right spacer to keep title perfectly centered (and remove 3 dots) */}
          <View style={styles.headerIconSpacer} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {EVENTS.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
        {extraEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F4F4F2",
  },
  header: {
    backgroundColor: "#1B4332",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 18,
    paddingBottom: 36, // ↑ increased to help make header feel ~double height
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  headerIconSpacer: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    ...typography.screenTitle,
    flex: 1,
    color: "#FFFFFF",
    fontSize: 22,
    textAlign: "center",
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTextWrap: {
    flex: 1,
    alignItems: "flex-end",
  },
  cardTitle: {
    ...typography.itemTitle,
    fontSize: 20,
    color: "#1F2D25",
  },
  cardDate: {
    ...typography.itemSubtitle,
    fontSize: 13,
    color: "#8A9490",
    marginTop: 4,
  },
  unavailableText: {
    ...typography.itemSubtitle,
    fontSize: 12,
    color: "#B0B8B3",
    marginTop: 4,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  countRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  countCell: {
    alignItems: "center",
    flex: 1,
  },
  countValue: {
    ...typography.numberText,
    fontSize: 22,
    color: "#F0A33A",
  },
  countLabel: {
    ...typography.itemSubtitle,
    fontSize: 12,
    color: "#9AA5A0",
    marginTop: 4,
  },
  bellRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bellText: {
    ...typography.itemSubtitle,
    fontSize: 12,
    color: "#9AA5A0",
  },
});
