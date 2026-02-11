export type NearbyMasjid = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  address?: string;
};

type FetchNearbyMasjidsArgs = {
  lat: number;
  lon: number;
  radiusKm: number;
};

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function buildQuery(lat: number, lon: number, radiusMeters: number) {
  return `
[out:json];
(
  node(around:${radiusMeters},${lat},${lon})["amenity"="place_of_worship"]["religion"="muslim"];
  way(around:${radiusMeters},${lat},${lon})["amenity"="place_of_worship"]["religion"="muslim"];
  relation(around:${radiusMeters},${lat},${lon})["amenity"="place_of_worship"]["religion"="muslim"];
);
out center tags;
`;
}

export async function fetchNearbyMasjids({
  lat,
  lon,
  radiusKm,
}: FetchNearbyMasjidsArgs): Promise<NearbyMasjid[]> {
  const radiusMeters = Math.max(1000, Math.round(radiusKm * 1000));
  const query = buildQuery(lat, lon, radiusMeters);
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!response.ok) {
    throw new Error(`Overpass error: ${response.status}`);
  }
  const data = (await response.json()) as {
    elements: Array<{
      id: number | string;
      type: string;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };

  const results: NearbyMasjid[] = [];
  for (const el of data.elements ?? []) {
    const coords =
      typeof el.lat === "number" && typeof el.lon === "number"
        ? { lat: el.lat, lon: el.lon }
        : el.center;
    if (!coords) continue;
    const name =
      el.tags?.name ||
      el.tags?."name:ar" ||
      el.tags?."name:en" ||
      "مسجد";
    const distanceKm = haversineKm(lat, lon, coords.lat, coords.lon);
    results.push({
      id: `${el.type}-${el.id}`,
      name,
      lat: coords.lat,
      lon: coords.lon,
      distanceKm,
      address: el.tags?.addr || el.tags?."addr:full",
    });
  }

  return results.sort((a, b) => a.distanceKm - b.distanceKm);
}
