import React, { useState, useEffect, useCallback } from "react";
import { Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { SettingsScreen, SettingsSection, ToggleRow, ActionRow } from "./SettingsUI";

const STORAGE_KEY = "@athkar_notif_settings";
const NOTIF_IDS_KEY = "@athkar_notif_ids";

type AthkarNotifSettings = { morningEnabled: boolean; eveningEnabled: boolean; sleepEnabled: boolean; wakeUpEnabled: boolean };
const DEFAULTS: AthkarNotifSettings = { morningEnabled: true, eveningEnabled: true, sleepEnabled: false, wakeUpEnabled: false };

const SCHEDULE = {
  morning: { hour: 5, minute: 30, title: "أذكار الصباح", body: "حان وقت أذكار الصباح 🌅" },
  evening: { hour: 16, minute: 0, title: "أذكار المساء", body: "حان وقت أذكار المساء 🌇" },
  sleep: { hour: 22, minute: 0, title: "أذكار النوم", body: "لا تنسَ أذكار النوم 🌙" },
  wakeUp: { hour: 6, minute: 0, title: "أذكار الاستيقاظ", body: "الحمد لله الذي أحيانا ☀️" },
};

async function cancelAthkarNotifs() {
  if (Platform.OS === "web") return;
  try { const raw = await AsyncStorage.getItem(NOTIF_IDS_KEY); if (raw) { const ids: string[] = JSON.parse(raw); await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id))); } } catch {}
  await AsyncStorage.removeItem(NOTIF_IDS_KEY);
}

async function scheduleAthkarNotifs(cfg: AthkarNotifSettings) {
  if (Platform.OS === "web") return;
  await cancelAthkarNotifs();
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) { const req = await Notifications.requestPermissionsAsync(); if (!req.granted) return; }
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("athkar", { name: "Athkar Reminders", importance: Notifications.AndroidImportance.HIGH, sound: "default" });
  const ids: string[] = [];
  const entries: Array<[keyof typeof SCHEDULE, boolean]> = [["morning", cfg.morningEnabled], ["evening", cfg.eveningEnabled], ["sleep", cfg.sleepEnabled], ["wakeUp", cfg.wakeUpEnabled]];
  for (const [key, enabled] of entries) {
    if (!enabled) continue;
    const sc = SCHEDULE[key];
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: sc.title, body: sc.body, sound: "default", data: { type: "athkar", kind: key } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: sc.hour, minute: sc.minute, channelId: Platform.OS === "android" ? "athkar" : undefined } as any,
    });
    ids.push(id);
  }
  await AsyncStorage.setItem(NOTIF_IDS_KEY, JSON.stringify(ids));
}

export default function AthkarNotifSettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [cfg, setCfg] = useState<AthkarNotifSettings>(DEFAULTS);

  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((v) => { if (v) setCfg({ ...DEFAULTS, ...JSON.parse(v) }); }); }, []);

  const update = useCallback((key: keyof AthkarNotifSettings, value: boolean) => {
    setCfg((prev) => { const next = { ...prev, [key]: value }; AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); scheduleAthkarNotifs(next); return next; });
  }, []);

  const handleTest = async () => {
    if (Platform.OS === "web") return;
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) { const req = await Notifications.requestPermissionsAsync(); if (!req.granted) { Alert.alert("", "يرجى السماح بالإشعارات"); return; } }
    await Notifications.scheduleNotificationAsync({
      content: { title: "اختبار التنبيهات", body: "التنبيهات تعمل ✅", sound: "default", data: { type: "test" } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: Platform.OS === "android" ? "athkar" : undefined } as any,
    });
    Alert.alert("", "ستصلك إشعار خلال 3 ثوانٍ");
  };

  return (
    <SettingsScreen title="تنبيهات الأذكار" onBack={() => navigation.goBack()} insetTop={insets.top} bottomPadding={insets.bottom}>
      <SettingsSection title="التنبيهات اليومية">
        <ToggleRow icon="sunny-outline" label="أذكار الصباح" subtitle="تذكير يومي 5:30 ص" value={cfg.morningEnabled} onValueChange={(v) => update("morningEnabled", v)} />
        <ToggleRow icon="moon-outline" label="أذكار المساء" subtitle="تذكير يومي 4:00 م" value={cfg.eveningEnabled} onValueChange={(v) => update("eveningEnabled", v)} />
      </SettingsSection>
      <SettingsSection title="تنبيهات إضافية">
        <ToggleRow icon="bed-outline" label="أذكار النوم" subtitle="تذكير يومي 10:00 م" value={cfg.sleepEnabled} onValueChange={(v) => update("sleepEnabled", v)} />
        <ToggleRow icon="alarm-outline" label="أذكار الاستيقاظ" subtitle="تذكير يومي 6:00 ص" value={cfg.wakeUpEnabled} onValueChange={(v) => update("wakeUpEnabled", v)} />
      </SettingsSection>
      <SettingsSection title="اختبار">
        <ActionRow icon="notifications-outline" label="إرسال إشعار تجريبي" subtitle="تأكد من عمل التنبيهات" onPress={handleTest} />
      </SettingsSection>
    </SettingsScreen>
  );
}
