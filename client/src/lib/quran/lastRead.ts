import AsyncStorage from "@react-native-async-storage/async-storage";

export type QuranLastRead = {
  sura: number;
  aya: number;
  page: number;
  updatedAt: string;
};

const STORAGE_KEY = "@tasbeeh/quranLastRead";

export async function loadLastRead(): Promise<QuranLastRead | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QuranLastRead;
  } catch {
    return null;
  }
}

export async function saveLastRead(value: QuranLastRead) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
