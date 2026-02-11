// client/screens/salatuk/SalatukCitiesScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import tzLookup from "tz-lookup";

import CityPickerModal from "@/screens/qibla/components/CityPickerModal";
import type { City, PrayerSettings } from "@/screens/qibla/services/preferences";
import { getPrayerSettings } from "@/screens/qibla/services/preferences";
import {
  computePrayerTimes,
  formatTime,
  formatTimeInTZ,
  type PrayerName,
} from "@/screens/qibla/services/prayerTimes";
import {
  addWorldCity,
  getWorldCities,
  setWorldCities as persistWorldCities,
  type WorldCity,
} from "@/screens/qibla/services/salatukWorldCities";

dayjs.extend(utc);
dayjs.extend(timezone);

const COLORS = {
  background: "#F7F7F4",
  headerText: "#2F6E52",
  accent: "#2F6E52",
  accentSoft: "#E6F0EA",
  card: "#FFFFFF",
  text: "#1F2933",
  muted: "#8B9196",
  border: "#E9E5DA",
  shadow: "rgba(0,0,0,0.08)",
  searchBg: "#EFEFEA",
};

const NEXT_PRAYER_ARABIC: Record<PrayerName, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

const formatTimeLatin = (date: Date) =>
  formatTime(date, "en").replace(/AM/i, "ص").replace(/PM/i, "م");
const safeFormatTimeLatinInTZ = (date: Date, tz: string) => {
  if (!date || Number.isNaN(date.getTime())) return "--:--";
  try {
    return formatTimeInTZ(date, tz, "en-US").replace(/AM/i, "ص").replace(/PM/i, "م");
  } catch {
    return "--:--";
  }
};

function safeTzLookup(lat: number, lon: number): string {
  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return "UTC";
  try {
    return tzLookup(latNum, lonNum) || "UTC";
  } catch {
    return "UTC";
  }
}

function formatCountdownSeconds(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (v: number) => String(v).padStart(2, "0");
  return `-${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function SalatukCitiesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [settings, setSettings] = useState<PrayerSettings | null>(null);
  const [worldCities, setWorldCities] = useState<WorldCity[]>([]);
  const [draftCities, setDraftCities] = useState<WorldCity[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedCityIds, setExpandedCityIds] = useState<Record<string, boolean>>({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [tick, setTick] = useState(0);

  const contentWidth = Math.min(width, 430);
  const headerPadTop = useMemo(() => insets.top + 8, [insets.top]);

  const formatCountdown = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (v: number) => String(v).padStart(2, "0");
    return `-${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [savedSettings, savedCities] = await Promise.all([
        getPrayerSettings(),
        getWorldCities(),
      ]);
      if (!mounted) return;
      setSettings(savedSettings);
      setWorldCities(savedCities);
      setDraftCities(savedCities);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const onSelect = async (selected: City) => {
    const next = await addWorldCity({
      name: selected.name,
      country: selected.country,
      lat: selected.lat,
      lon: selected.lon,
    });
    setWorldCities(next);
    if (!isEditing) {
      setDraftCities(next);
    }
    setPickerVisible(false);
  };

  const visibleCities = useMemo(
    () => (isEditing ? draftCities : worldCities),
    [isEditing, draftCities, worldCities]
  );

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleStartEdit = () => {
    setIsEditing(true);
    closeMenu();
  };

  const handleSave = async () => {
    await persistWorldCities(draftCities);
    setWorldCities(draftCities);
    setIsEditing(false);
    closeMenu();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDraftCities(worldCities);
    closeMenu();
  };

  const renderItem = ({ item }: { item: WorldCity }) => {
    void tick;
    const cityKey = `${item.lat}:${item.lon}`;
    const isExpanded = !!expandedCityIds[cityKey];
    const tz = safeTzLookup(item.lat, item.lon);
    const nowCity = dayjs().tz(tz);
    const deviceOffset = dayjs().utcOffset();
    const cityOffset = nowCity.utcOffset();
    const diffHours = Math.round((cityOffset - deviceOffset) / 60);
    const diffText =
      diffHours === 0
        ? "نفس التوقيت"
        : diffHours > 0
        ? `متقدم ${Math.abs(diffHours)} ساعة`
        : `سابق ${Math.abs(diffHours)} ساعة`;

    const cityToday = nowCity.startOf("day");
    const times =
      settings &&
      computePrayerTimes({
        city: { lat: Number(item.lat), lon: Number(item.lon) },
        settings,
        date: cityToday.toDate(),
        timeZone: tz,
      });

    const schedule: Array<{ key: PrayerName; at: dayjs.Dayjs }> = times
      ? [
          { key: "Fajr", at: dayjs(times.fajr).tz(tz) },
          { key: "Dhuhr", at: dayjs(times.dhuhr).tz(tz) },
          { key: "Asr", at: dayjs(times.asr).tz(tz) },
          { key: "Maghrib", at: dayjs(times.maghrib).tz(tz) },
          { key: "Isha", at: dayjs(times.isha).tz(tz) },
        ].filter((p) => p.at.isValid())
      : [];
    schedule.sort((a, b) => a.at.valueOf() - b.at.valueOf());

    let nextPrayerKey: PrayerName | null = null;
    let nextPrayerAt: dayjs.Dayjs | null = null;
    if (schedule.length) {
      const next = schedule.find((p) => p.at.isAfter(nowCity));
      if (next) {
        nextPrayerKey = next.key;
        nextPrayerAt = next.at;
      } else if (settings) {
        const tomorrow = nowCity.add(1, "day").startOf("day");
        const tomorrowTimes = computePrayerTimes({
          city: { lat: Number(item.lat), lon: Number(item.lon) },
          settings,
          date: tomorrow.toDate(),
          timeZone: tz,
        });
        const nextAt = dayjs(tomorrowTimes.fajr).tz(tz);
        if (nextAt.isValid()) {
          nextPrayerKey = "Fajr";
          nextPrayerAt = nextAt;
        }
      }
    }

    const nextPrayerName = nextPrayerKey ? NEXT_PRAYER_ARABIC[nextPrayerKey] : "--";
    const nextPrayerTime =
      nextPrayerAt && nextPrayerAt.isValid()
        ? safeFormatTimeLatinInTZ(nextPrayerAt.toDate(), tz)
        : "--:--";
    const currentTime = safeFormatTimeLatinInTZ(nowCity.toDate(), tz);
    const countdown =
      nextPrayerAt && nextPrayerAt.isValid()
        ? formatCountdownSeconds(nextPrayerAt.diff(nowCity, "second"))
        : "--:--";

    if (__DEV__ && nextPrayerKey && nextPrayerAt) {
      console.log(
        "[WorldCities]",
        item.name,
        tz,
        "now",
        nowCity.format(),
        "next",
        nextPrayerKey,
        nextPrayerAt.format()
      );
    }

    return (
      <View style={styles.cityItem}>
        <View style={styles.cityHeaderRow}>
          <View style={styles.headerLeftControls}>
            <Pressable
              onPress={() =>
                setExpandedCityIds((prev) => ({
                  ...prev,
                  [cityKey]: !isExpanded,
                }))
              }
              hitSlop={6}
              style={styles.chevronBtn}
            >
              <Feather
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={COLORS.muted}
              />
            </Pressable>
            {isEditing ? (
              <Pressable
                onPress={() =>
                  setDraftCities((prev) =>
                    prev.filter(
                      (city) =>
                        Math.abs(city.lat - item.lat) > 1e-6 ||
                        Math.abs(city.lon - item.lon) > 1e-6
                    )
                  )
                }
                hitSlop={8}
                style={styles.removeBtn}
              >
                <Feather name="x" size={14} color="#FFFFFF" />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.cityHeaderContent}>
            <View style={styles.cityTitleWrap}>
              <Text style={styles.cityTitleText}>{item.name}</Text>
              <Text style={styles.cityMetaText}>{diffText}</Text>
            </View>
            <Text style={styles.cityTimeText}>{currentTime}</Text>
          </View>
        </View>

        {!isExpanded ? (
          <View style={styles.prayerRow}>
            <View style={styles.leftValueWrap}>
              <Text style={styles.countdown}>{countdown}</Text>
            </View>
            <View style={styles.centerLabelWrap}>
              <Text style={styles.prayerNameCentered}>{nextPrayerName}</Text>
            </View>
            <View style={styles.rightValueWrap}>
              <View style={styles.rightValueRow}>
                <Text style={styles.timeText}>{nextPrayerTime}</Text>
                <View style={styles.iconBox}>
                  {nextPrayerKey ? (
                    <Pressable onPress={() => {}} hitSlop={6} style={styles.speakerBtn}>
                      <FontAwesome5 name="mosque" size={18} color={COLORS.accent} solid />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {isExpanded && times ? (
          <View style={styles.expandedList}>
            {renderFullRow("الفجر", times.fajr, nextPrayerKey === "Fajr")}
            {renderFullRow("الظهر", times.dhuhr, nextPrayerKey === "Dhuhr")}
            {renderFullRow("العصر", times.asr, nextPrayerKey === "Asr")}
            {renderFullRow("المغرب", times.maghrib, nextPrayerKey === "Maghrib")}
            {renderFullRow("العشاء", times.isha, nextPrayerKey === "Isha")}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: headerPadTop }]}>
        <View style={[styles.headerInner, { width: contentWidth }]}>
          <View style={styles.headerLeftGroup}>
            <Pressable
              onPress={openMenu}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.kebabBtn}
            >
              <Ionicons name="ellipsis-vertical" size={16} color={COLORS.accent} />
            </Pressable>
            <Pressable
              onPress={() => setPickerVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.addBtn}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={styles.headerTitle}>مدن العالم</Text>

          <View style={styles.menuBtn} />
        </View>
      </View>

      <View style={[styles.body, { width: contentWidth }]}>
        <FlatList
          data={visibleCities}
          keyExtractor={(item) => `${item.lat}:${item.lon}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>لا توجد مدن بعد</Text>
              <Text style={styles.emptyText}>اضغط على علامة + لإضافة مدينة</Text>
            </View>
          }
        />
      </View>

      <CityPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={onSelect}
      />

      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable style={styles.menuBackdrop} onPress={closeMenu}>
          <Pressable style={styles.menuCard} onPress={() => {}}>
            {!isEditing ? (
              <Pressable style={styles.menuItem} onPress={handleStartEdit}>
                <Text style={styles.menuText}>إدارة المدن</Text>
              </Pressable>
            ) : (
              <>
                <Pressable style={styles.menuItem} onPress={handleSave}>
                  <Text style={styles.menuText}>حفظ التعديلات</Text>
                </Pressable>
                <Pressable style={styles.menuItem} onPress={handleCancelEdit}>
                  <Text style={styles.menuText}>إلغاء التعديلات</Text>
                </Pressable>
              </>
            )}
            <Pressable style={styles.menuItem} onPress={closeMenu}>
              <Text style={styles.menuText}>إغلاق</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function renderFullRow(label: string, time: Date, isNext = false) {
  return (
    <View style={[styles.fullRow, isNext && styles.fullRowActive]}>
      <View style={styles.leftValueWrap} />

      <View style={styles.centerLabelWrap}>
        <Text style={styles.fullLabelCentered}>{label}</Text>
      </View>

      <View style={styles.rightValueWrap}>
        <View style={styles.rightValueRow}>
          <Text style={styles.timeText}>{formatTimeLatin(time)}</Text>
          <View style={styles.iconBox}>
            {isNext ? (
              <FontAwesome5 name="mosque" size={16} color={COLORS.accent} solid />
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    width: "100%",
    paddingBottom: 12,
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  headerInner: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: COLORS.headerText,
    fontFamily: "CairoBold",
    fontSize: 22,
    textAlign: "center",
  },
  headerLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  kebabBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  body: {
    flex: 1,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 12,
  },
  cityItem: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cityHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerLeftControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chevronBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  cityHeaderContent: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cityTitleWrap: {
    alignItems: "flex-end",
  },
  cityTitleText: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: COLORS.text,
  },
  cityMetaText: {
    marginTop: 4,
    fontFamily: "Cairo",
    fontSize: 12,
    color: COLORS.muted,
  },
  cityTimeText: {
    fontFamily: "CairoBold",
    fontSize: 20,
    color: COLORS.accent,
  },
  prayerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.accentSoft,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  leftValueWrap: {
    width: 72,
    alignItems: "flex-start",
  },
  centerLabelWrap: {
    flex: 1,
    alignItems: "center",
  },
  rightValueWrap: {
    width: 96,
    alignItems: "flex-end",
  },
  rightValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: COLORS.text,
  },
  prayerNameCentered: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: COLORS.text,
  },
  countdown: {
    fontFamily: "CairoBold",
    fontSize: 12,
    color: COLORS.muted,
  },
  iconBox: {
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  speakerBtn: {
    padding: 2,
  },
  expandedList: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  fullRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  fullRowActive: {
    backgroundColor: COLORS.accentSoft,
  },
  fullLabelCentered: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: COLORS.text,
  },
  emptyCard: {
    width: "100%",
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: COLORS.text,
  },
  emptyText: {
    marginTop: 6,
    fontFamily: "Cairo",
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  menuCard: {
    width: "100%",
    maxWidth: 260,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  menuText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: COLORS.text,
  },
});
