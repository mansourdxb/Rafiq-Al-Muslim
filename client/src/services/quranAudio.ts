import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

export type ReciterKey = "alafasy" | "abdulsamad" | "sudais";

export const RECITERS: Record<ReciterKey, { folder: string; label: string }> = {
  alafasy: { folder: "Alafasy_128kbps", label: "Alafasy" },
  abdulsamad: { folder: "AbdulSamad_64kbps_QuranExplorer.Com", label: "AbdulSamad" },
  sudais: { folder: "Abdurrahmaan_As-Sudais_64kbps", label: "As-Sudais" },
};

const pad3 = (value: number) => String(value).padStart(3, "0");

export function buildEveryAyahUrl(surah: number, ayah: number, reciter: ReciterKey): string {
  const folder = RECITERS[reciter]?.folder ?? RECITERS.alafasy.folder;
  return `https://everyayah.com/data/${folder}/${pad3(surah)}${pad3(ayah)}.mp3`;
}

export async function getCachedAyahUri(opts: {
  surah: number;
  ayah: number;
  reciter: ReciterKey;
}): Promise<string> {
  const { surah, ayah, reciter } = opts;
  const url = buildEveryAyahUrl(surah, ayah, reciter);
  if (Platform.OS === "web" || !FileSystem.cacheDirectory) {
    return url;
  }
  const folder = RECITERS[reciter]?.folder ?? RECITERS.alafasy.folder;
  const dir = `${FileSystem.cacheDirectory}quran-audio/${folder}/`;
  const file = `${dir}${pad3(surah)}${pad3(ayah)}.mp3`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const info = await FileSystem.getInfoAsync(file);
  if (info.exists && info.uri) {
    return info.uri;
  }
  const downloaded = await FileSystem.downloadAsync(url, file);
  return downloaded.uri;
}

type AyahRef = { surah: number; ayah: number; reciter: ReciterKey };

let audioModeReady = false;
const ensureAudioMode = async () => {
  if (audioModeReady) return;
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
    interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
  audioModeReady = true;
};

export class QuranPlayer {
  private sound: Audio.Sound | null = null;
  private currentKey: string | null = null;
  private isPlaying = false;

  private makeKey({ surah, ayah, reciter }: AyahRef) {
    return `${reciter}:${surah}:${ayah}`;
  }

  async playAyah(ref: AyahRef): Promise<boolean> {
    await ensureAudioMode();
    const key = this.makeKey(ref);
    if (this.sound && this.currentKey === key) {
      await this.sound.playAsync();
      this.isPlaying = true;
      return this.isPlaying;
    }
    await this.unload();
    const uri = await getCachedAyahUri(ref);
    const sound = new Audio.Sound();
    await sound.loadAsync({ uri }, { shouldPlay: true });
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        this.isPlaying = false;
      } else if (status.isPlaying) {
        this.isPlaying = true;
      }
    });
    this.sound = sound;
    this.currentKey = key;
    this.isPlaying = true;
    return this.isPlaying;
  }

  async toggleAyah(ref: AyahRef): Promise<boolean> {
    const key = this.makeKey(ref);
    if (this.sound && this.currentKey === key) {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await this.sound.pauseAsync();
        this.isPlaying = false;
        return this.isPlaying;
      }
      await this.sound.playAsync();
      this.isPlaying = true;
      return this.isPlaying;
    }
    return this.playAyah(ref);
  }

  async stop(): Promise<void> {
    if (!this.sound) return;
    await this.sound.stopAsync();
    this.isPlaying = false;
  }

  async unload(): Promise<void> {
    if (!this.sound) return;
    await this.sound.unloadAsync();
    this.sound = null;
    this.currentKey = null;
    this.isPlaying = false;
  }
}

export const quranPlayer = new QuranPlayer();
