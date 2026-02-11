import { Audio as ExpoAudio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SURAH_META } from "@/constants/quran/surahMeta";

export const RECITERS = [
  { key: "alafasy", label: "???????", folder: "Alafasy_128kbps" },
  { key: "abdulsamad", label: "????????", folder: "AbdulSamad_64kbps_QuranExplorer.Com" },
  { key: "sudais", label: "??????", folder: "Abdurrahmaan_As-Sudais_64kbps" },
  { key: "abdulbasit64", label: "????????? (????)", folder: "Abdul_Basit_Murattal_64kbps" },
] as const;

export type ReciterKey = (typeof RECITERS)[number]["key"];

const RECITER_MAP: Record<ReciterKey, { key: ReciterKey; label: string; folder: string }> = RECITERS.reduce(
  (acc, item) => {
    acc[item.key] = item;
    return acc;
  },
  {} as Record<ReciterKey, { key: ReciterKey; label: string; folder: string }>
);

const pad3 = (value: number) => String(value).padStart(3, "0");

export function buildEveryAyahUrl(surah: number, ayah: number, reciter: ReciterKey): string {
  const folder = RECITER_MAP[reciter]?.folder ?? RECITER_MAP.alafasy.folder;
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
  const folder = RECITER_MAP[reciter]?.folder ?? RECITER_MAP.alafasy.folder;
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

export type PlayerState = {
  visible: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  surah: number | null;
  ayah: number | null;
  surahName?: string;
  reciterKey: ReciterKey;
  positionMillis: number;
  durationMillis: number;
  rate: number;
  repeatOne: boolean;
};

const DEFAULT_STATE: PlayerState = {
  visible: false,
  isLoading: false,
  isPlaying: false,
  surah: null,
  ayah: null,
  surahName: undefined,
  reciterKey: "alafasy",
  positionMillis: 0,
  durationMillis: 0,
  rate: 1,
  repeatOne: false,
};

const SUBSCRIBERS = new Set<(s: PlayerState) => void>();
let playerState: PlayerState = { ...DEFAULT_STATE };

export function getPlayerState(): PlayerState {
  return playerState;
}

const emitState = (next: Partial<PlayerState>) => {
  playerState = { ...playerState, ...next };
  SUBSCRIBERS.forEach((cb) => cb(playerState));
};

export function subscribePlayer(cb: (s: PlayerState) => void): () => void {
  SUBSCRIBERS.add(cb);
  cb(playerState);
  return () => {
    SUBSCRIBERS.delete(cb);
  };
}

const RECITER_STORAGE_KEY = "quran.reciterKey";
let reciterLoaded = false;
const loadReciterKey = async (): Promise<ReciterKey> => {
  if (reciterLoaded) return playerState.reciterKey;
  try {
    const raw = await AsyncStorage.getItem(RECITER_STORAGE_KEY);
    if (raw && raw in RECITER_MAP) {
      emitState({ reciterKey: raw as ReciterKey });
    }
  } catch {
    // ignore
  }
  reciterLoaded = true;
  return playerState.reciterKey;
};

const persistReciterKey = async (key: ReciterKey) => {
  if (key === playerState.reciterKey) return;
  emitState({ reciterKey: key });
  try {
    await AsyncStorage.setItem(RECITER_STORAGE_KEY, key);
  } catch {
    // ignore
  }
};

const SURAH_MAP = new Map(SURAH_META.map((s) => [s.number, s]));
const resolveSurahName = (surah: number, provided?: string) => {
  if (provided) return provided;
  return SURAH_MAP.get(surah)?.name_ar ?? `???? ${surah}`;
};

let audioModeReady = false;
let sound: ExpoAudio.Sound | null = null;
let currentKey: string | null = null;
let webAudio: HTMLAudioElement | null = null;
let webKey: string | null = null;

const ensureAudioMode = async () => {
  if (Platform.OS === "web") return;
  if (audioModeReady) return;
  await ExpoAudio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    interruptionModeIOS: ExpoAudio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
    interruptionModeAndroid: ExpoAudio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
  audioModeReady = true;
};

const makeKey = (surah: number, ayah: number, reciterKey: ReciterKey) => `${reciterKey}:${surah}:${ayah}`;

const handleEnded = async () => {
  if (!playerState.surah || !playerState.ayah) return;
  if (playerState.repeatOne) {
    await playAyah({
      surah: playerState.surah,
      ayah: playerState.ayah,
      surahName: playerState.surahName,
      reciterKey: playerState.reciterKey,
    });
    return;
  }
  await nextAyah();
};

const attachWebEvents = (audio: HTMLAudioElement, url: string) => {
  audio.onplaying = () => {
    console.log("[QuranAudio][web] playing", url);
    emitState({ isPlaying: true, isLoading: false });
  };
  audio.onpause = () => {
    console.log("[QuranAudio][web] paused", url);
    emitState({ isPlaying: false });
  };
  audio.onloadedmetadata = () => {
    emitState({ durationMillis: Math.floor(audio.duration * 1000) || 0 });
  };
  audio.ontimeupdate = () => {
    emitState({ positionMillis: Math.floor(audio.currentTime * 1000) || 0 });
  };
  audio.onended = () => {
    emitState({ isPlaying: false });
    void handleEnded();
  };
  audio.onerror = (e) => {
    console.error("[QuranAudio][web] error", url, e);
    emitState({ isPlaying: false, isLoading: false });
  };
};

const startWebPlayback = async (surah: number, ayah: number, reciterKey: ReciterKey) => {
  const url = buildEveryAyahUrl(surah, ayah, reciterKey);
  console.log("[QuranAudio][web] url", url);
  if (webAudio) {
    webAudio.pause();
    webAudio.currentTime = 0;
  }
  const HtmlAudioCtor = typeof window !== "undefined" ? window.Audio : null;
  webAudio = HtmlAudioCtor ? new HtmlAudioCtor(url) : null;
  if (!webAudio) {
    emitState({ isPlaying: false, isLoading: false });
    return;
  }
  webAudio.preload = "auto";
  webAudio.crossOrigin = "anonymous";
  webAudio.playbackRate = playerState.rate || 1;
  attachWebEvents(webAudio, url);
  webKey = makeKey(surah, ayah, reciterKey);
  await webAudio.play();
};

const startNativePlayback = async (surah: number, ayah: number, reciterKey: ReciterKey) => {
  await ensureAudioMode();
  await stopInternal(false);
  const uri = await getCachedAyahUri({ surah, ayah, reciter: reciterKey });
  const newSound = new ExpoAudio.Sound();
  await newSound.loadAsync({ uri }, { shouldPlay: true, rate: playerState.rate || 1 });
  await newSound.playAsync();
  newSound.setOnPlaybackStatusUpdate((status) => {
    if (!status.isLoaded) return;
    emitState({
      isPlaying: status.isPlaying,
      positionMillis: status.positionMillis ?? 0,
      durationMillis: status.durationMillis ?? 0,
    });
    if (status.didJustFinish) {
      emitState({ isPlaying: false });
      void handleEnded();
    }
  });
  sound = newSound;
  currentKey = makeKey(surah, ayah, reciterKey);
};

const stopInternal = async (hide: boolean) => {
  if (Platform.OS === "web") {
    if (webAudio) {
      webAudio.pause();
      webAudio.currentTime = 0;
      webAudio = null;
      webKey = null;
    }
  } else if (sound) {
    await sound.stopAsync();
    await sound.unloadAsync();
    sound = null;
    currentKey = null;
  }
  emitState({
    isPlaying: false,
    isLoading: false,
    positionMillis: 0,
    durationMillis: 0,
    ...(hide ? { visible: false, surah: null, ayah: null, surahName: undefined } : null),
  });
};

export async function playAyah(opts: {
  surah: number;
  ayah: number;
  surahName?: string;
  reciterKey?: ReciterKey;
}): Promise<void> {
  const { surah, ayah, surahName, reciterKey } = opts;
  const storedReciter = await loadReciterKey();
  const nextReciter = reciterKey ?? storedReciter;
  if (reciterKey) {
    await persistReciterKey(reciterKey);
  }
  const key = makeKey(surah, ayah, nextReciter);
  currentKey = key;
  emitState({
    visible: true,
    isLoading: true,
    surah,
    ayah,
    surahName: resolveSurahName(surah, surahName),
    reciterKey: nextReciter,
  });
  if (Platform.OS === "web") {
    await startWebPlayback(surah, ayah, nextReciter);
    return;
  }
  await startNativePlayback(surah, ayah, nextReciter);
  emitState({ isLoading: false, isPlaying: true });
}

export async function togglePlayPause(): Promise<void> {
  if (Platform.OS === "web") {
    if (!webAudio) return;
    if (webAudio.paused) {
      await webAudio.play();
      emitState({ isPlaying: true });
    } else {
      webAudio.pause();
      emitState({ isPlaying: false });
    }
    return;
  }
  if (!sound) return;
  const status = await sound.getStatusAsync();
  if (!status.isLoaded) return;
  if (status.isPlaying) {
    await sound.pauseAsync();
    emitState({ isPlaying: false });
  } else {
    await sound.playAsync();
    emitState({ isPlaying: true });
  }
}

export async function stopAndHide(): Promise<void> {
  await stopInternal(true);
}

export async function seekToMillis(ms: number): Promise<void> {
  if (Platform.OS === "web") {
    if (!webAudio) return;
    webAudio.currentTime = Math.max(0, ms / 1000);
    emitState({ positionMillis: Math.max(0, ms) });
    return;
  }
  if (!sound) return;
  await sound.setPositionAsync(Math.max(0, ms));
}

export async function setRate(nextRate: number): Promise<void> {
  emitState({ rate: nextRate });
  if (Platform.OS === "web") {
    if (webAudio) {
      webAudio.playbackRate = nextRate;
    }
    return;
  }
  if (!sound) return;
  await sound.setRateAsync(nextRate, true);
}

export async function toggleRepeatOne(): Promise<void> {
  emitState({ repeatOne: !playerState.repeatOne });
}

export async function nextAyah(): Promise<void> {
  const surah = playerState.surah;
  const ayah = playerState.ayah;
  if (!surah || !ayah) return;
  const meta = SURAH_MAP.get(surah);
  const count = meta?.ayahCount ?? 0;
  if (ayah < count) {
    await playAyah({
      surah,
      ayah: ayah + 1,
      surahName: meta?.name_ar,
      reciterKey: playerState.reciterKey,
    });
    return;
  }
  if (surah < 114) {
    const nextMeta = SURAH_MAP.get(surah + 1);
    await playAyah({
      surah: surah + 1,
      ayah: 1,
      surahName: nextMeta?.name_ar,
      reciterKey: playerState.reciterKey,
    });
    return;
  }
  await stopAndHide();
}

export async function prevAyah(): Promise<void> {
  const surah = playerState.surah;
  const ayah = playerState.ayah;
  if (!surah || !ayah) return;
  if (ayah > 1) {
    const meta = SURAH_MAP.get(surah);
    await playAyah({
      surah,
      ayah: ayah - 1,
      surahName: meta?.name_ar,
      reciterKey: playerState.reciterKey,
    });
    return;
  }
  if (surah > 1) {
    const prevMeta = SURAH_MAP.get(surah - 1);
    const lastAyah = prevMeta?.ayahCount ?? 1;
    await playAyah({
      surah: surah - 1,
      ayah: lastAyah,
      surahName: prevMeta?.name_ar,
      reciterKey: playerState.reciterKey,
    });
    return;
  }
}
