import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { typography } from "@/theme/typography";

const BAR_DATA = [
  { label: "سبحان الله", value: 180 },
  { label: "الحمد لله", value: 250 },
  { label: "لا إله إلا الله", value: 200 },
  { label: "الله أكبر", value: 100 },
  { label: "أستغفر الله", value: 70 },
];

const ACHIEVEMENTS = [
  { title: "ختمة شهرية", icon: "award" },
  { title: "1000 استغفار", icon: "star" },
  { title: "حفظ 10 سور", icon: "trophy" },
];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();

  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0
  );

  const maxW = 430;
  const contentWidth = Math.min(width, maxW);

  const maxValue = useMemo(
    () => Math.max(...BAR_DATA.map((item) => item.value)),
    []
  );

  // ↓ slightly smaller than before
  const HEADER_MIN_HEIGHT = 130;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 8,
            minHeight: topInset + HEADER_MIN_HEIGHT,
          },
        ]}
      >
        <View style={[styles.headerRow, { width: contentWidth }]}>
          <Pressable
            style={styles.headerIcon}
            onPress={() => navigation.goBack()}
            hitSlop={10}
          >
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.headerTitle}>إحصائيات العبادات</Text>

          {/* Spacer to keep the title perfectly centered */}
          <View style={styles.headerIconSpacer} />
        </View>
      </View>

      <ScrollView
        style={{ width: contentWidth }}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>إحصائيات الأذكار اليومية</Text>
          <Text style={styles.cardSubtitle}>عدد الأذكار</Text>

          <View style={styles.chartRow}>
            {BAR_DATA.map((item) => {
              const heightPct = maxValue ? item.value / maxValue : 0;
              return (
                <View key={item.label} style={styles.barColumn}>
                  <Text style={styles.barValue}>{item.value}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${Math.max(0.12, heightPct) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel} numberOfLines={2}>
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>الإنجازات</Text>
          <View style={styles.achievementsRow}>
            {ACHIEVEMENTS.map((item) => (
              <View key={item.title} style={styles.achievementTile}>
                <View style={styles.achievementIconWrap}>
                  <Feather name={item.icon as any} size={22} color="#D4AF37" />
                </View>
                <Text style={styles.achievementTitle}>{item.title}</Text>
                <View style={styles.achievementLine} />
                <Text style={styles.achievementStatus}>مكتمل</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F4F4F2",
    alignItems: "center",
  },
  header: {
    width: "100%",
    backgroundColor: "#0F4D3B",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 18,
    paddingBottom: 12,
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
    fontSize: 22,
    color: "#FFFFFF",
    textAlign: "center",
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 0,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardTitle: {
    ...typography.sectionTitle,
    fontSize: 20,
    color: "#1F2D25",
    textAlign: "right",
  },
  cardSubtitle: {
    ...typography.itemSubtitle,
    fontSize: 14,
    color: "#7C8A82",
    textAlign: "right",
    marginTop: 4,
  },
  chartRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
  },
  barValue: {
    ...typography.numberText,
    fontSize: 14,
    color: "#1F2D25",
    marginBottom: 8,
  },
  barTrack: {
    width: 34,
    height: 140,
    borderRadius: 12,
    backgroundColor: "#E8F2ED",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    backgroundColor: "#18B47B",
    borderRadius: 12,
  },
  barLabel: {
    ...typography.itemSubtitle,
    fontSize: 12,
    color: "#7C8A82",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 2,
  },
  achievementsRow: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  achievementTile: {
    width: "31%",
    backgroundColor: "#F8F9F7",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  achievementIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF6DD",
    marginBottom: 8,
  },
  achievementTitle: {
    ...typography.itemTitle,
    fontSize: 13,
    color: "#1F2D25",
    textAlign: "center",
  },
  achievementLine: {
    width: "70%",
    height: 4,
    borderRadius: 4,
    backgroundColor: "#18B47B",
    marginTop: 10,
  },
  achievementStatus: {
    ...typography.itemSubtitle,
    fontSize: 12,
    color: "#18B47B",
    marginTop: 6,
  },
});
