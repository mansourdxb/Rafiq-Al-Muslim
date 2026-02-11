import { normalizeArabic } from "@/utils/normalizeArabic";
import { searchQuran } from "@/src/lib/quran/searchQuran";

import riyad from "@/constants/library/Riyad_Salheen.json";
import qudsi from "@/constants/library/qudsi40.json";
import bulugh from "@/constants/library/bulugh_almaram.json";
import adab from "@/constants/library/aladab_almufrad.json";
import shortHadiths from "@/constants/hadith.json";

type HadithIndexItem = {
  text: string;
  normalized: string;
  source: string;
  ref?: string;
};

const STOPWORDS = new Set([
  "عن",
  "في",
  "على",
  "الى",
  "إلى",
  "من",
  "هل",
  "ما",
  "ماذا",
  "لماذا",
  "كيف",
  "هذا",
  "هذه",
  "ذلك",
  "تلك",
  "و",
  "او",
  "أو",
  "ثم",
  "لو",
  "اذا",
  "إذا",
  "ان",
  "إن",
  "مع",
  "عن",
  "يا",
  "أي",
  "أعطني",
  "اريد",
  "أريد",
  "حديث",
  "اية",
  "آية",
  "آيات",
  "ايات",
  "فضل",
  "حكم",
]);

let hadithIndexBuilt = false;
let hadithIndex: HadithIndexItem[] = [];

function safeString(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function addHadithItem(text: string, source: string, ref?: string) {
  const clean = text.trim();
  if (!clean) return;
  hadithIndex.push({
    text: clean,
    normalized: normalizeArabic(clean),
    source,
    ref,
  });
}

function collectFromLibraryBook(data: any, fallbackSource: string) {
  const sourceTitle = safeString(data?.metadata?.arabic?.title) || fallbackSource;
  const items = Array.isArray(data?.hadiths) ? data.hadiths : [];
  items.forEach((item: any) => {
    const text = safeString(item?.arabic) || safeString(item?.text);
    if (!text) return;
    const idInBook = item?.idInBook ?? item?.id ?? "";
    const ref = idInBook ? `#${idInBook}` : undefined;
    addHadithItem(text, sourceTitle, ref);
  });
}

function collectFromShortHadiths(data: any) {
  const items = Array.isArray(data) ? data : [];
  items.forEach((item: any, idx: number) => {
    const text = safeString(item?.text);
    if (!text) return;
    const by = safeString(item?.by);
    const ref = by || `#${idx + 1}`;
    addHadithItem(text, "أحاديث مختصرة", ref);
  });
}

async function buildHadithIndexOnce() {
  if (hadithIndexBuilt) return;
  hadithIndexBuilt = true;
  hadithIndex = [];

  collectFromLibraryBook(riyad as any, "رياض الصالحين");
  collectFromLibraryBook(qudsi as any, "الأربعون القدسية");
  collectFromLibraryBook(bulugh as any, "بلوغ المرام");
  collectFromLibraryBook(adab as any, "الأدب المفرد");
  collectFromShortHadiths(shortHadiths as any);
}

async function searchHadith(query: string, limit = 3) {
  const normalizedQuery = normalizeArabic(query);
  if (!normalizedQuery || normalizedQuery.length < 2) return [];
  await buildHadithIndexOnce();

  const results: HadithIndexItem[] = [];
  for (let i = 0; i < hadithIndex.length; i += 1) {
    const item = hadithIndex[i];
    if (!item.normalized.includes(normalizedQuery)) continue;
    results.push(item);
    if (results.length >= limit) break;
  }
  return results;
}

function extractKeywords(query: string) {
  const normalized = normalizeArabic(query);
  const tokens = normalized
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
  return Array.from(new Set(tokens));
}

export async function buildLocalContextData(query: string) {
  const normalizedQuery = normalizeArabic(query);
  if (!normalizedQuery || normalizedQuery.length < 2) {
    return { context: "", sourcesText: "", hasSources: false };
  }

  const keywords = extractKeywords(query);

  let quranHits: Awaited<ReturnType<typeof searchQuran>> = [];
  let hadithHits: Awaited<ReturnType<typeof searchHadith>> = [];

  if (keywords.length > 0) {
    const quranResults = await Promise.all(
      keywords.slice(0, 3).map((k) => searchQuran(k, 2))
    );
    const seenQuran = new Set<string>();
    quranResults.flat().forEach((hit) => {
      const key = `${hit.sura}:${hit.aya}`;
      if (seenQuran.has(key)) return;
      seenQuran.add(key);
      quranHits.push(hit);
    });

    await buildHadithIndexOnce();
    const normalizedKeywords = keywords.map((k) => normalizeArabic(k));
    const scored: { item: HadithIndexItem; score: number }[] = [];
    hadithIndex.forEach((item) => {
      let score = 0;
      normalizedKeywords.forEach((k) => {
        if (item.normalized.includes(k)) score += 1;
      });
      if (score > 0) scored.push({ item, score });
    });
    scored.sort((a, b) => b.score - a.score);
    hadithHits = scored.slice(0, 3).map((s) => s.item);
  } else {
    const [qh, hh] = await Promise.all([searchQuran(query, 3), searchHadith(query, 3)]);
    quranHits = qh;
    hadithHits = hh;
  }

  if (quranHits.length === 0 && hadithHits.length === 0) {
    return { context: "", sourcesText: "", hasSources: false };
  }

  const contextParts: string[] = [
    "استخدم النصوص التالية فقط للإجابة، وإن لم تجد دليلاً واضحاً فاذكر ذلك بلطف.",
  ];
  const sourcesParts: string[] = [];

  if (quranHits.length > 0) {
    contextParts.push("مقتطفات من القرآن الكريم:");
    sourcesParts.push("القرآن الكريم:");
    quranHits.forEach((hit, idx) => {
      const line = `${idx + 1}) ${hit.surahName} (${hit.sura}:${hit.aya}) — ${hit.text}`;
      contextParts.push(line);
      sourcesParts.push(line);
    });
  }

  if (hadithHits.length > 0) {
    contextParts.push("مقتطفات من الحديث:");
    sourcesParts.push("الحديث:");
    hadithHits.forEach((hit, idx) => {
      const ref = hit.ref ? ` (${hit.ref})` : "";
      const line = `${idx + 1}) ${hit.source}${ref} — ${hit.text}`;
      contextParts.push(line);
      sourcesParts.push(line);
    });
  }

  return {
    context: contextParts.join("\n"),
    sourcesText: sourcesParts.join("\n"),
    hasSources: true,
  };
}
