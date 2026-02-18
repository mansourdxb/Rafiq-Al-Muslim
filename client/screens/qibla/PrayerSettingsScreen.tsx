import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { City, PrayerSettings } from "@/screens/qibla/services/preferences";
import { getPrayerSettings, getSelectedCity, setPrayerSettings } from "@/screens/qibla/services/preferences";
import { computePrayerTimes } from "@/screens/qibla/services/prayerTimes";
import tzLookup from "tz-lookup";
import {
  cancelAllPrayerNotifications,
  initPrayerNotifications,
  schedulePrayerNotifications,
  scheduleTestNotification,
} from "@/src/services/prayerNotifications";
import { getAthanSounds } from "@/screens/qibla/services/salatukAthanSounds";
import { playPreview, stopPreview } from "@/screens/qibla/services/athanAudio";

const METHODS: PrayerSettings["method"][] = [
  "MWL",
  "UmmAlQura",
  "Egypt",
  "Karachi",
  "ISNA",
];

const METHOD_LABELS: Record<PrayerSettings["method"], string> = {
  MWL: "رابطة العالم الإسلامي",
  UmmAlQura: "أم القرى",
  Egypt: "الهيئة المصرية",
  Karachi: "جامعة كراتشي",
  ISNA: "الجمعية الإسلامية لأمريكا الشمالية",
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

function defaultSettings(): PrayerSettings {
  return {
    method: "MWL",
    madhab: "Shafi",
    adjustments: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    notificationsEnabled: false,
  };
}

export default function PrayerSettingsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState<PrayerSettings>(defaultSettings);
  const [city, setCity] = useState<City | null>(null);
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve());

  const headerPadTop = useMemo(() => insets.top + 12, [insets.top]);
  const pageBg = "#F6F2E9";
  const cardBg = "#FFFFFF";
  const green = "#0F4A3C";
  const gold = "#D6AF3E";
  const goldSoft = "rgba(214,175,62,0.14)";
  const subColor = "#9AA3A7";
  const dividerColor = "rgba(15,74,60,0.08)";

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [savedSettings, savedCity] = await Promise.all([
        getPrayerSettings(),
        getSelectedCity(),
      ]);
      if (!mounted) return;
      setSettings(savedSettings);
      setCity(savedCity);
      setLoaded(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      void (async () => {
        if (!settings.notificationsEnabled) {
          await cancelAllPrayerNotifications();
          return;
        }
        if (!city) {
          await cancelAllPrayerNotifications();
          return;
        }
        const ok = await initPrayerNotifications();
        if (!ok) return;
        const tz = city.tz ?? tzLookup(city.lat, city.lon);
        const computed = computePrayerTimes({
          city: { lat: city.lat, lon: city.lon, tz },
          settings,
          timeZone: tz,
        });
        await schedulePrayerNotifications({
          prayerTimes: {
            fajr: computed.fajr,
            dhuhr: computed.dhuhr,
            asr: computed.asr,
            maghrib: computed.maghrib,
            isha: computed.isha,
          },
          cityName: city.name,
          tz,
        });
      })();
    }, 150);
    return () => clearTimeout(id);
  }, [loaded, city, settings]);

  useEffect(() => {
    return () => {
      void stopPreview();
    };
  }, []);

  const persistPartial = (partial: Partial<PrayerSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...partial,
      adjustments: {
        ...prev.adjustments,
        ...(partial.adjustments ?? {}),
      },
    }));

    persistQueueRef.current = persistQueueRef.current.then(async () => {
      const next = await setPrayerSettings(partial);
      setSettings(next);
    });
  };

  const setAdjustment = (
    key: keyof PrayerSettings["adjustments"],
    delta: number
  ) => {
    const nextValue = Math.max(-60, Math.min(60, settings.adjustments[key] + delta));
    const nextAdjustments = {
      ...settings.adjustments,
      [key]: nextValue,
    };
    persistPartial({
      adjustments: nextAdjustments,
    });
  };

  const onToggleNotifications = (enabled: boolean) => {
    if (enabled && !city) {
      Alert.alert(
        "اختر مدينة",
        "يجب اختيار مدينة أولاً قبل تفعيل تنبيهات الصلاة."
      );
      return;
    }
    persistPartial({ notificationsEnabled: enabled });
  };

  return (
    <View style={[styles.root, { backgroundColor: pageBg }]}> 
      <View style={[styles.header, { paddingTop: headerPadTop, backgroundColor: green }]}> 
        <View style={styles.headerInner}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="chevron-right" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>إعدادات المواقيت</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={[styles.selectCard, { backgroundColor: cardBg }]}
          onPress={() => setMethodModalOpen(true)}
        >
          <View style={styles.selectCardText}>
            <Text style={[styles.sectionTitle, { color: green }]}>طريقة الحساب</Text>
            <Text style={[styles.sectionValue, { color: gold }]}>{METHOD_LABELS[settings.method]}</Text>
          </View>
          <View style={styles.selectChevron}>
            <Feather name="chevron-left" size={22} color={green} />
          </View>
        </Pressable>

        <View style={[styles.card, { backgroundColor: cardBg }]}> 
          <Text style={[styles.sectionTitle, { color: green }]}>المذهب</Text>
          <View style={styles.pillRow}>
            <Pressable
              onPress={() => persistPartial({ madhab: "Hanafi" })}
              style={[
                styles.pillButton,
                settings.madhab === "Hanafi" ? styles.pillSelected : styles.pillUnselected,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  settings.madhab === "Hanafi" ? styles.pillTextSelected : styles.pillTextUnselected,
                ]}
              >
                حنفي
              </Text>
            </Pressable>
            <Pressable
              onPress={() => persistPartial({ madhab: "Shafi" })}
              style={[
                styles.pillButton,
                settings.madhab === "Shafi" ? styles.pillSelected : styles.pillUnselected,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  settings.madhab === "Shafi" ? styles.pillTextSelected : styles.pillTextUnselected,
                ]}
              >
                شافعي / حنبلي / مالكي
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: green, marginHorizontal: 18 }]}>تعديل الدقائق</Text>
        <View style={[styles.card, { backgroundColor: cardBg }]}> 
          <AdjustmentRow
            label="الفجر"
            value={settings.adjustments.fajr}
            onMinus={() => setAdjustment("fajr", -1)}
            onPlus={() => setAdjustment("fajr", 1)}
            green={green}
            subColor={subColor}
            dividerColor={dividerColor}
            gold={gold}
          />
          <AdjustmentRow
            label="الظهر"
            value={settings.adjustments.dhuhr}
            onMinus={() => setAdjustment("dhuhr", -1)}
            onPlus={() => setAdjustment("dhuhr", 1)}
            green={green}
            subColor={subColor}
            dividerColor={dividerColor}
            gold={gold}
          />
          <AdjustmentRow
            label="العصر"
            value={settings.adjustments.asr}
            onMinus={() => setAdjustment("asr", -1)}
            onPlus={() => setAdjustment("asr", 1)}
            green={green}
            subColor={subColor}
            dividerColor={dividerColor}
            gold={gold}
          />
          <AdjustmentRow
            label="المغرب"
            value={settings.adjustments.maghrib}
            onMinus={() => setAdjustment("maghrib", -1)}
            onPlus={() => setAdjustment("maghrib", 1)}
            green={green}
            subColor={subColor}
            dividerColor={dividerColor}
            gold={gold}
          />
          <AdjustmentRow
            label="العشاء"
            value={settings.adjustments.isha}
            onMinus={() => setAdjustment("isha", -1)}
            onPlus={() => setAdjustment("isha", 1)}
            green={green}
            subColor={subColor}
            dividerColor={dividerColor}
            gold={gold}
            isLast
          />
        </View>

        <View style={[styles.card, { backgroundColor: cardBg }]}> 
          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={[styles.rowTitle, { color: green }]}>تنبيهات الصلاة</Text>
              <Text style={[styles.rowSub, { color: subColor }]}>
                {city ? `المدينة: ${city.name}` : "اختر مدينة من شاشة القبلة أولًا"}
              </Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={onToggleNotifications}
              trackColor={{ false: "#C9C9C9", true: gold }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Pressable
            onPress={async () => {
              try {
                const ok = await initPrayerNotifications();
                if (!ok) {
                  Alert.alert("الإشعارات", "الرجاء السماح بالإشعارات من الإعدادات.");
                  return;
                }
                const sounds = await getAthanSounds();
                const soundId = sounds.perPrayerSound.fajr ?? "makkah";
                await playPreview(soundId);
                await scheduleTestNotification({ cityName: city?.name });
                Alert.alert("تم", "سيظهر إشعار خلال 5 ثوانٍ");
              } catch (e) {
                console.log("TEST NOTIF ERROR:", e);
                Alert.alert("خطأ", "تعذر إرسال إشعار الاختبار. راجع السجل.");
              }
            }}
            style={[styles.testNotifBtn, { backgroundColor: goldSoft }]}
          >
            <Text style={[styles.testNotifText, { color: green }]}>اختبار الأذان / الإشعار</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={methodModalOpen} transparent animationType="fade" onRequestClose={() => setMethodModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg }]}> 
            <Text style={[styles.modalTitle, { color: green }]}>اختر طريقة الحساب</Text>
            {METHODS.map((method) => (
              <Pressable
                key={method}
                onPress={() => {
                  persistPartial({ method });
                  setMethodModalOpen(false);
                }}
                style={({ pressed }) => [
                  styles.methodRow,
                  pressed ? { opacity: 0.8 } : null,
                ]}
              >
                <Text style={[styles.methodText, { color: green }]}>{METHOD_LABELS[method]}</Text>
                {settings.method === method ? (
                  <Feather name="check" size={18} color={gold} />
                ) : (
                  <View style={{ width: 18 }} />
                )}
              </Pressable>
            ))}
            <Pressable style={styles.closeBtn} onPress={() => setMethodModalOpen(false)}>
              <Text style={[styles.closeBtnText, { color: green }]}>إغلاق</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AdjustmentRow({
  label,
  value,
  onMinus,
  onPlus,
  green,
  subColor,
  dividerColor,
  gold,
  isLast = false,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  green: string;
  subColor: string;
  dividerColor: string;
  gold: string;
  isLast?: boolean;
}) {
  return (
    <>
      <View style={styles.row}>
        <View style={styles.rowTextWrap}>
          <Text style={[styles.rowTitle, { color: green }]}>{label}</Text>
          <Text style={[styles.rowSub, { color: subColor }]}>بالدقائق</Text>
        </View>
        <View style={styles.stepperWrap}>
          <Pressable style={[styles.stepperBtn, { backgroundColor: gold }]} onPress={onMinus}>
            <Text style={styles.stepperBtnText}>-</Text>
          </Pressable>
          <Text style={[styles.stepperValue, { color: green }]}>
            {value > 0 ? `+${value}` : value}
          </Text>
          <Pressable style={[styles.stepperBtn, { backgroundColor: gold }]} onPress={onPlus}>
            <Text style={styles.stepperBtnText}>+</Text>
          </Pressable>
        </View>
      </View>
      {!isLast ? <View style={[styles.divider, { backgroundColor: dividerColor }]} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
  },
  header: {
    width: "100%",
    paddingBottom: 16,
    alignItems: "center",
  },
  headerInner: {
    width: "100%",
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    fontFamily: "CairoBold",
  },
  backButton: {
    position: "absolute",
    left: 4,
    top: 6,
    zIndex: 5,
    padding: 8,
  },
  scroll: {
    width: "100%",
  },
  card: {
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  row: {
    minHeight: 58,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  rowTextWrap: {
    flex: 1,
    paddingLeft: 8,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "right",
    fontFamily: "CairoBold",
  },
  rowSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    fontFamily: "CairoRegular",
  },
  testNotifBtn: {
    marginTop: 10,
    minHeight: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  testNotifText: {
    fontFamily: "CairoBold",
    fontSize: 14,
  },
  divider: {
    height: 1,
  },
  selectCard: {
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  selectCardText: {
    flex: 1,
    paddingLeft: 12,
  },
  selectChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "right",
    fontFamily: "CairoBold",
  },
  sectionValue: {
    marginTop: 6,
    fontSize: 14,
    textAlign: "right",
    fontFamily: "CairoBold",
  },
  pillRow: {
    marginTop: 12,
    flexDirection: "row-reverse",
    gap: 12,
  },
  pillButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  pillSelected: {
    backgroundColor: "#D6AF3E",
  },
  pillUnselected: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E7EA",
  },
  pillText: {
    fontSize: 13,
    textAlign: "center",
    fontFamily: "CairoBold",
  },
  pillTextSelected: {
    color: "#FFFFFF",
  },
  pillTextUnselected: {
    color: "#0F4A3C",
  },
  stepperWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 20,
  },
  stepperValue: {
    width: 44,
    textAlign: "center",
    fontFamily: "CairoBold",
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    padding: 14,
  },
  modalTitle: {
    fontFamily: "CairoBold",
    fontSize: 20,
    textAlign: "right",
    marginBottom: 8,
  },
  methodRow: {
    minHeight: 44,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  methodText: {
    fontFamily: "CairoBold",
    fontSize: 15,
    textAlign: "right",
  },
  closeBtn: {
    marginTop: 6,
    minHeight: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(214,175,62,0.14)",
  },
  closeBtnText: {
    fontFamily: "CairoBold",
    fontSize: 14,
  },
});
