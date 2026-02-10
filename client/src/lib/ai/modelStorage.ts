import * as FileSystem from "expo-file-system";

const MODEL_FILE_NAME = "ai-model.gguf";
export const MODEL_URL = "https://example.com/ai-model.gguf";

export function getModelDir() {
  return FileSystem.documentDirectory + "models/";
}

export function getModelPath() {
  return getModelDir() + MODEL_FILE_NAME;
}

export async function ensureModelDir() {
  const dir = getModelDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

export async function isModelInstalled() {
  const info = await FileSystem.getInfoAsync(getModelPath());
  return info.exists;
}

export async function getModelInfo() {
  const info = await FileSystem.getInfoAsync(getModelPath());
  return { exists: info.exists, sizeBytes: info.size ?? 0 };
}

export async function downloadModel(onProgress: (ratio: number, written: number, total: number) => void) {
  await ensureModelDir();
  const dest = getModelPath();
  const download = FileSystem.createDownloadResumable(
    MODEL_URL,
    dest,
    {},
    (progress) => {
      if (!progress.totalBytesExpectedToWrite) return;
      const ratio = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
      onProgress(ratio, progress.totalBytesWritten, progress.totalBytesExpectedToWrite);
    }
  );

  const result = await download.downloadAsync();
  if (!result?.uri) {
    throw new Error("فشل تحميل النموذج");
  }
  return result.uri;
}

export async function deleteModel() {
  const path = getModelPath();
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }
}
