import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tzLookup from "tz-lookup";
import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from "adhan";
import type { City, PrayerSettings } from "@/screens/qibla/services/preferences";
import { computePrayerTimes, formatTimeInTZ } from "@/screens/qibla/services/prayerTimes";
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
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

export async function scheduleTodayPrayerNotifications(args: {
  city: City;
  settings: PrayerSettings;
}): Promise<void> {
  if (Platform.OS === "web") return;
  const { city, settings } = args;
  await cancelPrayerNotifications();

  if (!settings.notificationsEnabled) {
    return;
  }
  await initLocalNotifications();

  const now = new Date();
  const tz = city.tz ?? tzLookup(city.lat, city.lon);
  const cityCoords = { lat: city.lat, lon: city.lon, tz };

  // Build adhan params once for direct computation
  const getMethod = (m: string) => {
    switch (m) {
      case "UmmAlQura": return CalculationMethod.UmmAlQura();
      case "Egypt": return CalculationMethod.Egyptian();
      case "Karachi": return CalculationMethod.Karachi();
      case "ISNA": return CalculationMethod.NorthAmerica();
      default: return CalculationMethod.MuslimWorldLeague();
    }
  };
  const params = getMethod(settings.method);
  params.madhab = settings.madhab === "Hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  params.adjustments.fajr = settings.adjustments.fajr;
  params.adjustments.dhuhr = settings.adjustments.dhuhr;
  params.adjustments.asr = settings.adjustments.asr;
  params.adjustments.maghrib = settings.adjustments.maghrib;
  params.adjustments.isha = settings.adjustments.isha;
  const coords = new Coordinates(city.lat, city.lon);

  // Compute for today and tomorrow using adhan directly
  const todayPT = new PrayerTimes(coords, now, params);
  const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0, 0);
  const tomorrowPT = new PrayerTimes(coords, tomorrowDate, params);

  console.log("[NOTIF] today fajr:", todayPT.fajr.toString(), "isha:", todayPT.isha.toString());
  console.log("[NOTIF] tomorrow fajr:", tomorrowPT.fajr.toString(), "isha:", tomorrowPT.isha.toString());

  const allPrayers: SchedulablePrayer[] = [
    { key: "fajr", arabic: "الفجر", time: todayPT.fajr },
    { key: "dhuhr", arabic: "الظهر", time: todayPT.dhuhr },
    { key: "asr", arabic: "العصر", time: todayPT.asr },
    { key: "maghrib", arabic: "المغرب", time: todayPT.maghrib },
    { key: "isha", arabic: "العشاء", time: todayPT.isha },
    { key: "fajr", arabic: "الفجر", time: tomorrowPT.fajr },
    { key: "dhuhr", arabic: "الظهر", time: tomorrowPT.dhuhr },
    { key: "asr", arabic: "العصر", time: tomorrowPT.asr },
    { key: "maghrib", arabic: "المغرب", time: tomorrowPT.maghrib },
    { key: "isha", arabic: "العشاء", time: tomorrowPT.isha },
  ];

  // Only schedule prayers that are in the future
  const prayersToSchedule = allPrayers.filter((p) => {
    const isFuture = p.time.getTime() > now.getTime();
    if (!isFuture) {
      console.log("[NOTIF] skipping past:", p.key, p.time.toString());
    }
    return isFuture;
  });

  console.log("[NOTIF] now:", now.toString());
  console.log("[NOTIF] prayers to schedule:", prayersToSchedule.length);
  prayersToSchedule.forEach((p) => {
    console.log("[NOTIF]  -", p.key, p.arabic, p.time.toString(), "epoch:", p.time.getTime());
  });

  const ids: string[] = [];
  for (const prayer of prayersToSchedule) {
    try {
      const timeText = formatTimeInTZ(prayer.time, tz, "ar");
      const trigger =
        Platform.OS === "android"
          ? { type: "date" as const, date: prayer.time.getTime(), channelId: "azan" }
          : { type: "date" as const, date: prayer.time.getTime() };
      const cityName = city.name || "غير محدد";
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `رفيق المسلم(${timeText})`,
          body: `${cityName} | أذان صلاة ${prayer.arabic}`,
          sound: "default",
          data: {
            prayerKey: prayer.key,
            prayerNameAr: prayer.arabic,
          },
        },
        trigger: trigger as any,
      });
      console.log("[NOTIF] scheduled", prayer.key, prayer.time.toString(), "id=", id);
      ids.push(id);
    } catch (err) {
      console.warn("[NOTIF] failed to schedule", prayer.key, err);
    }
  }

  const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log("[NOTIF] allScheduledCount", allScheduled.length);
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
  if (Platform.OS === "web") return;
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

export async function scheduleTestNotification(args?: {
  cityName?: string;
  delayMs?: number;
}): Promise<void> {
  if (Platform.OS === "web") return;
  await initLocalNotifications();
  const delayMs = args?.delayMs ?? 5000;
  const cityName = args?.cityName || "غير محدد";
  const fireDate = new Date(Date.now() + delayMs);
  const timeText = formatTimeInTZ(fireDate, Intl.DateTimeFormat().resolvedOptions().timeZone, "ar");
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `رفيق المسلم(${timeText})`,
      body: `${cityName} | أذان صلاة المغرب`,
      sound: "default",
      data: {
        prayerKey: "test",
        prayerNameAr: "اختبار",
      },
    },
    trigger:
      Platform.OS === "android"
        ? ({ type: "date" as const, date: fireDate.getTime(), channelId: "azan" } as any)
        : ({ type: "date" as const, date: fireDate.getTime() } as any),
  });
  console.log("[NOTIF] test scheduled", id, fireDate.toString());
}

