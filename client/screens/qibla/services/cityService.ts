import * as Location from "expo-location";
import { Platform } from "react-native";
import tzLookup from "tz-lookup";
import type { City } from "@/screens/qibla/services/preferences";

type ReverseAddress = Location.LocationGeocodedAddress;

const ARABIC_RE = /[\u0600-\u06FF]/;

function isArabicText(value: string): boolean {
  return ARABIC_RE.test(value);
}

function pickCityName(address?: ReverseAddress | null, fallbackName = "Unknown"): string {
  if (!address) return fallbackName;
  return (
    address.city ??
    address.town ??
    address.village ??
    address.subregion ??
    address.region ??
    address.district ??
    address.name ??
    fallbackName
  );
}

export function formatCityLabel(
  address?: ReverseAddress | null,
  fallbackName = "Unknown",
  preferArabic = false
): string {
  let city = pickCityName(address, fallbackName);
  if (preferArabic && !isArabicText(city) && isArabicText(fallbackName)) {
    city = fallbackName;
  }
  const country = address?.country ?? address?.isoCountryCode ?? "";
  return country ? `${city}, ${country}` : city;
}

function toFriendlyCountry(address?: ReverseAddress | null): string | undefined {
  if (!address) return undefined;
  return address.country ?? undefined;
}

async function getWebCityNameFromNominatim(lat: number, lon: number): Promise<string | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lon)}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
      };
    };
    const addr = data?.address;
    return addr?.city ?? addr?.town ?? addr?.village ?? addr?.state ?? null;
  } catch {
    return null;
  }
}

async function searchWebCitiesByName(query: string, preferArabic: boolean): Promise<City[]> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&limit=10&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(preferArabic ? { "Accept-Language": "ar" } : null),
      },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
      display_name?: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
      };
    }>;
    if (!Array.isArray(data) || data.length === 0) return [];
    return data
      .map((item) => {
        const lat = item.lat ? Number(item.lat) : NaN;
        const lon = item.lon ? Number(item.lon) : NaN;
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        const addr = item.address;
        let city =
          addr?.city ??
          addr?.town ??
          addr?.village ??
          addr?.state ??
          query;
        if (preferArabic && !isArabicText(city) && isArabicText(query)) {
          city = query;
        }
        if (query && city && !isArabicText(city) && !isArabicText(query) && city.toLowerCase().includes(query.toLowerCase()) === false) {
          city = query;
        }
        const country = addr?.country ?? addr?.isoCountryCode ?? "";
        const name = country ? `${city}, ${country}` : city;
        return {
          name: name ?? query,
          country: country || undefined,
          lat,
          lon,
          source: "manual" as const,
          tz: tzLookup(lat, lon),
        };
      })
      .filter((item): item is City => !!item);
  } catch (error) {
    console.log("[SalatukSearch] web search error", error);
    return [];
  }
}

export async function getCityFromGPS(): Promise<City> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  console.log("[SalatukCity] permission", status);
  if (status !== "granted") {
    throw new Error("Location permission was not granted");
  }

  const position = await Location.getCurrentPositionAsync({});
  const { latitude, longitude } = position.coords;
  console.log("[SalatukCity] coords", { latitude, longitude });

  let reverseResults: ReverseAddress[] = [];
  try {
    reverseResults = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    console.log("[SalatukCity] reverseGeocode", reverseResults);
  } catch {
    reverseResults = [];
    console.log("[SalatukCity] reverseGeocode", reverseResults);
  }

  const address = reverseResults?.[0] ?? null;
  let finalName = formatCityLabel(address, "Unknown");

  if ((finalName === "Unknown" || !finalName.trim()) && Platform.OS === "web") {
    const webName = await getWebCityNameFromNominatim(latitude, longitude);
    if (webName?.trim()) {
      finalName = webName.trim();
    }
  }
  console.log("[SalatukCity] finalName", finalName);

  return {
    name: finalName,
    country: toFriendlyCountry(address),
    lat: latitude,
    lon: longitude,
    source: "gps",
    tz: tzLookup(latitude, longitude),
  };
}

export async function searchCityByName(query: string): Promise<City[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const preferArabic = isArabicText(trimmed);

  if (Platform.OS === "web") {
    const webResults = await searchWebCitiesByName(trimmed, preferArabic);
    console.log("[SalatukSearch] web results", webResults.length);
    if (webResults.length) return webResults;
  }

  let geocoded: Location.LocationGeocodedLocation[] = [];
  try {
    geocoded = await Location.geocodeAsync(trimmed);
  } catch (error) {
    console.log("[SalatukSearch] geocode error", error);
    return [];
  }

  console.log("[SalatukSearch] geocode results", geocoded.length);
  if (!geocoded.length) return [];

  const topTen = geocoded.slice(0, 10);
  const results = await Promise.all(
    topTen.map(async (point) => {
      let address: ReverseAddress | null = null;
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: point.latitude,
          longitude: point.longitude,
        });
        address = addresses?.[0] ?? null;
      } catch (error) {
        console.log("[SalatukSearch] reverseGeocode error", error);
        address = null;
      }

      let name = formatCityLabel(address, trimmed, preferArabic);
      if (trimmed && address?.city && address.city.toLowerCase() !== trimmed.toLowerCase()) {
        // Prefer the query term as city name when reverse geocode returns a district/subregion
        name = formatCityLabel({ ...address, city: trimmed }, trimmed, preferArabic);
      }
      return {
        name,
        country: toFriendlyCountry(address),
        lat: point.latitude,
        lon: point.longitude,
        source: "manual" as const,
        tz: tzLookup(point.latitude, point.longitude),
      };
    })
  );

  const deduped = new Map<string, City>();
  for (const item of results) {
    const key = `${item.name}|${item.country ?? ""}|${item.lat.toFixed(4)}|${item.lon.toFixed(4)}`;
    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  }

  return Array.from(deduped.values());
}

