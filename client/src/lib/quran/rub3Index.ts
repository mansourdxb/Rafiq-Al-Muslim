import { SURAH_META } from "@/constants/quran/surahMeta";
import { getPageData, getPageForAyah } from "@/src/lib/quran/mushaf";
import { getHizbQuarters } from "@/src/lib/quran/hizbQuarters";

export type Rub3Item = {
  hizbQuarter: number;
  juz: number;
  rubInJuz: number;
  surahNumber: number;
  ayahNumber: number;
  page: number;
  text: string;
  surahName: string;
};

let cached: Rub3Item[] | null = null;

export function getRub3Index(): Rub3Item[] {
  if (cached) return cached;

  const quarters = getHizbQuarters();
  const items: Rub3Item[] = [];

  quarters.forEach((q, idx) => {
    const hizbQuarter = idx + 1;
    const juz = Math.floor((hizbQuarter - 1) / 8) + 1;
    const rubInJuz = ((hizbQuarter - 1) % 8) + 1;
    const page = getPageForAyah(q.sura, q.aya);
    const pageData = getPageData(page);
    const match = pageData.ayahs.find((a) => a.sura === q.sura && a.aya === q.aya);
    const surahName =
      match?.surahName ?? SURAH_META.find((s) => s.number === q.sura)?.name_ar ?? `سورة ${q.sura}`;

    items.push({
      hizbQuarter,
      juz,
      rubInJuz,
      surahNumber: q.sura,
      ayahNumber: q.aya,
      page,
      text: match?.text ?? "",
      surahName,
    });
  });

  cached = items;
  return items;
}
