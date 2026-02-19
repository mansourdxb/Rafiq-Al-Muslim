import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

type MiniPlayerProps = {
  controlsVisible?: boolean;
  visibleAyahInfo?: { surah: number; ayah: number; surahName: string } | null;
};

export default function QuranMiniPlayer({ controlsVisible = true, visibleAyahInfo }: MiniPlayerProps) {
  const [state, setState] = useState(getPlayerState());
  const [reciterOpen, setReciterOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const insets = useSafeAreaInsets();

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

  if (!controlsVisible) return null;

  // ── Minimized compact bar ──
  if (!expanded) {
    return (
      <View style={[styles.miniBar, { bottom: 12 + insets.bottom }]}>
        <Pressable
          style={styles.miniPlayButton}
          onPress={() => {
            if (state.visible && (state.isPlaying || state.surah != null)) {
              togglePlayPause();
            } else if (visibleAyahInfo) {
              const meta = SURAH_META.find((s) => s.number === visibleAyahInfo.surah);
              void playAyah({
                surah: visibleAyahInfo.surah,
                ayah: visibleAyahInfo.ayah,
                surahName: visibleAyahInfo.surahName,
                reciterKey: state.reciterKey,
                ayahCount: meta?.ayahCount,
              });
            }
          }}
          hitSlop={8}
        >
          <Feather name={state.isPlaying ? "pause" : "play"} size={18} color="#FFFFFF" />
        </Pressable>
        <Pressable style={styles.miniInfo} onPress={() => setExpanded(true)}>
          <Text style={styles.miniReciterText} numberOfLines={1}>{reciterLabel}</Text>
          <Feather name="chevron-up" size={16} color="#6B7280" />
        </Pressable>
      </View>
    );
  }

  // ── Expanded full player ──

  // If expanded but no audio loaded, show reciter picker only
  if (!state.visible) {
    return (
      <>
        <View style={[styles.container, { bottom: 12 + insets.bottom }]}>
          <View style={styles.headerRow}>
            <Pressable style={styles.iconButton} onPress={() => setExpanded(false)}>
              <Feather name="x" size={16} color="#6B7280" />
            </Pressable>
            <Pressable style={styles.reciterButton} onPress={() => setReciterOpen(true)}>
              <Text style={styles.reciterText}>{reciterLabel}</Text>
              <Feather name="chevron-down" size={14} color="#6B7280" />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setExpanded(false)}>
              <Feather name="chevron-down" size={16} color="#6B7280" />
            </Pressable>
          </View>
          <Text style={styles.noAudioHint}>اختر القارئ ثم اختر آية للاستماع</Text>
          {visibleAyahInfo ? (
            <View style={styles.noAudioPlayRow}>
              <Pressable
                style={styles.playButton}
                onPress={() => {
                  const meta = SURAH_META.find((s) => s.number === visibleAyahInfo.surah);
                  void playAyah({
                    surah: visibleAyahInfo.surah,
                    ayah: visibleAyahInfo.ayah,
                    surahName: visibleAyahInfo.surahName,
                    reciterKey: state.reciterKey,
                    ayahCount: meta?.ayahCount,
                  });
                }}
              >
                <Feather name="play" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : null}
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
              ayahCount: currentAyahCount,
            });
          }}
          currentSurahNumber={state.surah ?? 0}
          currentAyahNumber={state.ayah ?? 0}
          currentSurahAyahCount={currentAyahCount}
        />
      </>
    );
  }

  const isLoading = state.isLoading;

  return (
    <>
      <View style={[styles.container, { bottom: 12 + insets.bottom }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.iconButton} onPress={() => { stopAndHide(); setExpanded(false); }}>
            <Feather name="x" size={16} color="#6B7280" />
          </Pressable>
          <Pressable style={styles.reciterButton} onPress={() => setReciterOpen(true)}>
            <Text style={styles.reciterText}>{reciterLabel}</Text>
            <Feather name="chevron-down" size={14} color="#6B7280" />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => setExpanded(false)}>
            <Feather name="chevron-down" size={16} color="#6B7280" />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.downloadSection}>
            <Text style={styles.loadingText}>{"\u064A\u062C\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644..."}</Text>
            <View style={styles.downloadBarBg}>
              <View style={[styles.downloadBarFill, { flex: Math.max(0.01, state.downloadProgress ?? 0) }]} />
              <View style={{ flex: Math.max(0.01, 1 - (state.downloadProgress ?? 0)) }} />
            </View>
            <Text style={styles.downloadPercent}>{Math.round((state.downloadProgress ?? 0) * 100)}%</Text>
          </View>
        ) : (
          <Text style={styles.ayahText}>
            {state.surahName ?? ""}: {state.ayah ?? ""}
          </Text>
        )}

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
            ayahCount: currentAyahCount,
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
  // ── Minimized bar ──
  miniBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "#F7F2E9",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E6E0D6",
    zIndex: 200,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  miniPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2F6E52",
    alignItems: "center",
    justifyContent: "center",
  },
  miniInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  miniReciterText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#1F2937",
  },
  noAudioHint: {
    marginTop: 10,
    fontFamily: "Cairo",
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    writingDirection: "rtl",
  },
  noAudioPlayRow: {
    marginTop: 10,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 6,
    fontFamily: "Cairo",
    fontSize: 13,
    color: "#2F6E52",
    textAlign: "center",
    writingDirection: "rtl",
  },
  downloadSection: {
    alignItems: "center",
    marginTop: 4,
  },
  downloadBarBg: {
    width: "80%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E6E0D6",
    marginTop: 6,
    overflow: "hidden",
    flexDirection: "row",
  },
  downloadBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2F6E52",
  },
  downloadPercent: {
    fontFamily: "Cairo",
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  // ── Expanded player ──
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
