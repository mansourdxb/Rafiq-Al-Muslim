// client/screens/salatuk/SalatukCitiesScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";

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

const formatTimeLatin = (date: Date) =>
  formatTime(date, "en").replace(/AM/i, "ص").replace(/PM/i, "م");
const formatTimeLatinInTZ = (date: Date, tz: string) =>
  formatTimeInTZ(date, tz, "en-US").replace(/AM/i, "ص").replace(/PM/i, "م");
import {
  addWorldCity,
  getWorldCities,
  setWorldCities as persistWorldCities,
  type WorldCity,
} from "@/screens/qibla/services/salatukWorldCities";

dayjs.extend(utc);
dayjs.extend(timezone);

const NEXT_PRAYER_ARABIC: Record<PrayerName, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

export default function SalatukCitiesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [settings, setSettings] = useState<PrayerSettings | null>(null);
  const [worldCities, setWorldCities] = useState<WorldCity[]>([]);
  const [draftCities, setDraftCities] = useState<WorldCity[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedCityIds, setExpandedCityIds] = useState<Record<string, boolean>>(
    {}
  );

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

  const renderItem = ({ item }: { item: WorldCity }) => {
    const cityKey = `${item.lat}:${item.lon}`;
    const isExpanded = !!expandedCityIds[cityKey];
    const tz = tzLookup(item.lat, item.lon);
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

    const times =
      settings &&
      computePrayerTimes({
        city: { lat: item.lat, lon: item.lon },
        settings,
        timeZone: tz,
      });

    const nextPrayerName = times ? NEXT_PRAYER_ARABIC[times.nextPrayerName] : "--";
    const nextPrayerTime = times ? formatTimeLatin(times.nextPrayerTime) : "--:--";
    const currentTime = formatTimeLatinInTZ(new Date(), tz);
    const countdown = times ? formatCountdown(times.timeToNextMs) : "--:--";

    console.log(
      "[WorldCity]",
      item.name,
      "tz=",
      tz,
      "deviceNow=",
      new Date().toString(),
      "cityNow=",
      formatTimeInTZ(new Date(), tz, "en"),
      "fajrCity=",
      times ? formatTime(times.fajr, "en") : "n/a",
      "fajrDevice=",
      times ? formatTime(times.fajr, "en") : "n/a"
    );

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
                color="#9AA2A9"
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

          <View style={styles.cityTitleWrap}>
            <Text style={styles.cityTitleText}>{item.name}</Text>
            <Text style={styles.cityMetaText}>{diffText}</Text>
          </View>
        </View>

        {/* current time row: icon fixed FAR RIGHT, text padded so it never overlaps */}
        <View style={styles.timeRow}>
          <View style={styles.rightValueWrap}>
            <View style={styles.rightValueRow}>
              <Text style={styles.timeText}>{currentTime}</Text>
              <View style={styles.iconBox}>
                <Feather name="clock" size={16} color="#F0A500" />
              </View>
            </View>
          </View>
        </View>

        {/* next prayer row: prayer name centered, time column unchanged */}
        {!isExpanded ? (
          <View style={styles.prayerRow}>
            {/* Left fixed column (same width as right) */}
            <View style={styles.leftValueWrap}>
              <Text style={styles.countdown}>{countdown}</Text>
            </View>

            {/* Center column */}
            <View style={styles.centerLabelWrap}>
              <Text style={styles.prayerNameCentered}>{nextPrayerName}</Text>
            </View>

            {/* Right fixed column (unchanged alignment) */}
            <View style={styles.rightValueWrap}>
              <View style={styles.rightValueRow}>
                <Text style={styles.timeText}>{nextPrayerTime}</Text>
                <View style={styles.iconBox}>
                  <Pressable onPress={() => {}} hitSlop={6} style={styles.speakerBtn}>
                    <FontAwesome5 name="mosque" size={18} color="#F0A500" solid />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* expanded list: labels centered */}
        {isExpanded && times ? (
          <View style={styles.expandedList}>
            {renderFullRow("الفجر", times.fajr, times.nextPrayerName === "Fajr")}
            {renderFullRow("الظهر", times.dhuhr, times.nextPrayerName === "Dhuhr")}
            {renderFullRow("العصر", times.asr, times.nextPrayerName === "Asr")}
            {renderFullRow("المغرب", times.maghrib, times.nextPrayerName === "Maghrib")}
            {renderFullRow("العشاء", times.isha, times.nextPrayerName === "Isha")}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: headerPadTop }]}>
        <View style={[styles.headerInner, { width: contentWidth }]}>
          {isEditing ? (
            <View style={styles.editHeaderLeft}>
              <Pressable
                onPress={() => {
                  setIsEditing(false);
                  setDraftCities(worldCities);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.iconBtn}
              >
                <Feather name="x" size={22} color="#6B6E72" />
              </Pressable>
              <Pressable
                onPress={async () => {
                  await persistWorldCities(draftCities);
                  setWorldCities(draftCities);
                  setIsEditing(false);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.saveBtn}
              >
                <Text style={styles.saveText}>حفظ</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => setIsEditing(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.iconBtn}
              >
                <Feather name="more-vertical" size={22} color="#6B6E72" />
              </Pressable>

              <Pressable
                onPress={() => setPickerVisible(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.iconBtn}
              >
                <Feather name="plus" size={22} color="#6B6E72" />
              </Pressable>
            </>
          )}

          <Text style={styles.headerTitle}>مدن العالم</Text>

          <Pressable
            onPress={() => {
              let current: any = navigation;
              while (current) {
                const state = current.getState?.();
                if (state?.type === "drawer") {
                  current.dispatch(DrawerActions.openDrawer());
                  return;
                }
                current = current.getParent?.();
              }
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.menuBtn}
          >
            <Feather name="menu" size={26} color="#111111" />
          </Pressable>
        </View>
      </View>

      <View style={[styles.body, { width: contentWidth }]}>
        <FlatList
          data={isEditing ? draftCities : worldCities}
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
    </View>
  );
}

function renderFullRow(label: string, time: Date, isNext = false) {
  return (
    <View style={styles.fullRow}>
      {/* Left spacer to make center truly centered */}
      <View style={styles.leftValueWrap} />

      {/* Center label */}
      <View style={styles.centerLabelWrap}>
        <Text style={styles.fullLabelCentered}>{label}</Text>
      </View>

      {/* Right fixed time column (unchanged) */}
      <View style={styles.rightValueWrap}>
        <View style={styles.rightValueRow}>
          <View style={styles.iconBox}>
            {isNext ? (
              <FontAwesome5 name="mosque" size={16} color="#F0A500" solid />
            ) : null}
          </View>
          <Text style={styles.timeText}>{formatTimeLatin(time)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    width: "100%",
    paddingBottom: 12,
    alignItems: "center",
  },
  headerInner: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#111111",
    fontFamily: "CairoBold",
    fontSize: 28,
    textAlign: "right",
  },
  editHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  saveText: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#2F6FE4",
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 0,
  },
  listContent: {
    paddingBottom: 40,
  },

  cityItem: {
    paddingVertical: 10,
  },
  cityHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeftControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E25555",
  },
  cityTitleWrap: {
    flex: 1,
    alignItems: "flex-end",
  },
  cityTitleText: {
    fontFamily: "CairoBold",
    fontSize: 22,
    color: "#111111",
    textAlign: "right",
  },
  cityMetaText: {
    marginTop: 2,
    fontFamily: "Cairo",
    fontSize: 14,
    color: "#70757A",
    textAlign: "right",
  },

  timeRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  // fixed column to keep alignment identical for clock + speaker rows
  rightValueWrap: {
    width: 130,
    alignItems: "flex-end",
    flexShrink: 0,
  },

  // LEFT fixed column (must match rightValueWrap width)
  leftValueWrap: {
    width: 130,
    flexShrink: 0,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  // center flexible column
  centerLabelWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // IMPORTANT: icon is absolute at far right; text reserves paddingRight for it
  rightValueRow: {
    width: "100%",
    height: 28,
    position: "relative",
    justifyContent: "center",
  },
  iconBox: {
    position: "absolute",
    right: 0,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontFamily: "CairoBold",
    fontSize: 18,
    lineHeight: 22,
    color: "#111111",
    textAlign: "right",
    width: "100%",
    paddingRight: 34, // icon width + gap
  },
  speakerBtn: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    margin: 0,
  },

  expandedList: {
    marginTop: 6,
    paddingTop: 4,
  },

  fullRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },

  fullLabelCentered: {
    fontFamily: "Cairo",
    fontSize: 14,
    color: "#2F3C49",
    textAlign: "center",
  },

  prayerRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  countdown: {
    fontFamily: "Cairo",
    fontSize: 14,
    color: "#2F3C49",
    textAlign: "left",
  },

  prayerNameCentered: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#111111",
    textAlign: "center",
  },

  separator: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  emptyCard: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(80,110,130,0.10)",
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: "#33475A",
  },
  emptyText: {
    marginTop: 4,
    fontFamily: "Cairo",
    fontSize: 14,
    color: "#6F8398",
    textAlign: "center",
  },
});


