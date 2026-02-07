import AsyncStorage from "@react-native-async-storage/async-storage";

export type AyahMark = {
  bookmarkColor?: string | null;
  highlightColor?: string | null;
  updatedAt: string;
};

const STORAGE_KEY = "@tasbeeh/quranMarks";

export async function loadMarks(): Promise<Record<string, AyahMark>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function saveMarks(map: Record<string, AyahMark>) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  return map;
}

export async function setMark(
  sura: number,
  ayah: number,
  partial: Partial<AyahMark>
): Promise<Record<string, AyahMark>> {
  const key = `${sura}:${ayah}`;
  const marks = await loadMarks();
  const prev = marks[key] ?? { updatedAt: new Date().toISOString() };
  const next: AyahMark = {
    ...prev,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  marks[key] = next;
  return saveMarks(marks);
}

export async function clearMark(sura: number, ayah: number): Promise<Record<string, AyahMark>> {
  const key = `${sura}:${ayah}`;
  const marks = await loadMarks();
  if (marks[key]) {
    delete marks[key];
    await saveMarks(marks);
  }
  return marks;
}

export async function removeBookmark(sura: number, ayah: number): Promise<Record<string, AyahMark>> {
  const key = `${sura}:${ayah}`;
  const marks = await loadMarks();
  const current = marks[key];
  if (!current) return marks;
  if (current.highlightColor) {
    marks[key] = {
      ...current,
      bookmarkColor: null,
      updatedAt: new Date().toISOString(),
    };
    return saveMarks(marks);
  }
  delete marks[key];
  await saveMarks(marks);
  return marks;
}
