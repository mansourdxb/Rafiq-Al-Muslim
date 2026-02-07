import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
} from "adhan";
import type { PrayerSettings } from "../lib/prayer/preferences";

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

type DateParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function makeLocalDate(parts: DateParts) {
  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
}

function getTimeZoneOffsetMinutes(timeZone: string, date: Date) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  );
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUTC - date.getTime()) / 60000;
}

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

  const deviceOffset = -now.getTimezoneOffset();
  const targetOffset = timeZone
    ? getTimeZoneOffsetMinutes(timeZone, now)
    : deviceOffset;
  const deltaMs = (targetOffset - deviceOffset) * 60 * 1000;

  const nowCity = timeZone ? new Date(now.getTime() + deltaMs) : now;
  const baseCity = timeZone ? new Date(base.getTime() + deltaMs) : base;
  const baseParts: DateParts = {
    year: baseCity.getFullYear(),
    month: baseCity.getMonth() + 1,
    day: baseCity.getDate(),
    hour: 0,
    minute: 0,
    second: 0,
  };
  const baseDate = makeLocalDate(baseParts);

  const todayTimes = new PrayerTimes(coordinates, baseDate, params);

  const applyShift = (d: Date) => (timeZone ? new Date(d.getTime() + deltaMs) : d);

  const shifted = {
    fajr: applyShift(todayTimes.fajr),
    sunrise: applyShift(todayTimes.sunrise),
    dhuhr: applyShift(todayTimes.dhuhr),
    asr: applyShift(todayTimes.asr),
    maghrib: applyShift(todayTimes.maghrib),
    isha: applyShift(todayTimes.isha),
  };

  const sequence: Array<[PrayerName, Date]> = [
    ["Fajr", shifted.fajr],
    ["Sunrise", shifted.sunrise],
    ["Dhuhr", shifted.dhuhr],
    ["Asr", shifted.asr],
    ["Maghrib", shifted.maghrib],
    ["Isha", shifted.isha],
  ];

  const isSameDayCity =
    baseCity.getFullYear() === nowCity.getFullYear() &&
    baseCity.getMonth() === nowCity.getMonth() &&
    baseCity.getDate() === nowCity.getDate();

  const compareNow = now;
  const compareTime = isSameDayCity
    ? compareNow
    : new Date(shifted.fajr.getTime() - 1);

  let nextPrayerName: PrayerName | null = null;
  let nextPrayerTime: Date | null = null;
  for (const [name, time] of sequence) {
    if (time.getTime() > compareTime.getTime()) {
      nextPrayerName = name;
      nextPrayerTime = time;
      break;
    }
  }

  if (!nextPrayerName || !nextPrayerTime) {
    const tomorrowParts: DateParts = {
      year: baseParts.year,
      month: baseParts.month,
      day: baseParts.day + 1,
      hour: 0,
      minute: 0,
      second: 0,
    };
    const tomorrowDate = makeLocalDate(tomorrowParts);
    const tomorrowTimes = new PrayerTimes(coordinates, tomorrowDate, params);
    nextPrayerName = "Fajr";
    nextPrayerTime = applyShift(tomorrowTimes.fajr);
  }

  const result: PrayerTimesResult = {
    fajr: shifted.fajr,
    sunrise: shifted.sunrise,
    dhuhr: shifted.dhuhr,
    asr: shifted.asr,
    maghrib: shifted.maghrib,
    isha: shifted.isha,
    nextPrayerName,
    nextPrayerTime,
    timeToNextMs: Math.max(0, nextPrayerTime.getTime() - compareNow.getTime()),
  };

  console.log("[TIME DEBUG]", {
    nowLocal: new Date().toString(),
    nowISO: new Date().toISOString(),
    tzOffsetMin: new Date().getTimezoneOffset(),
  });
  console.log("[PRAYER DEBUG]", {
    city: city?.lat + "," + city?.lon,
    fajrLocal: result.fajr.toString(),
    fajrISO: result.fajr.toISOString(),
  });
  console.log("[CHECK]", {
    cityTZ: timeZone,
    fajr_toString: result.fajr.toString(),
    fajr_iso: result.fajr.toISOString(),
  });

  return result;
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
