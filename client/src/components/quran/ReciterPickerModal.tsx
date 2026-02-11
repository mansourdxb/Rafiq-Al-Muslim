import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Audio as ExpoAudio } from "expo-av";
import { RECITER_OPTIONS, ReciterKey, getCachedAyahUri } from "@/src/services/quranAudio";

type ReciterOption = (typeof RECITER_OPTIONS)[number];

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedReciterKey: ReciterKey;
  onSelectReciter: (key: ReciterKey) => void;
  currentSurahNumber: number;
  currentAyahNumber: number;
};

export default function ReciterPickerModal({
  visible,
  onClose,
  selectedReciterKey,
  onSelectReciter,
  currentSurahNumber,
  currentAyahNumber,
}: Props) {
  const [searchValue, setSearchValue] = useState("");
  const [previewingKey, setPreviewingKey] = useState<ReciterKey | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [infoReciter, setInfoReciter] = useState<ReciterOption | null>(null);

  const previewSoundRef = useRef<ExpoAudio.Sound | null>(null);
  const previewWebAudioRef = useRef<any>(null);
  const previewModeReadyRef = useRef(false);

  const filteredReciters = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) return RECITER_OPTIONS;
    return RECITER_OPTIONS.filter((reciter) => reciter.label.toLowerCase().includes(normalized));
  }, [searchValue]);

  useEffect(() => {
    if (!visible) {
      setSearchValue("");
      setInfoReciter(null);
      void stopPreview();
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      void stopPreview();
    };
  }, []);

  const ensurePreviewMode = async () => {
    if (Platform.OS === "web") return;
    if (previewModeReadyRef.current) return;
    await ExpoAudio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: ExpoAudio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      interruptionModeAndroid: ExpoAudio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    previewModeReadyRef.current = true;
  };

  const stopPreview = async () => {
    if (Platform.OS === "web") {
      if (previewWebAudioRef.current) {
        previewWebAudioRef.current.pause();
        previewWebAudioRef.current.currentTime = 0;
        previewWebAudioRef.current = null;
      }
    } else if (previewSoundRef.current) {
      await previewSoundRef.current.stopAsync();
      await previewSoundRef.current.unloadAsync();
      previewSoundRef.current = null;
    }
    setIsPreviewPlaying(false);
    setPreviewingKey(null);
  };

  const startPreview = async (reciterKey: ReciterKey) => {
    if (!currentSurahNumber || !currentAyahNumber) return;
    await stopPreview();
    setPreviewingKey(reciterKey);
    setIsPreviewPlaying(true);
    if (Platform.OS === "web") {
      const url = await getCachedAyahUri({
        surah: currentSurahNumber,
        ayah: currentAyahNumber,
        reciter: reciterKey,
      });
      const HtmlAudioCtor = typeof window !== "undefined" ? (window as any).Audio : null;
      const audio = HtmlAudioCtor ? new HtmlAudioCtor(url) : null;
      previewWebAudioRef.current = audio;
      if (!audio) {
        setIsPreviewPlaying(false);
        setPreviewingKey(null);
        return;
      }
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      audio.onended = () => {
        setIsPreviewPlaying(false);
        setPreviewingKey(null);
      };
      audio.onerror = () => {
        setIsPreviewPlaying(false);
        setPreviewingKey(null);
      };
      await audio.play();
      return;
    }

    await ensurePreviewMode();
    const uri = await getCachedAyahUri({
      surah: currentSurahNumber,
      ayah: currentAyahNumber,
      reciter: reciterKey,
    });
    const sound = new ExpoAudio.Sound();
    previewSoundRef.current = sound;
    await sound.loadAsync({ uri }, { shouldPlay: true });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        setIsPreviewPlaying(false);
        setPreviewingKey(null);
      }
    });
    await sound.playAsync();
  };

  const handleTogglePreview = async (reciterKey: ReciterKey) => {
    if (previewingKey === reciterKey && isPreviewPlaying) {
      await stopPreview();
      return;
    }
    await startPreview(reciterKey);
  };

  const handleClose = () => {
    void stopPreview();
    onClose();
  };

  const renderItem = ({ item, index }: { item: ReciterOption; index: number }) => {
    const isSelected = item.key === selectedReciterKey;
    const isLast = index === filteredReciters.length - 1;
    const previewActive = previewingKey === item.key && isPreviewPlaying;

    return (
      <View style={[styles.row, !isLast ? styles.rowDivider : null]}>
        <Pressable style={styles.playButton} onPress={() => void handleTogglePreview(item.key)}>
          <Feather name={previewActive ? "pause" : "volume-2"} size={18} color="#2F6E52" />
        </Pressable>
        <Pressable
          style={styles.nameButton}
          onPress={() => {
            onSelectReciter(item.key);
            handleClose();
          }}
        >
          <Text style={styles.reciterName}>{item.label}</Text>
        </Pressable>
        <View style={styles.leftCluster}>
          {isSelected ? <Feather name="check" size={18} color="#2F6E52" /> : <View style={styles.checkSpacer} />}
          <Pressable style={styles.infoButton} onPress={() => setInfoReciter(item)}>
            <Feather name="info" size={16} color="#2F6E52" />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerIcon} onPress={handleClose}>
            <Feather name="x" size={18} color="#7A6C5A" />
          </Pressable>
          <Text style={styles.headerTitle}>اختيار التلاوة</Text>
          <Pressable style={styles.headerAction} onPress={() => null}>
            <Text style={styles.headerActionText}>تعديل</Text>
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            value={searchValue}
            onChangeText={setSearchValue}
            placeholder="بحث"
            placeholderTextColor="#9E9487"
            style={styles.searchInput}
          />
          <View style={styles.searchIcon}>
            <Feather name="search" size={16} color="#9E9487" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>التلاوات</Text>

        <View style={styles.listCard}>
          <FlatList
            data={filteredReciters}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>

      <Modal visible={!!infoReciter} transparent animationType="fade" onRequestClose={() => setInfoReciter(null)}>
        <Pressable style={styles.infoBackdrop} onPress={() => setInfoReciter(null)} />
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{infoReciter?.label ?? ""}</Text>
          <Text style={styles.infoSubtitle}>{infoReciter?.key ?? ""}</Text>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F2E9",
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE7D9",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "CairoBold",
    fontSize: 18,
    color: "#2D2520",
  },
  headerAction: {
    minWidth: 36,
    alignItems: "flex-end",
  },
  headerActionText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#2F6E52",
  },
  searchRow: {
    marginTop: 8,
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#E7DED1",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Cairo",
    fontSize: 14,
    color: "#2D2520",
    textAlign: "right",
    writingDirection: "rtl",
    ...(Platform.OS === "web" ? ({ direction: "rtl" } as const) : null),
  },
  searchIcon: {
    marginLeft: 6,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#2D2520",
    textAlign: "right",
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6E0D6",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#EFE7D9",
  },
  playButton: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  nameButton: {
    flex: 1,
    paddingHorizontal: 10,
  },
  reciterName: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#2D2520",
    textAlign: "right",
  },
  leftCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#2F6E52",
    alignItems: "center",
    justifyContent: "center",
  },
  checkSpacer: {
    width: 18,
  },
  infoBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  infoCard: {
    position: "absolute",
    left: 24,
    right: 24,
    top: "40%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E6E0D6",
  },
  infoTitle: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#2D2520",
    textAlign: "right",
  },
  infoSubtitle: {
    marginTop: 6,
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
  },
});
