import AsyncStorage from "@react-native-async-storage/async-storage";

export type City = {
  name: string;
  country?: string;
  lat: number;
  lon: number;
  source: "gps" | "manual";
  tz?: string;
};

export type PrayerSettings = {
  method: "MWL" | "UmmAlQura" | "Egypt" | "Karachi" | "ISNA";
  madhab: "Shafi" | "Hanafi";
  adjustments: {
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
  notificationsEnabled: boolean;
};

const SELECTED_CITY_KEY = "@tasbeeh/prayerSelectedCity";
const PRAYER_SETTINGS_KEY = "@tasbeeh/prayerSettings";

const DEFAULT_PRAYER_SETTINGS: PrayerSettings = {
  method: "MWL",
  madhab: "Shafi",
  adjustments: {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
  notificationsEnabled: false,
};

export async function getSelectedCity(): Promise<City | null> {
  try {
    const raw = await AsyncStorage.getItem(SELECTED_CITY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as City;
    if (!parsed) return null;
    if (!parsed.country && parsed.name?.includes(",")) {
      const parts = parsed.name.split(",").map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const country = parts[parts.length - 1];
        const city = parts[0];
        return {
          ...parsed,
          name: country ? `${city}, ${country}` : city,
          country,
        };
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function setSelectedCity(city: City): Promise<void> {
  await AsyncStorage.setItem(SELECTED_CITY_KEY, JSON.stringify(city));
}

export async function clearSelectedCity(): Promise<void> {
  await AsyncStorage.removeItem(SELECTED_CITY_KEY);
}

export async function getPrayerSettings(): Promise<PrayerSettings> {
  try {
    const raw = await AsyncStorage.getItem(PRAYER_SETTINGS_KEY);
    if (!raw) return DEFAULT_PRAYER_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<PrayerSettings>;
    return {
      ...DEFAULT_PRAYER_SETTINGS,
      ...parsed,
      adjustments: {
        ...DEFAULT_PRAYER_SETTINGS.adjustments,
        ...(parsed.adjustments ?? {}),
      },
    };
  } catch {
    return DEFAULT_PRAYER_SETTINGS;
  }
}

export async function setPrayerSettings(
  partial: Partial<PrayerSettings>
): Promise<PrayerSettings> {
  const current = await getPrayerSettings();
  const next: PrayerSettings = {
    ...current,
    ...partial,
    adjustments: {
      ...current.adjustments,
      ...(partial.adjustments ?? {}),
    },
  };
  await AsyncStorage.setItem(PRAYER_SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export async function resetPrayerSettings(): Promise<PrayerSettings> {
  await AsyncStorage.setItem(
    PRAYER_SETTINGS_KEY,
    JSON.stringify(DEFAULT_PRAYER_SETTINGS)
  );
  return DEFAULT_PRAYER_SETTINGS;
}
