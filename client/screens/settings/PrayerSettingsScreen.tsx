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
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import DrawerMenuButton from "@/components/navigation/DrawerMenuButton";
import { useTheme } from "@/context/ThemeContext";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { City, PrayerSettings } from "@/src/lib/prayer/preferences";
import { getPrayerSettings, getSelectedCity, setPrayerSettings } from "@/src/lib/prayer/preferences";
import {
  reschedulePrayerNotificationsIfEnabled,
  scheduleTestNotification,
} from "@/src/services/prayerNotifications";
import { initLocalNotifications } from "@/src/services/notificationsInit";
import { typography } from "@/theme/typography";

const METHODS: PrayerSettings["method"][] = [
  "MWL",
  "UmmAlQura",
  "Egypt",
  "Karachi",
  "ISNA",
];

const METHOD_LABELS: Record<PrayerSettings["method"], string> = {
  MWL: "MWL",
  UmmAlQura: "UmmAlQura",
  Egypt: "Egypt",
  Karachi: "Karachi",
  ISNA: "ISNA",
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
  const { width } = useWindowDimensions();
  const { colors, isDarkMode } = useTheme();
  const maxW = 430;
  const contentWidth = Math.min(width, maxW);

  const [settings, setSettings] = useState<PrayerSettings>(defaultSettings);
  const [city, setCity] = useState<City | null>(null);
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve());

  const headerGradientColors = colors.headerGradient as [string, string, ...string[]];
  const headerPadTop = useMemo(() => insets.top + 12, [insets.top]);
  const cardBg = isDarkMode ? "#2B2B2B" : "#FFFFFF";
  const textColor = isDarkMode ? "#FFFFFF" : "#111418";
  const subColor = isDarkMode ? "rgba(255,255,255,0.65)" : "rgba(17,20,24,0.55)";
  const dividerColor = isDarkMode ? "rgba(255,255,255,0.10)" : "rgba(17,20,24,0.08)";

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
    void initLocalNotifications();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      void reschedulePrayerNotificationsIfEnabled({ city, settings });
    }, 150);
    return () => clearTimeout(id);
  }, [loaded, city, settings]);

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
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={headerGradientColors} style={[styles.header, { paddingTop: headerPadTop }]}>
        <View style={[styles.headerInner, { width: contentWidth }]}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.menuButton}>
            <DrawerMenuButton />
          </View>
          <Text style={styles.headerTitle}>إعدادات الصلاة</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ width: contentWidth }}
        contentContainerStyle={{ paddingTop: 14, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Pressable style={styles.row} onPress={() => setMethodModalOpen(true)}>
            <View style={styles.rowTextWrap}>
              <Text style={[styles.rowTitle, { color: textColor }]}>طريقة الحساب</Text>
              <Text style={[styles.rowSub, { color: subColor }]}>{METHOD_LABELS[settings.method]}</Text>
            </View>
            <Feather name="chevron-left" size={20} color={subColor} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={[styles.rowTitle, { color: textColor }]}>المذهب</Text>
              <View style={styles.segmentWrap}>
                <Pressable
                  onPress={() => persistPartial({ madhab: "Shafi" })}
                  style={[
                    styles.segmentButton,
                    settings.madhab === "Shafi" ? styles.segmentActive : null,
                  ]}
                >
                  <Text style={styles.segmentText}>Shafi</Text>
                </Pressable>
                <Pressable
                  onPress={() => persistPartial({ madhab: "Hanafi" })}
                  style={[
                    styles.segmentButton,
                    settings.madhab === "Hanafi" ? styles.segmentActive : null,
                  ]}
                >
                  <Text style={styles.segmentText}>Hanafi</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>تعديلات الدقائق</Text>
          <AdjustmentRow
            label="الفجر"
            value={settings.adjustments.fajr}
            onMinus={() => setAdjustment("fajr", -1)}
            onPlus={() => setAdjustment("fajr", 1)}
            textColor={textColor}
            subColor={subColor}
            dividerColor={dividerColor}
          />
          <AdjustmentRow
            label="الظهر"
            value={settings.adjustments.dhuhr}
            onMinus={() => setAdjustment("dhuhr", -1)}
            onPlus={() => setAdjustment("dhuhr", 1)}
            textColor={textColor}
            subColor={subColor}
            dividerColor={dividerColor}
          />
          <AdjustmentRow
            label="العصر"
            value={settings.adjustments.asr}
            onMinus={() => setAdjustment("asr", -1)}
            onPlus={() => setAdjustment("asr", 1)}
            textColor={textColor}
            subColor={subColor}
            dividerColor={dividerColor}
          />
          <AdjustmentRow
            label="المغرب"
            value={settings.adjustments.maghrib}
            onMinus={() => setAdjustment("maghrib", -1)}
            onPlus={() => setAdjustment("maghrib", 1)}
            textColor={textColor}
            subColor={subColor}
            dividerColor={dividerColor}
          />
          <AdjustmentRow
            label="العشاء"
            value={settings.adjustments.isha}
            onMinus={() => setAdjustment("isha", -1)}
            onPlus={() => setAdjustment("isha", 1)}
            textColor={textColor}
            subColor={subColor}
            dividerColor={dividerColor}
            isLast
          />
        </View>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.row}>
            <View style={styles.rowTextWrap}>
              <Text style={[styles.rowTitle, { color: textColor }]}>تنبيهات الصلاة</Text>
              <Text style={[styles.rowSub, { color: subColor }]}>
                {city ? `المدينة: ${city.name}` : "اختر مدينة من شاشة القبلة أولاً"}
              </Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={onToggleNotifications}
              trackColor={{ false: "#8D8D8D", true: "#7EC3E6" }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Pressable
            onPress={() => void scheduleTestNotification(30000)}
            style={styles.testNotifBtn}
          >
            <Text style={styles.testNotifText}>اختبار إشعار بعد 30 ثانية</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={methodModalOpen} transparent animationType="fade" onRequestClose={() => setMethodModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>اختر طريقة الحساب</Text>
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
                <Text style={[styles.methodText, { color: textColor }]}>{METHOD_LABELS[method]}</Text>
                {settings.method === method ? (
                  <Feather name="check" size={18} color="#5EA7D4" />
                ) : (
                  <View style={{ width: 18 }} />
                )}
              </Pressable>
            ))}
            <Pressable style={styles.closeBtn} onPress={() => setMethodModalOpen(false)}>
              <Text style={styles.closeBtnText}>إغلاق</Text>
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
  textColor,
  subColor,
  dividerColor,
  isLast = false,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  textColor: string;
  subColor: string;
  dividerColor: string;
  isLast?: boolean;
}) {
  return (
    <>
      <View style={styles.row}>
        <View style={styles.rowTextWrap}>
          <Text style={[styles.rowTitle, { color: textColor }]}>{label}</Text>
          <Text style={[styles.rowSub, { color: subColor }]}>بالدقائق</Text>
        </View>
        <View style={styles.stepperWrap}>
          <Pressable style={styles.stepperBtn} onPress={onMinus}>
            <Text style={styles.stepperBtnText}>-</Text>
          </Pressable>
          <Text style={[styles.stepperValue, { color: textColor }]}>
            {value > 0 ? `+${value}` : value}
          </Text>
          <Pressable style={styles.stepperBtn} onPress={onPlus}>
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
    paddingBottom: 18,
    alignItems: "center",
  },
  headerInner: {
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.screenTitle,
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "900",
    textAlign: "center",
  },
  backButton: {
    position: "absolute",
    left: 4,
    top: 2,
    zIndex: 5,
    padding: 8,
  },
  menuButton: {
    position: "absolute",
    right: 4,
    top: 2,
    zIndex: 5,
  },
  card: {
    borderRadius: 20,
    padding: 14,
    marginHorizontal: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  cardTitle: {
    ...typography.sectionTitle,
    textAlign: "right",
    marginBottom: 8,
    fontSize: 20,
    fontWeight: "900",
  },
  row: {
    minHeight: 52,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  rowTextWrap: {
    flex: 1,
    paddingLeft: 8,
  },
  rowTitle: {
    ...typography.itemTitle,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "right",
  },
  rowSub: {
    ...typography.itemSubtitle,
    marginTop: 2,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  testNotifBtn: {
    marginTop: 10,
    minHeight: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(94,167,212,0.18)",
  },
  testNotifText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#2D6185",
  },
  divider: {
    height: 1,
  },
  segmentWrap: {
    marginTop: 8,
    flexDirection: "row-reverse",
    gap: 8,
  },
  segmentButton: {
    minWidth: 88,
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(94,167,212,0.3)",
    backgroundColor: "rgba(94,167,212,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  segmentActive: {
    backgroundColor: "rgba(94,167,212,0.24)",
    borderColor: "rgba(94,167,212,0.65)",
  },
  segmentText: {
    fontFamily: "CairoBold",
    fontSize: 13,
    color: "#2D6185",
  },
  stepperWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(94,167,212,0.18)",
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D6185",
    lineHeight: 20,
  },
  stepperValue: {
    width: 44,
    textAlign: "center",
    fontFamily: "CairoBold",
    fontSize: 16,
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
    borderRadius: 16,
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
    backgroundColor: "rgba(94,167,212,0.18)",
  },
  closeBtnText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#2D6185",
  },
});
