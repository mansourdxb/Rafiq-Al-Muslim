import AsyncStorage from "@react-native-async-storage/async-storage";

export type AthanMode = "mute" | "vibrate" | "sound";
export type AthanPrayerKey = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
export type AthanPrefs = Record<AthanPrayerKey, { mode: AthanMode }>;

const STORAGE_KEY = "@tasbeeh/salatukAthanPrefs";

const DEFAULT_PREFS: AthanPrefs = {
  Fajr: { mode: "sound" },
  Dhuhr: { mode: "sound" },
  Asr: { mode: "sound" },
  Maghrib: { mode: "sound" },
  Isha: { mode: "sound" },
};

function normalizePrefs(raw: AthanPrefs | null): AthanPrefs {
  return {
    Fajr: { mode: raw?.Fajr?.mode ?? "sound" },
    Dhuhr: { mode: raw?.Dhuhr?.mode ?? "sound" },
    Asr: { mode: raw?.Asr?.mode ?? "sound" },
    Maghrib: { mode: raw?.Maghrib?.mode ?? "sound" },
    Isha: { mode: raw?.Isha?.mode ?? "sound" },
  };
}

export async function getAthanPrefs(): Promise<AthanPrefs> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_PREFS;
  try {
    const parsed = JSON.parse(raw) as AthanPrefs;
    return normalizePrefs(parsed);
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function setAthanPrefs(next: AthanPrefs): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizePrefs(next)));
}

export async function setAthanMode(
  prayer: AthanPrayerKey,
  mode: AthanMode
): Promise<AthanPrefs> {
  const current = await getAthanPrefs();
  const next = { ...current, [prayer]: { mode } };
  await setAthanPrefs(next);
  return next;
}
