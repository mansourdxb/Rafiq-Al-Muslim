import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
} from "adhan";
import type { PrayerSettings } from "./preferences";

type CityCoords = {
  lat: number;
  lon: number;
  tz?: string;
};

export type PrayerName =
  | "Fajr"
  | "Sunrise"
  | "Dhuhr"
  | "Asr"
  | "Maghrib"
  | "Isha";

export type PrayerTimesResult = {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  nextPrayerName: PrayerName;
  nextPrayerTime: Date;
  timeToNextMs: number;
};

export type ComputePrayerTimesArgs = {
  city: CityCoords;
  settings: PrayerSettings;
  date?: Date;
  timeZone?: string;
};

function toCalculationMethod(method: PrayerSettings["method"]) {
  switch (method) {
    case "MWL":
      return CalculationMethod.MuslimWorldLeague();
    case "UmmAlQura":
      return CalculationMethod.UmmAlQura();
    case "Egypt":
      return CalculationMethod.Egyptian();
    case "Karachi":
      return CalculationMethod.Karachi();
    case "ISNA":
      return CalculationMethod.NorthAmerica();
    default:
      return CalculationMethod.MuslimWorldLeague();
  }
}

function toMadhab(madhab: PrayerSettings["madhab"]) {
  return madhab === "Hanafi" ? Madhab.Hanafi : Madhab.Shafi;
}

function toPrayerName(
  prayer: ReturnType<PrayerTimes["nextPrayer"]>
): PrayerName | null {
  switch (prayer) {
    case "fajr":
      return "Fajr";
    case "sunrise":
      return "Sunrise";
    case "dhuhr":
      return "Dhuhr";
    case "asr":
      return "Asr";
    case "maghrib":
      return "Maghrib";
    case "isha":
      return "Isha";
    default:
      return null;
  }
}

/**
 * Extract year / month / day as seen in a given timezone.
 * Handles the midnight edge case: e.g. 1 AM Feb 18 in Dubai is still
 * 11 PM Feb 17 in New York — we need the city's date, not the device's.
 */
function getDateComponentsInTZ(
  date: Date,
  timeZone: string
): { year: number; month: number; day: number } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

/**
 * Compute prayer times for any city from any device timezone.
 *
 * HOW IT WORKS
 * ────────────
 * The `adhan` library internally uses Date.UTC() to build output dates.
 * This means the returned Date objects are already correct UTC instants.
 * NO timezone shifting should be applied to them.
 *
 * The only thing we must handle is the INPUT date: adhan reads year/month/day
 * via getFullYear()/getMonth()/getDate() which return DEVICE-local values.
 * We must ensure those values correspond to the city's calendar date.
 *
 * Then just format with formatTimeInTZ(date, cityTZ) for display.
 */
export function computePrayerTimes({
  city,
  settings,
  date,
  timeZone,
}: ComputePrayerTimesArgs): PrayerTimesResult {
  const params = toCalculationMethod(settings.method);
  params.madhab = toMadhab(settings.madhab);
  params.adjustments.fajr = settings.adjustments.fajr;
  params.adjustments.dhuhr = settings.adjustments.dhuhr;
  params.adjustments.asr = settings.adjustments.asr;
  params.adjustments.maghrib = settings.adjustments.maghrib;
  params.adjustments.isha = settings.adjustments.isha;

  const coordinates = new Coordinates(city.lat, city.lon);
  const now = new Date();
  const base = date ?? now;

  // ── 1. Get the correct calendar date in the CITY timezone ───────────
  // When it's 1 AM Feb 18 in Dubai, it may still be Feb 17 in Cairo.
  // adhan reads year/month/day via getFullYear() etc. (device-local),
  // so we must create a Date whose device-local components match the
  // city's actual calendar date.
  let year: number, month: number, day: number;
  if (timeZone) {
    const c = getDateComponentsInTZ(base, timeZone);
    year = c.year;
    month = c.month;
    day = c.day;
  } else {
    year = base.getFullYear();
    month = base.getMonth() + 1;
    day = base.getDate();
  }

  // ── 2. Create a Date for adhan with the correct y/m/d ──────────────
  // adhan only reads year/month/day from this Date (via getFullYear etc).
  // The time-of-day doesn't matter — adhan computes from midnight.
  const baseDate = new Date(year, month - 1, day, 0, 0, 0);

  // ── 3. Compute prayer times ────────────────────────────────────────
  // adhan returns Date objects with correct UTC values (uses Date.UTC
  // internally). NO timezone correction needed on the output.
  const todayTimes = new PrayerTimes(coordinates, baseDate, params);

  // ── 4. Determine next prayer ───────────────────────────────────────
  const sequence: Array<[PrayerName, Date]> = [
    ["Fajr", todayTimes.fajr],
    ["Sunrise", todayTimes.sunrise],
    ["Dhuhr", todayTimes.dhuhr],
    ["Asr", todayTimes.asr],
    ["Maghrib", todayTimes.maghrib],
    ["Isha", todayTimes.isha],
  ];

  // Is the requested date "today" in the city's timezone?
  let isSameDayCity: boolean;
  if (timeZone) {
    const nowInCity = getDateComponentsInTZ(now, timeZone);
    isSameDayCity =
      year === nowInCity.year &&
      month === nowInCity.month &&
      day === nowInCity.day;
  } else {
    isSameDayCity =
      base.getFullYear() === now.getFullYear() &&
      base.getMonth() === now.getMonth() &&
      base.getDate() === now.getDate();
  }

  // Today → compare against real "now" to find next upcoming prayer.
  // Other day → show all prayers as upcoming.
  const compareTime = isSameDayCity
    ? now
    : new Date(todayTimes.fajr.getTime() - 1);

  let nextPrayerName: PrayerName | null = null;
  let nextPrayerTime: Date | null = null;
  for (const [name, time] of sequence) {
    if (time.getTime() > compareTime.getTime()) {
      nextPrayerName = name;
      nextPrayerTime = time;
      break;
    }
  }

  // All today's prayers passed → tomorrow's Fajr.
  if (!nextPrayerName || !nextPrayerTime) {
    const tomorrowDate = new Date(year, month - 1, day + 1, 0, 0, 0);
    const tomorrowTimes = new PrayerTimes(coordinates, tomorrowDate, params);
    nextPrayerName = "Fajr";
    nextPrayerTime = tomorrowTimes.fajr;
  }

  return {
    fajr: todayTimes.fajr,
    sunrise: todayTimes.sunrise,
    dhuhr: todayTimes.dhuhr,
    asr: todayTimes.asr,
    maghrib: todayTimes.maghrib,
    isha: todayTimes.isha,
    nextPrayerName,
    nextPrayerTime,
    timeToNextMs: Math.max(0, nextPrayerTime.getTime() - now.getTime()),
  };
}

export function formatTime(date: Date, locale?: string): string {
  const isArabic = locale?.startsWith("ar");
  const formatter = new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const formatted = formatter.format(date);
  if (!isArabic) return formatted;
  return formatted.replace(/AM/gi, "ص").replace(/PM/gi, "م").trim();
}

export function formatTimeInTZ(date: Date, timeZone: string, locale?: string): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatter.format(date);
}

/**
 * Recommend the standard calculation method for a city based on its
 * country name and/or coordinates.
 *
 * Regional standards:
 *  - Saudi Arabia / Gulf → Umm Al-Qura
 *  - Egypt / North Africa → Egyptian General Authority
 *  - Pakistan / Bangladesh / Afghanistan → University of Karachi
 *  - North America → ISNA
 *  - Rest of world → Muslim World League (MWL)
 */
export function getRecommendedMethod(
  country?: string,
  lat?: number,
  lon?: number
): "MWL" | "UmmAlQura" | "Egypt" | "Karachi" | "ISNA" {
  const c = (country ?? "").toLowerCase().trim();

  // ── Saudi Arabia & Gulf States → Umm Al-Qura ──
  const gulfCountries = [
    "saudi arabia", "السعودية", "المملكة العربية السعودية",
    "qatar", "قطر",
    "bahrain", "البحرين",
    "kuwait", "الكويت",
    "uae", "united arab emirates", "الإمارات", "الامارات",
    "oman", "عمان", "سلطنة عمان",
    "yemen", "اليمن",
  ];
  if (gulfCountries.some((g) => c.includes(g))) return "UmmAlQura";

  // ── Egypt & North/East Africa → Egyptian ──
  const egyptCountries = [
    "egypt", "مصر",
    "libya", "ليبيا",
    "sudan", "السودان",
    "south sudan", "جنوب السودان",
    "somalia", "الصومال",
    "eritrea", "إريتريا",
    "djibouti", "جيبوتي",
  ];
  if (egyptCountries.some((g) => c.includes(g))) return "Egypt";

  // ── South Asia → Karachi ──
  const karachiCountries = [
    "pakistan", "باكستان",
    "bangladesh", "بنغلاديش", "بنجلاديش",
    "afghanistan", "أفغانستان",
    "india", "الهند",
  ];
  if (karachiCountries.some((g) => c.includes(g))) return "Karachi";

  // ── North America → ISNA ──
  const isnaCountries = [
    "united states", "usa", "us",
    "أمريكا", "الولايات المتحدة",
    "canada", "كندا",
  ];
  if (isnaCountries.some((g) => c.includes(g))) return "ISNA";

  // ── Fallback by coordinates if country name didn't match ──
  if (lat != null && lon != null) {
    // Gulf region (lat 12-32, lon 34-60)
    if (lat >= 12 && lat <= 32 && lon >= 34 && lon <= 60) return "UmmAlQura";
    // Egypt/NE Africa (lat 4-32, lon 20-42)
    if (lat >= 4 && lat <= 32 && lon >= 20 && lon < 34) return "Egypt";
    // South Asia (lat 5-37, lon 60-93)
    if (lat >= 5 && lat <= 37 && lon >= 60 && lon <= 93) return "Karachi";
    // North America (lat 15-72, lon -170 to -50)
    if (lat >= 15 && lat <= 72 && lon >= -170 && lon <= -50) return "ISNA";
  }

  return "MWL";
}