import { Alert } from "react-native";
import { Audio } from "expo-av";

import type { AthanSoundId } from "@/screens/qibla/services/salatukAthanSounds";

let currentSound: Audio.Sound | null = null;
let audioModeReady = false;

const FILE_MAP: Record<AthanSoundId, string> = {
  makkah: "makkah.mp3",
  madina: "madina.mp3",
  oriental1: "oriental1.mp3",
  oriental2: "oriental2.mp3",
  maghrib1: "maghrib1.mp3",
};

const ATHAN_ASSETS = {
  makkah: require("../../../assets/athan/makkah.mp3"),
  madina: require("../../../assets/athan/madina.mp3"),
  oriental1: require("../../../assets/athan/oriental1.mp3"),
  oriental2: require("../../../assets/athan/oriental2.mp3"),
  maghrib1: require("../../../assets/athan/maghrib1.mp3"),
} as const;

export function getAthanAsset(soundId: AthanSoundId) {
  const asset = ATHAN_ASSETS[soundId];
  if (!asset) {
    const filename = FILE_MAP[soundId];
    Alert.alert(
      "Missing Athan audio",
      `Please add client/assets/athan/${filename} and rebuild the app.`
    );
    return null;
  }
  return asset;
}

async function ensureAudioMode() {
  if (audioModeReady) return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    audioModeReady = true;
  } catch {
    audioModeReady = false;
  }
}

export async function playPreview(soundId: AthanSoundId): Promise<void> {
  await ensureAudioMode();
  await stopPreview();
  const asset = getAthanAsset(soundId);
  if (!asset) return;
  const next = new Audio.Sound();
  try {
    await next.loadAsync(asset, { shouldPlay: true });
    await next.playAsync();
    currentSound = next;
  } catch {
    await next.unloadAsync().catch(() => undefined);
    currentSound = null;
    const filename = FILE_MAP[soundId];
    Alert.alert(
      "Missing Athan audio",
      `Please add client/assets/athan/${filename} and rebuild the app.`
    );
  }
}

export async function stopPreview(): Promise<void> {
  if (!currentSound) return;
  try {
    await currentSound.stopAsync();
  } catch {
    // Ignore stop errors.
  }
  try {
    await currentSound.unloadAsync();
  } catch {
    // Ignore unload errors.
  }
  currentSound = null;
}


