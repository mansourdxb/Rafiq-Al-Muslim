import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "prayer_notification_ids";

type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
type PrayerTimesInput = Record<PrayerKey, Date>;

const PRAYER_AR: Record<PrayerKey, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

export async function initPrayerNotifications(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("prayer", {
      name: "Prayer Times",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) {
    const req = await Notifications.requestPermissionsAsync();
    if (!req.granted) return false;
  }

  return true;
}

export async function cancelAllPrayerNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (ids.length) {
      await Promise.all(
        ids.map((id) => Notifications.cancelScheduledNotificationAsync(id))
      );
    }
  } finally {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

export async function schedulePrayerNotifications(params: {
  prayerTimes: PrayerTimesInput;
  cityName?: string | null;
  tz?: string | null;
}): Promise<void> {
  if (Platform.OS === "web") return;
  const { prayerTimes, cityName } = params;
  await cancelAllPrayerNotifications();

  const now = new Date();
  const ids: string[] = [];

  const entries: Array<[PrayerKey, Date]> = [
    ["fajr", prayerTimes.fajr],
    ["dhuhr", prayerTimes.dhuhr],
    ["asr", prayerTimes.asr],
    ["maghrib", prayerTimes.maghrib],
    ["isha", prayerTimes.isha],
  ];

  for (const [key, time] of entries) {
    const fireDate = new Date(time.getTime());
    if (fireDate.getTime() <= now.getTime() + 5000) {
      fireDate.setDate(fireDate.getDate() + 1);
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `حان الآن وقت ${PRAYER_AR[key]}`,
        body: cityName ? `الموقع: ${cityName}` : "حان وقت الصلاة",
        sound: "default",
        data: { type: "prayer", prayer: key },
      },
      trigger:
        Platform.OS === "android"
          ? ({ date: fireDate, channelId: "prayer" } as any)
          : (fireDate as any),
    });
    ids.push(id);
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export async function scheduleTestNotification(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "اختبار الأذان",
      body: "سيعمل الأذان/الإشعار عند وقت الصلاة بإذن الله",
      sound: "default",
      data: { type: "test" },
    },
    trigger:
      Platform.OS === "android"
        ? ({ seconds: 5, channelId: "prayer" } as any)
        : ({ seconds: 5 } as any),
  });
}
