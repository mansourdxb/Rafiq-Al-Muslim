import { quranFiles } from "@/lib/quran/quranFiles";

export type PageAyah = {
  sura: number;
  aya: number;
  text: string;
  surahName: string;
  tafsir?: { type?: string; text?: string }[];
};

export type MushafPage = {
  pageNo: number;
  juzNo: number;
  surahName: string;
  ayahs: PageAyah[];
};

const mushafPages: { index: number; sura: number; aya: number }[] = require("../../../data/Quran/mushaf-pages.json");
const mushafJuz: { index: number; sura: number; aya: number }[] = require("../../../data/Quran/mushaf-juz.json");

const surahMap = new Map<number, { name: string; ayahs: any[] }>();
quranFiles.forEach((f) => {
  const data: any = f.data ?? {};
  const name = data?.surah ?? `\u0633\u0648\u0631\u0629 ${f.number}`;
  const ayahs = Array.isArray(data?.ayahs) ? data.ayahs : [];
  surahMap.set(f.number, { name, ayahs });
});

const pageCache = new Map<number, MushafPage>();

function compareAyahRef(a: { sura: number; aya: number }, b: { sura: number; aya: number }) {
  if (a.sura !== b.sura) return a.sura - b.sura;
  return a.aya - b.aya;
}

export function getPageCount() {
  return mushafPages.length;
}

export function getPageStart(pageNo: number) {
  return mushafPages.find((p) => p.index === pageNo);
}

export function getPageForAyah(sura: number, aya: number) {
  let lo = 0;
  let hi = mushafPages.length - 1;
  let best = mushafPages[0]?.index ?? 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const ref = mushafPages[mid];
    const cmp = compareAyahRef({ sura, aya }, { sura: ref.sura, aya: ref.aya });
    if (cmp >= 0) {
      best = ref.index;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

export function getJuzForAyah(sura: number, aya: number) {
  let lo = 0;
  let hi = mushafJuz.length - 1;
  let best = mushafJuz[0]?.index ?? 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const ref = mushafJuz[mid];
    const cmp = compareAyahRef({ sura, aya }, { sura: ref.sura, aya: ref.aya });
    if (cmp >= 0) {
      best = ref.index;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

function getSurahAyahs(sura: number) {
  return surahMap.get(sura)?.ayahs ?? [];
}

function getSurahName(sura: number) {
  return surahMap.get(sura)?.name ?? `\u0633\u0648\u0631\u0629 ${sura}`;
}

function getSurahLastAyah(sura: number) {
  return getSurahAyahs(sura).length || 0;
}

function normalizeAyahText(text: string) {
  return (text || "").replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
}

export function getPageData(pageNo: number): MushafPage {
  const cached = pageCache.get(pageNo);
  if (cached) return cached;

  const start = getPageStart(pageNo);
  if (!start) {
    const empty: MushafPage = { pageNo, juzNo: 1, surahName: "", ayahs: [] };
    pageCache.set(pageNo, empty);
    return empty;
  }

  const next = getPageStart(pageNo + 1);
  const endExclusive = next
    ? { sura: next.sura, aya: next.aya }
    : { sura: 114, aya: getSurahLastAyah(114) + 1 };

  const ayahs: PageAyah[] = [];
  for (let sura = start.sura; sura <= endExclusive.sura; sura += 1) {
    const list = getSurahAyahs(sura);
    if (!list.length) continue;
    const startAya = sura === start.sura ? start.aya : 1;
    const endAya = sura === endExclusive.sura ? endExclusive.aya - 1 : list.length;
    if (endAya < startAya) continue;
    list.forEach((item: any, idx: number) => {
      const aya = item?.ayah_number ?? idx + 1;
      if (aya < startAya || aya > endAya) return;
      ayahs.push({
        sura,
        aya,
        text: normalizeAyahText(item?.text ?? ""),
        surahName: getSurahName(sura),
        tafsir: item?.tafsir ?? [],
      });
    });
  }

  const firstAyah = ayahs[0];
  const juzNo = firstAyah ? getJuzForAyah(firstAyah.sura, firstAyah.aya) : 1;
  const surahName = firstAyah ? firstAyah.surahName : "";
  const page: MushafPage = { pageNo, juzNo, surahName, ayahs };
  pageCache.set(pageNo, page);
  return page;
}

export function arabicIndic(value: number) {
  const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(value)
    .split("")
    .map((c) => map[Number(c)] ?? c)
    .join("");
}
