import suraMeta from "@/data/Quran/sura-meta.json";
import { getJuzForAyah, getPageForAyah } from "@/src/lib/quran/mushaf";

type RawSuraMeta = {
  index: number;
  name: string;
  tname?: string;
  type?: string;
  ayas?: number;
};

export type SurahMeta = {
  number: number;
  name_ar: string;
  name_en: string;
  ayahCount: number;
  revelationType: "meccan" | "medinan";
  pageStart: number;
  juz: number;
};

export const SURAH_META: SurahMeta[] = (suraMeta as RawSuraMeta[])
  .map((s) => {
    const revelationType =
      s.type?.toLowerCase() === "meccan" ? "meccan" : "medinan";
    return {
      number: s.index,
      name_ar: s.name,
      name_en: s.tname ?? "",
      ayahCount: s.ayas ?? 0,
      revelationType,
      pageStart: getPageForAyah(s.index, 1),
      juz: getJuzForAyah(s.index, 1),
    };
  })
  .sort((a, b) => a.number - b.number);
