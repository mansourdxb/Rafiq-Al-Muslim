import AsyncStorage from "@react-native-async-storage/async-storage";

export type AthanSoundId =
  | "makkah"
  | "madina"
  | "oriental1"
  | "oriental2"
  | "maghrib1";

export type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type AthanSoundState = {
  perPrayerSound: Record<PrayerKey, AthanSoundId>;
};

const STORAGE_KEY = "@tasbeeh/salatukAthanSounds";

const DEFAULT_STATE: AthanSoundState = {
  perPrayerSound: {
    fajr: "makkah",
    dhuhr: "makkah",
    asr: "makkah",
    maghrib: "makkah",
    isha: "makkah",
  },
};

function normalize(state?: AthanSoundState | null): AthanSoundState {
  return {
    perPrayerSound: {
      fajr: state?.perPrayerSound?.fajr ?? "makkah",
      dhuhr: state?.perPrayerSound?.dhuhr ?? "makkah",
      asr: state?.perPrayerSound?.asr ?? "makkah",
      maghrib: state?.perPrayerSound?.maghrib ?? "makkah",
      isha: state?.perPrayerSound?.isha ?? "makkah",
    },
  };
}

export async function getAthanSounds(): Promise<AthanSoundState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_STATE;
  try {
    const parsed = JSON.parse(raw) as AthanSoundState;
    return normalize(parsed);
  } catch {
    return DEFAULT_STATE;
  }
}

export async function setPrayerAthanSound(
  prayer: PrayerKey,
  sound: AthanSoundId
): Promise<void> {
  const current = await getAthanSounds();
  const next: AthanSoundState = {
    perPrayerSound: {
      ...current.perPrayerSound,
      [prayer]: sound,
    },
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
