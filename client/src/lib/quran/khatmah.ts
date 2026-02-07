import AsyncStorage from "@react-native-async-storage/async-storage";

export type KhatmahState = {
  startDate: string;
  targetDays: number;
  startPage: number;
  endPage: number;
  pagesPerDay: number;
  completedPages: number[];
  lastPage: number;
  updatedAt: string;
};

const STORAGE_KEY = "@tasbeeh/quranKhatmah";

export async function loadKhatmah(): Promise<KhatmahState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as KhatmahState;
  } catch {
    return null;
  }
}

export async function saveKhatmah(state: KhatmahState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
