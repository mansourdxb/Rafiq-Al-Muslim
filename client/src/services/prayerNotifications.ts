import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tzLookup from "tz-lookup";
import type { City, PrayerSettings } from "@/src/lib/prayer/preferences";
import { computePrayerTimes, formatTimeInTZ } from "@/src/services/prayerTimes";
import { initLocalNotifications } from "@/src/services/notificationsInit";

const STORAGE_KEY = "@tasbeeh/prayerNotificationIds";

type SchedulablePrayer = {
  key: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
  arabic: string;
  time: Date;
};

function getUpcomingPrayersToday(
  city: City,
  settings: PrayerSettings,
  now: Date
): SchedulablePrayer[] {
  const tz = city.tz ?? tzLookup(city.lat, city.lon);
  const times = computePrayerTimes({
    city: { lat: city.lat, lon: city.lon, tz },
    settings,
    timeZone: tz,
  });

  const prayers: SchedulablePrayer[] = [
    { key: "fajr", arabic: "الفجر", time: times.fajr },
    { key: "dhuhr", arabic: "الظهر", time: times.dhuhr },
    { key: "asr", arabic: "العصر", time: times.asr },
    { key: "maghrib", arabic: "المغرب", time: times.maghrib },
    { key: "isha", arabic: "العشاء", time: times.isha },
  ];

  return prayers.filter((p) => p.time.getTime() > now.getTime());
}

export async function cancelPrayerNotifications(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (ids.length) {
      await Promise.all(
        ids.map((id) => Notifications.cancelScheduledNotificationAsync(id))
      );
    }
  } finally {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

export async function scheduleTodayPrayerNotifications(args: {
  city: City;
  settings: PrayerSettings;
}): Promise<void> {
  const { city, settings } = args;
  await cancelPrayerNotifications();

  if (!settings.notificationsEnabled) {
    return;
  }
  await initLocalNotifications();

  const now = new Date();
  const tz = city.tz ?? tzLookup(city.lat, city.lon);
  const todayTimes = computePrayerTimes({
    city: { lat: city.lat, lon: city.lon, tz },
    settings,
    timeZone: tz,
  });
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowTimes = computePrayerTimes({
    city: { lat: city.lat, lon: city.lon, tz },
    settings,
    date: tomorrow,
    timeZone: tz,
  });

  const upcoming = getUpcomingPrayersToday(city, settings, now);
  const prayersToSchedule = [...upcoming];
  if (tomorrowTimes.fajr.getTime() > now.getTime()) {
    prayersToSchedule.push({ key: "fajr", arabic: "الفجر", time: tomorrowTimes.fajr });
  }

  const ids = await Promise.all(
    prayersToSchedule.map(async (prayer) => {
      const timeText = formatTimeInTZ(prayer.time, tz, "ar");
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "الصلاة",
          body: `${prayer.arabic} - ${timeText}`,
          sound: Platform.OS === "ios" ? "default" : undefined,
          data: {
            prayerKey: prayer.key,
            prayerNameAr: prayer.arabic,
          },
        },
        trigger:
          Platform.OS === "android"
            ? ({ date: prayer.time, channelId: "azan" } as any)
            : ({ date: prayer.time } as any),
      });
      console.log("[NOTIF] scheduled", prayer.key, prayer.time.toString(), "id=", id);
      return id;
    })
  );
  console.log(
    "[NOTIF] allScheduledCount",
    (await Notifications.getAllScheduledNotificationsAsync()).length
  );
  console.log("[NOTIF] scheduled ids", ids);
  console.log(
    "[NOTIF] next prayer",
    prayersToSchedule[0]?.arabic,
    prayersToSchedule[0]?.time?.toString()
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export async function reschedulePrayerNotificationsIfEnabled(args: {
  city: City | null;
  settings: PrayerSettings;
}): Promise<void> {
  const { city, settings } = args;
  if (!settings.notificationsEnabled) {
    await cancelPrayerNotifications();
    return;
  }
  if (!city) {
    await cancelPrayerNotifications();
    return;
  }
  await scheduleTodayPrayerNotifications({ city, settings });
}

export async function scheduleTestNotification(delayMs = 30000): Promise<void> {
  await initLocalNotifications();
  const fireDate = new Date(Date.now() + delayMs);
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "الصلاة",
      body: "اختبار إشعار بعد 30 ثانية",
      sound: Platform.OS === "ios" ? "default" : undefined,
      data: {
        prayerKey: "test",
        prayerNameAr: "اختبار",
      },
    },
    trigger:
      Platform.OS === "android"
        ? ({ date: fireDate, channelId: "azan" } as any)
        : ({ date: fireDate } as any),
  });
  console.log("[NOTIF] test scheduled", id, fireDate.toString());
}
