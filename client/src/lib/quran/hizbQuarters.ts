import quarters from "@/data/Quran/hizb-quarters.json";

export type HizbQuarter = { sura: number; aya: number };

// Parsed from quran-data.xml <quarter .../> entries
export function getHizbQuarters(): HizbQuarter[] {
  return quarters as HizbQuarter[];
}
