import suraMeta from "@/data/Quran/sura-meta.json";

export type SuraMeta = {
  index: number;
  name: string;
  tname?: string;
  type?: string;
  ayas?: number;
};

export function parseSurasMeta(): SuraMeta[] {
  return suraMeta as SuraMeta[];
}

export function suraTypeAr(type?: string) {
  if (!type) return "";
  return type.toLowerCase() === "meccan" ? "مكية" : "مدنية";
}

export function suraMetaMap() {
  const map = new Map<number, SuraMeta>();
  parseSurasMeta().forEach((s) => map.set(s.index, s));
  return map;
}
