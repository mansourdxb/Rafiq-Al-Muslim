import AsyncStorage from "@react-native-async-storage/async-storage";

export type WorldCity = {
  name: string;
  country?: string;
  lat: number;
  lon: number;
};

const STORAGE_KEY = "@tasbeeh/salatukWorldCities";

function dedupe(list: WorldCity[]) {
  const seen = new Set<string>();
  return list.filter((city) => {
    const key = `${city.lat.toFixed(4)}:${city.lon.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getWorldCities(): Promise<WorldCity[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as WorldCity[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addWorldCity(city: WorldCity): Promise<WorldCity[]> {
  const current = await getWorldCities();
  const next = dedupe([city, ...current]);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function removeWorldCity(city: WorldCity): Promise<WorldCity[]> {
  const current = await getWorldCities();
  const next = current.filter(
    (item) =>
      Math.abs(item.lat - city.lat) > 1e-6 || Math.abs(item.lon - city.lon) > 1e-6
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function clearWorldCities(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function setWorldCities(next: WorldCity[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
