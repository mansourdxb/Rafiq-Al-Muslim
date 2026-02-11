const TATWEEL_REGEX = /\u0640/g;
const DIACRITICS_REGEX = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;

const ALLAH_LIGATURES = [
  "\uFDF2", // ﷲ
];

export function normalizeArabic(input: string): string {
  if (!input) return "";
  let output = input;
  ALLAH_LIGATURES.forEach((form) => {
    output = output.split(form).join("الله");
  });
  return output
    .replace(TATWEEL_REGEX, "")
    .replace(DIACRITICS_REGEX, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

export function runNormalizeArabicDevTests() {
  const t1 = normalizeArabic("ٱللّٰه");
  const t2 = normalizeArabic("ﷲ");
  if (__DEV__) {
    console.log("[normalizeArabic] test1", t1);
    console.log("[normalizeArabic] test2", t2);
  }
  if (t1 !== "الله") {
    console.warn("[normalizeArabic] expected ٱللّٰه -> الله, got:", t1);
  }
  if (!t2.includes("الله")) {
    console.warn("[normalizeArabic] expected ﷲ to include الله, got:", t2);
  }
}
