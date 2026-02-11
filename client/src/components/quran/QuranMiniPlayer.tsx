import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { Feather } from "@expo/vector-icons";
import {
  RECITER_OPTIONS,
  getPlayerState,
  subscribePlayer,
  togglePlayPause,
  nextAyah,
  prevAyah,
  seekToMillis,
  setRate,
  toggleRepeatOne,
  stopAndHide,
  playAyah,
} from "@/src/services/quranAudio";
import ReciterPickerModal from "@/src/components/quran/ReciterPickerModal";
import { SURAH_META } from "@/constants/quran/surahMeta";

const SPEEDS = [1, 1.25, 1.5, 2];

const formatTime = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export default function QuranMiniPlayer() {
  const [state, setState] = useState(getPlayerState());
  const [reciterOpen, setReciterOpen] = useState(false);

  useEffect(() => {
    return subscribePlayer(setState);
  }, []);

  const reciterLabel = useMemo(() => {
    const found = RECITER_OPTIONS.find((r) => r.key === state.reciterKey);
    return found?.label ?? state.reciterKey;
  }, [state.reciterKey]);

  const speedLabel = useMemo(() => `${state.rate}x`, [state.rate]);

  const remaining = Math.max(0, (state.durationMillis || 0) - (state.positionMillis || 0));
  const currentAyahCount =
    state.surah != null ? SURAH_META.find((surah) => surah.number === state.surah)?.ayahCount ?? 0 : 0;

  if (!state.visible) return null;

  return (
    <>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable style={styles.iconButton} onPress={() => stopAndHide()}>
            <Feather name="x" size={16} color="#6B7280" />
          </Pressable>
          <Pressable style={styles.reciterButton} onPress={() => setReciterOpen(true)}>
            <Text style={styles.reciterText}>{reciterLabel}</Text>
            <Feather name="chevron-down" size={14} color="#6B7280" />
          </Pressable>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.ayahText}>
          {state.surahName ?? ""}: {state.ayah ?? ""}
        </Text>

        <View style={styles.progressRow}>
          <Text style={styles.timeText}>{formatTime(state.positionMillis || 0)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={Math.max(1, state.durationMillis || 1)}
            value={Math.min(state.positionMillis || 0, state.durationMillis || 0)}
            minimumTrackTintColor="#2F6E52"
            maximumTrackTintColor="#E6E0D6"
            thumbTintColor="#2F6E52"
            onSlidingComplete={(value) => seekToMillis(Number(value))}
          />
          <Text style={styles.timeText}>-{formatTime(remaining)}</Text>
        </View>

        <View style={styles.controlsRow}>
          <Pressable onPress={() => toggleRepeatOne()}>
            <Feather name="repeat" size={18} color={state.repeatOne ? "#2F6E52" : "#9CA3AF"} />
          </Pressable>
          <Pressable onPress={() => prevAyah()}>
            <Feather name="skip-back" size={20} color="#2F6E52" />
          </Pressable>
          <Pressable style={styles.playButton} onPress={() => togglePlayPause()}>
            <Feather name={state.isPlaying ? "pause" : "play"} size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={() => nextAyah()}>
            <Feather name="skip-forward" size={20} color="#2F6E52" />
          </Pressable>
          <Pressable
            style={styles.speedButton}
            onPress={() => {
              const idx = SPEEDS.indexOf(state.rate);
              const next = SPEEDS[(idx + 1) % SPEEDS.length];
              void setRate(next);
            }}
          >
            <Text style={styles.speedText}>{speedLabel}</Text>
          </Pressable>
        </View>
      </View>

      <ReciterPickerModal
        visible={reciterOpen}
        onClose={() => setReciterOpen(false)}
        selectedReciterKey={state.reciterKey}
        onSelectReciter={(key) => {
          if (!state.surah || !state.ayah) return;
          void playAyah({
            surah: state.surah,
            ayah: state.ayah,
            surahName: state.surahName,
            reciterKey: key,
          });
        }}
        currentSurahNumber={state.surah ?? 0}
        currentAyahNumber={state.ayah ?? 0}
        currentSurahAyahCount={currentAyahCount}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "#F7F2E9",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E6E0D6",
    zIndex: 200,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE7D9",
  },
  reciterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reciterText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#1F2937",
  },
  headerSpacer: { width: 28 },
  ayahText: {
    marginTop: 6,
    fontFamily: "Cairo",
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  progressRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 24,
  },
  timeText: {
    fontFamily: "Cairo",
    fontSize: 11,
    color: "#6B7280",
    minWidth: 42,
    textAlign: "center",
  },
  controlsRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2F6E52",
    alignItems: "center",
    justifyContent: "center",
  },
  speedButton: {
    minWidth: 40,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#EFE7D9",
    alignItems: "center",
    justifyContent: "center",
  },
  speedText: {
    fontFamily: "CairoBold",
    fontSize: 12,
    color: "#2F6E52",
  },
});
