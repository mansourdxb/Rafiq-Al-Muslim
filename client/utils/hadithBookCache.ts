/**
 * hadithBookCache.ts
 * On-demand download + cache for the 9 hadith book JSON files.
 * Combined JSONs hosted on GitHub, downloaded when user first opens a book.
 *
 * GitHub base URL:
 *   https://raw.githubusercontent.com/mansourdxb/Rafiq-Al-Muslim/main/client/data/hadith_combined/
 */

import * as FileSystem from "expo-file-system/legacy";

const GITHUB_BASE =
  "https://raw.githubusercontent.com/mansourdxb/Rafiq-Al-Muslim/main/client/data/hadith_combined";

const CACHE_DIR = `${FileSystem.documentDirectory}hadith_books/`;

export type DownloadProgress = {
  totalBytes: number;
  downloadedBytes: number;
  percent: number;
};

/* ─── Book Registry ─── */
export type BookKey =
  | "bukhari"
  | "muslim"
  | "abudawud"
  | "tirmidhi"
  | "ibnmajah"
  | "nasai"
  | "malik"
  | "darimi"
  | "ahmed";

export type BookInfo = {
  key: BookKey;
  filename: string;
  arabicName: string;
  author: string;
  approxSizeMB: number;
};

export const HADITH_BOOKS: BookInfo[] = [
  { key: "bukhari",  filename: "bukhari.json",  arabicName: "صحيح البخاري",  author: "الإمام البخاري",     approxSizeMB: 12.2 },
  { key: "muslim",   filename: "muslim.json",   arabicName: "صحيح مسلم",     author: "الإمام مسلم",        approxSizeMB: 10.8 },
  { key: "abudawud", filename: "abudawud.json", arabicName: "سنن أبي داود",  author: "الإمام أبو داود",     approxSizeMB: 7.5 },
  { key: "tirmidhi", filename: "tirmidhi.json", arabicName: "جامع الترمذي",  author: "الإمام الترمذي",     approxSizeMB: 7.3 },
  { key: "ibnmajah", filename: "ibnmajah.json", arabicName: "سنن ابن ماجه",  author: "الإمام ابن ماجه",    approxSizeMB: 5.1 },
  { key: "nasai",    filename: "nasai.json",    arabicName: "سنن النسائي",   author: "الإمام النسائي",     approxSizeMB: 7.4 },
  { key: "malik",    filename: "malik.json",    arabicName: "موطأ مالك",     author: "الإمام مالك",        approxSizeMB: 3.1 },
  { key: "darimi",   filename: "darimi.json",   arabicName: "سنن الدارمي",   author: "الإمام الدارمي",     approxSizeMB: 2.3 },
  { key: "ahmed",    filename: "ahmed.json",    arabicName: "مسند أحمد",     author: "الإمام أحمد بن حنبل", approxSizeMB: 2.3 },
];

/* ─── Ensure cache directory ─── */
async function ensureCacheDir() {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

/* ─── Check if book is cached ─── */
export async function isBookCached(key: BookKey): Promise<boolean> {
  const book = HADITH_BOOKS.find((b) => b.key === key);
  if (!book) return false;
  const info = await FileSystem.getInfoAsync(CACHE_DIR + book.filename);
  return info.exists;
}

/* ─── Get all cached book keys ─── */
export async function getCachedBooks(): Promise<BookKey[]> {
  await ensureCacheDir();
  const cached: BookKey[] = [];
  for (const book of HADITH_BOOKS) {
    const info = await FileSystem.getInfoAsync(CACHE_DIR + book.filename);
    if (info.exists) cached.push(book.key);
  }
  return cached;
}

/* ─── Load book data from cache ─── */
export async function loadBookData(
  key: BookKey
): Promise<{ index: any; chapters: Record<string, any> } | null> {
  const book = HADITH_BOOKS.find((b) => b.key === key);
  if (!book) return null;
  const path = CACHE_DIR + book.filename;
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return null;
  try {
    const content = await FileSystem.readAsStringAsync(path);
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/* ─── Download a book ─── */
export async function downloadBook(
  key: BookKey,
  onProgress?: (p: DownloadProgress) => void
): Promise<string> {
  const book = HADITH_BOOKS.find((b) => b.key === key);
  if (!book) throw new Error(`Unknown book: ${key}`);

  await ensureCacheDir();
  const url = `${GITHUB_BASE}/${book.filename}`;
  const localPath = CACHE_DIR + book.filename;

  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    localPath,
    {},
    (dp) => {
      if (onProgress && dp.totalBytesExpectedToWrite > 0) {
        onProgress({
          totalBytes: dp.totalBytesExpectedToWrite,
          downloadedBytes: dp.totalBytesWritten,
          percent: Math.round((dp.totalBytesWritten / dp.totalBytesExpectedToWrite) * 100),
        });
      }
    }
  );

  const result = await downloadResumable.downloadAsync();
  if (!result?.uri) throw new Error("Download failed");
  return result.uri;
}

/* ─── Delete a single book ─── */
export async function deleteBook(key: BookKey): Promise<void> {
  const book = HADITH_BOOKS.find((b) => b.key === key);
  if (!book) return;
  const path = CACHE_DIR + book.filename;
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }
}

/* ─── Clear all cached books ─── */
export async function clearAllBooks(): Promise<void> {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (info.exists) {
    await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
  }
}

/* ─── Get cache size ─── */
export async function getHadithCacheSize(): Promise<number> {
  await ensureCacheDir();
  let total = 0;
  for (const book of HADITH_BOOKS) {
    const info = await FileSystem.getInfoAsync(CACHE_DIR + book.filename);
    if (info.exists && (info as any).size) {
      total += (info as any).size;
    }
  }
  return total;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
