/**
 * Athkar Audio Cache
 * 
 * Downloads athkar audio from GitHub on demand and caches locally.
 * Same pattern as Quran reciter audio caching.
 * 
 * SETUP:
 * 1. Create a GitHub repo (e.g., rafiq-audio)
 * 2. Upload all athkar mp3 files to: /athkar/ folder
 * 3. Use GitHub raw URL as BASE_URL below
 * 
 * File naming: use the exact filename from adhkar.json audio/filename field
 * Example: https://raw.githubusercontent.com/YOUR_USER/rafiq-audio/main/athkar/001.mp3
 */

import * as FileSystem from "expo-file-system/legacy";

/* ─── Config ─── */
// Athkar audio hosted on GitHub
const BASE_URL = "https://raw.githubusercontent.com/mansourdxb/Rafiq-Al-Muslim/main/client/data/azkar/audio";

const CACHE_DIR = `${FileSystem.documentDirectory}athkar_audio/`;

/* ─── Types ─── */
export type DownloadProgress = {
  totalBytes: number;
  downloadedBytes: number;
  percent: number;
};

type ProgressCallback = (progress: DownloadProgress) => void;

/* ─── Ensure cache directory ─── */
async function ensureCacheDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

/* ─── Get local path for an audio file ─── */
function getLocalPath(filename: string): string {
  // Extract just the filename from any path (e.g., "audio/001.mp3" → "001.mp3")
  const basename = filename.split("/").pop() || filename;
  const safe = basename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${CACHE_DIR}${safe}`;
}

/* ─── Build remote URL ─── */
function getRemoteUrl(filename: string): string {
  // If filename already includes path separators, use just the basename
  const basename = filename.split("/").pop() || filename;
  return `${BASE_URL}/${basename}`;
}

/* ─── Check if audio is cached ─── */
export async function isAudioCached(filename: string): Promise<boolean> {
  if (!filename) return false;
  try {
    const localPath = getLocalPath(filename);
    const info = await FileSystem.getInfoAsync(localPath);
    return info.exists && (info.size ?? 0) > 0;
  } catch {
    return false;
  }
}

/* ─── Get cached audio URI (returns null if not cached) ─── */
export async function getCachedAudioUri(filename: string): Promise<string | null> {
  if (!filename) return null;
  const localPath = getLocalPath(filename);
  const info = await FileSystem.getInfoAsync(localPath);
  if (info.exists && (info.size ?? 0) > 0) {
    return localPath;
  }
  return null;
}

/* ─── Download audio file with progress ─── */
export async function downloadAthkarAudio(
  filename: string,
  onProgress?: ProgressCallback
): Promise<string> {
  if (!filename) throw new Error("No filename provided");

  await ensureCacheDir();

  // Check cache first
  const cached = await getCachedAudioUri(filename);
  if (cached) return cached;

  const remoteUrl = getRemoteUrl(filename);
  const localPath = getLocalPath(filename);

  const downloadResumable = FileSystem.createDownloadResumable(
    remoteUrl,
    localPath,
    {},
    (downloadProgress) => {
      if (onProgress && downloadProgress.totalBytesExpectedToWrite > 0) {
        onProgress({
          totalBytes: downloadProgress.totalBytesExpectedToWrite,
          downloadedBytes: downloadProgress.totalBytesWritten,
          percent: Math.round(
            (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
          ),
        });
      }
    }
  );

  const result = await downloadResumable.downloadAsync();
  if (!result?.uri) {
    throw new Error("Download failed");
  }

  return result.uri;
}

/* ─── Download and get URI (convenience) ─── */
export async function getAthkarAudioUri(
  filename: string,
  onProgress?: ProgressCallback
): Promise<string | null> {
  if (!filename) return null;
  try {
    return await downloadAthkarAudio(filename, onProgress);
  } catch (err) {
    console.error("Failed to get athkar audio:", err);
    return null;
  }
}

/* ─── Delete cached audio for a single file ─── */
export async function deleteCachedAudio(filename: string): Promise<void> {
  try {
    const localPath = getLocalPath(filename);
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) {
      await FileSystem.deleteAsync(localPath, { idempotent: true });
    }
  } catch {}
}

/* ─── Clear all cached athkar audio ─── */
export async function clearAthkarAudioCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    }
  } catch {}
}

/* ─── Get total cache size in bytes ─── */
export async function getAthkarCacheSize(): Promise<number> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) return 0;

    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    let total = 0;
    for (const file of files) {
      const info = await FileSystem.getInfoAsync(`${CACHE_DIR}${file}`);
      if (info.exists && info.size) total += info.size;
    }
    return total;
  } catch {
    return 0;
  }
}

/* ─── Format bytes for display ─── */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
