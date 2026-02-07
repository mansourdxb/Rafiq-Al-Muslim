import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { typography } from "@/theme/typography";
import DrawerMenuButton from "@/components/navigation/DrawerMenuButton";

type TabKey = "summary" | "calendar" | "achievements";

function SegmentedTabs({
  value,
  onChange,
  width,
  colors,
}: {
  value: TabKey;
  onChange: (k: TabKey) => void;
  width: number;
  colors: {
    wrapBg: string;
    activeBg: string;
    text: string;
    textActive: string;
  };
}) {
  const items: { key: TabKey; label: string }[] = [
    { key: "summary", label: "الملخص" },
    { key: "calendar", label: "التقويم" },
    { key: "achievements", label: "الإنجازات" },
  ];

  return (
    <View style={[styles.segmentWrap, { width, backgroundColor: colors.wrapBg }]}>
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            style={({ pressed }) => [
              styles.segmentBtn,
              active ? { backgroundColor: colors.activeBg } : null,
              pressed ? { opacity: 0.92 } : null,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                typography.sectionTitle,
                { color: colors.text },
                active ? { color: colors.textActive } : null,
              ]}
            >
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function StatTile({
  icon,
  value,
  label,
  outerColor,
  innerColor,
  valueColor,
  labelColor,
}: {
  icon: string;
  value: number;
  label: string;
  outerColor: string;
  innerColor: string;
  valueColor: string;
  labelColor: string;
}) {
  return (
    <View style={[styles.statTileOuter, { backgroundColor: outerColor }]}>
      <View style={[styles.statTileInner, { backgroundColor: innerColor }]}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: labelColor }]}>{label}</Text>
      </View>
    </View>
  );
}

function Card({
  children,
  outerStyle,
  innerStyle,
}: {
  children: React.ReactNode;
  outerStyle?: any;
  innerStyle?: any;
}) {
  return (
    <View style={[styles.cardOuter, outerStyle]}>
      <View style={[styles.cardInner, innerStyle]}>{children}</View>
    </View>
  );
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const { colors, isDarkMode } = useTheme();

  // phone-like layout even on web
  const maxW = 430;
  const contentWidth = Math.min(width, maxW);

  const [tab, setTab] = useState<TabKey>("summary");

  // Dummy values (replace later with real data from your store)
  const total = 278;
  const avg = 69;
  const best = 152;

  const week = useMemo(
    () => [
      { day: "الأربعاء", v: 50 },
      { day: "الثلاثاء", v: 150 },
      { day: "الاثنين", v: 30 },
      { day: "الأحد", v: 60 },
      { day: "السبت", v: 10 },
      { day: "الجمعة", v: 5 },
      { day: "الخميس", v: 5 },
    ],
    []
  );

  const dailyGoal = 200;
  const todayDone = 120;
  const goalPct = Math.max(0, Math.min(1, todayDone / dailyGoal));

  const headerGradientColors = colors.headerGradient as [string, string, ...string[]];
  const pageBackground = colors.background;
  const sheetBackground = isDarkMode ? "#0D0F12" : "#F3F5F8";
  const cardOuterBackground = isDarkMode ? "#000000" : "#E7EDF4";
  const cardInnerBackground = isDarkMode ? "#2F2F30" : "#FFFFFF";
  const primaryText = isDarkMode ? "#FFFFFF" : "#111418";
  const secondaryText = isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(17,20,24,0.55)";
  const subtleText = isDarkMode ? "rgba(255,255,255,0.45)" : "rgba(17,20,24,0.45)";
  const chartBackground = isDarkMode ? "#1F242C" : "#F6F8FB";
  const chartGridColor = isDarkMode ? "rgba(255,255,255,0.18)" : "#AEB8C4";
  const trackBackground = isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(17,20,24,0.12)";
  const dividerColor = isDarkMode ? "rgba(255,255,255,0.10)" : "rgba(17,20,24,0.08)";
  const segmentColors = {
    wrapBg: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)",
    activeBg: isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.18)",
    text: isDarkMode ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.85)",
    textActive: "#FFFFFF",
  };

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
          <Text style={styles.headerTitle}>الإحصائيات</Text>

          <SegmentedTabs
            value={tab}
            onChange={setTab}
            width={contentWidth - 28}
            colors={segmentColors}
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={{ width: contentWidth }}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Large sheet */}
        <View style={[styles.sheet, { backgroundColor: sheetBackground }]}>
          {tab === "summary" ? (
            <>
              {/* 3 tiles */}
              <View style={styles.tilesRow}>
                <StatTile
                  icon="🏆"
                  value={best}
                  label="الأفضل"
                  outerColor={cardOuterBackground}
                  innerColor={cardInnerBackground}
                  valueColor={primaryText}
                  labelColor={subtleText}
                />
                <StatTile
                  icon="📊"
                  value={avg}
                  label="المتوسط"
                  outerColor={cardOuterBackground}
                  innerColor={cardInnerBackground}
                  valueColor={primaryText}
                  labelColor={subtleText}
                />
                <StatTile
                  icon="∑"
                  value={total}
                  label="المجموع"
                  outerColor={cardOuterBackground}
                  innerColor={cardInnerBackground}
                  valueColor={primaryText}
                  labelColor={subtleText}
                />
              </View>

              {/* Last 7 days chart card */}
              <Card
                outerStyle={{ backgroundColor: cardOuterBackground }}
                innerStyle={{ backgroundColor: cardInnerBackground }}
              >
                <Text style={[styles.cardTitle, { color: primaryText }]}>آخر 7 أيام</Text>

                {/* Placeholder chart */}
                <View style={[styles.chartArea, { backgroundColor: chartBackground }]}>
                  <View style={[styles.chartGrid, { borderColor: chartGridColor }]} />
                  <View style={styles.chartLine} />
                </View>

                <View style={styles.daysRow}>
                  {week.map((d) => (
                    <Text
                      key={d.day}
                      style={[styles.dayLabel, { color: secondaryText }]}
                      numberOfLines={1}
                    >
                      {d.day}
                    </Text>
                  ))}
                </View>
              </Card>

              {/* Daily goal */}
              <Card
                outerStyle={{ backgroundColor: cardOuterBackground, marginTop: 14 }}
                innerStyle={{ backgroundColor: cardInnerBackground }}
              >
                <Text style={[styles.cardTitle, { color: primaryText }]}>الهدف اليومي</Text>

                <View style={styles.goalRow}>
                  <Text style={[styles.goalText, { color: primaryText }]}>
                    {todayDone} / {dailyGoal}
                  </Text>
                  <Text style={[styles.goalHint, { color: subtleText }]}>التقدم</Text>
                </View>

                <View style={[styles.progressTrack, { backgroundColor: trackBackground }]}>
                  <View style={[styles.progressFill, { width: `${goalPct * 100}%` }]} />
                </View>
              </Card>
            </>
          ) : null}

          {tab === "calendar" ? (
            <View style={styles.placeholder}>
              <Text style={[styles.placeholderTitle, { color: primaryText }]}>التقويم</Text>
              <Text style={[styles.placeholderSub, { color: secondaryText }]}>
                سنضيف عرض الأيام/الأشهر هنا لاحقاً.
              </Text>
            </View>
          ) : null}

          {tab === "achievements" ? (
            <View style={{ paddingTop: 10 }}>
              <Card
                outerStyle={{ backgroundColor: cardOuterBackground }}
                innerStyle={{ backgroundColor: cardInnerBackground }}
              >
                <AchievementRow
                  title="منضبط يومياً"
                  desc="أكمل تسبيحك اليومي 30 يوماً دون انقطاع"
                  progressText="مكتمل %13"
                  pct={0.13}
                  colors={{ primaryText, secondaryText, subtleText, trackBackground }}
                />
                <Divider color={dividerColor} />
                <AchievementRow
                  title="مسبح مبتدئ"
                  desc="أكمل 1,000 تسبيحة"
                  progressText="مكتمل %27"
                  pct={0.27}
                  colors={{ primaryText, secondaryText, subtleText, trackBackground }}
                />
                <Divider color={dividerColor} />
                <AchievementRow
                  title="مسبح محترف"
                  desc="أكمل 10,000 تسبيحة"
                  progressText="مكتمل %2"
                  pct={0.02}
                  colors={{ primaryText, secondaryText, subtleText, trackBackground }}
                />
              </Card>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

function AchievementRow({
  title,
  desc,
  progressText,
  pct,
  colors,
}: {
  title: string;
  desc: string;
  progressText: string;
  pct: number;
  colors: {
    primaryText: string;
    secondaryText: string;
    subtleText: string;
    trackBackground: string;
  };
}) {
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <View style={styles.achRow}>
      <View style={styles.achTextWrap}>
        <Text style={[styles.achTitle, { color: colors.primaryText }]}>{title}</Text>
        <Text style={[styles.achDesc, { color: colors.secondaryText }]}>{desc}</Text>

        <View style={styles.achFooter}>
          <Text style={[styles.achProgressText, { color: colors.subtleText }]}>
            {progressText}
          </Text>
          <View style={[styles.achTrack, { backgroundColor: colors.trackBackground }]}>
            <View style={[styles.achFill, { width: `${clamped * 100}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#E9EFF5",
    alignItems: "center",
  },

  header: {
    width: "100%",
    paddingBottom: 16,
    alignItems: "center",
  },
  headerInner: {
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.screenTitle,
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },
  menuButton: {
    position: "absolute",
    right: 4,
    top: 2,
    zIndex: 5,
  },

  segmentWrap: {
    flexDirection: "row-reverse",
    backgroundColor: "rgba(0,0,0,0.10)",
    borderRadius: 18,
    padding: 4,
    alignSelf: "center",
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  segmentText: {
    ...typography.sectionTitle,
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    fontWeight: "800",
  },

  body: {
    flex: 1,
    paddingTop: 12,
  },

  sheet: {
    flex: 1,
    backgroundColor: "#F3F5F8",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 16,
    paddingHorizontal: 14,
  },

  tilesRow: {
    flexDirection: "row-reverse",
    gap: 10,
    marginBottom: 14,
  },
  statTileOuter: {
    flex: 1,
    borderRadius: 24,
    padding: 8,
    ...(Platform.OS === "web" ? ({ boxShadow: "0 10px 24px rgba(0,0,0,0.10)" } as any) : null),
  },
  statTileInner: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 6,
    opacity: 0.85,
  },
  statValue: {
    ...typography.numberText,
    fontSize: 34,
    fontWeight: "900",
    color: "#111418",
  },
  statLabel: {
    ...typography.itemSubtitle,
    marginTop: 6,
    fontSize: 16,
    fontWeight: "800",
    color: "rgba(17,20,24,0.45)",
  },

  cardOuter: {
    borderRadius: 28,
    padding: 10,
    ...(Platform.OS === "web" ? ({ boxShadow: "0 12px 30px rgba(0,0,0,0.12)" } as any) : null),
  },
  cardInner: {
    borderRadius: 22,
    padding: 16,
  },
  cardTitle: {
    ...typography.sectionTitle,
    fontSize: 22,
    fontWeight: "900",
    color: "#111418",
    textAlign: "right",
    marginBottom: 10,
  },

  chartArea: {
    height: 180,
    borderRadius: 18,
    backgroundColor: "#F6F8FB",
    overflow: "hidden",
    justifyContent: "center",
  },
  chartGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#AEB8C4",
  },
  chartLine: {
    position: "absolute",
    left: 18,
    right: 18,
    height: 2,
    backgroundColor: "#F1C56B",
    top: 80,
    borderRadius: 1,
  },
  daysRow: {
    marginTop: 10,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  dayLabel: {
    ...typography.itemSubtitle,
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(17,20,24,0.55)",
  },

  goalRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  goalText: {
    ...typography.numberText,
    fontSize: 18,
    fontWeight: "900",
    color: "#111418",
  },
  goalHint: {
    ...typography.itemSubtitle,
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(17,20,24,0.45)",
  },
  progressTrack: {
    height: 10,
    backgroundColor: "rgba(17,20,24,0.12)",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#F1C56B",
    borderRadius: 10,
  },

  placeholder: {
    paddingTop: 28,
    alignItems: "center",
  },
  placeholderTitle: {
    ...typography.sectionTitle,
    fontSize: 22,
    fontWeight: "900",
    color: "#111418",
    marginBottom: 6,
  },
  placeholderSub: {
    ...typography.itemSubtitle,
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(17,20,24,0.5)",
    textAlign: "center",
    paddingHorizontal: 16,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(17,20,24,0.08)",
    marginVertical: 12,
  },

  achRow: {
    paddingVertical: 8,
  },
  achTextWrap: {
    alignItems: "flex-end",
  },
  achTitle: {
    ...typography.itemTitle,
    fontSize: 18,
    fontWeight: "900",
    color: "#111418",
    textAlign: "right",
  },
  achDesc: {
    ...typography.itemSubtitle,
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(17,20,24,0.55)",
    textAlign: "right",
  },
  achFooter: {
    width: "100%",
    marginTop: 10,
    alignItems: "flex-end",
  },
  achProgressText: {
    ...typography.itemSubtitle,
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(17,20,24,0.45)",
    textAlign: "right",
    marginBottom: 8,
  },
  achTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(17,20,24,0.12)",
    borderRadius: 10,
    overflow: "hidden",
  },
  achFill: {
    height: "100%",
    backgroundColor: "#F1C56B",
    borderRadius: 10,
  },
});
