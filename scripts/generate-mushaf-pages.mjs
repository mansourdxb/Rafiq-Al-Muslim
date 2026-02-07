import fs from "fs";
import path from "path";

const xmlPath = path.join("client", "data", "Quran", "quran-data.xml");
const outPages = path.join("client", "data", "Quran", "mushaf-pages.json");
const outJuz = path.join("client", "data", "Quran", "mushaf-juz.json");

const xml = fs.readFileSync(xmlPath, "utf8");
const lines = xml.split(/\r?\n/);

function parseStarts(tag) {
  const starts = [];

  for (const line of lines) {
    const s = line.trim();

    // Match only "<page " not "<pages" (same for juz/juzs)
    if (!new RegExp(`^<${tag}\\s`).test(s)) continue;

    const attrs = {};
    for (const m of s.matchAll(/(\w+)\s*=\s*"([^"]+)"/g)) {
      attrs[m[1]] = m[2];
    }

    const index = Number(attrs.index);
    const sura = Number(attrs.sura);
    const aya = Number(attrs.aya);

    if (Number.isFinite(index) && Number.isFinite(sura) && Number.isFinite(aya)) {
      starts.push({ index, sura, aya });
    }
  }

  // Sort by (sura, aya) for correct binary search later
  starts.sort((a, b) => (a.sura - b.sura) || (a.aya - b.aya) || (a.index - b.index));
  return starts;
}

const pages = parseStarts("page");
const juz = parseStarts("juz");

fs.writeFileSync(outPages, JSON.stringify(pages, null, 2), "utf8");
fs.writeFileSync(outJuz, JSON.stringify(juz, null, 2), "utf8");

console.log("Wrote:", outPages, "pages:", pages.length);
console.log("Wrote:", outJuz, "juz:", juz.length);
