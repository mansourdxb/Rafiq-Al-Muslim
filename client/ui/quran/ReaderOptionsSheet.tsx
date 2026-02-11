import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { quranTheme } from "./theme";
import { loadMarks } from "@/src/lib/quran/ayahMarks";
import { quranFiles } from "@/lib/quran/quranFiles";
import { quranPlayer } from "@/src/services/quranAudio";

function arabicIndic(value: number) {
  const map = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
  return String(value)
    .split("")
    .map((c) => map[Number(c)] ?? c)
    .join("");
}

type Props = {
  visible: boolean;
  ayahNumber: number;
  surahName?: string;
  surahNumber?: number;
  bookmarkColor?: string | null;
  highlightColor?: string | null;
  onClose: () => void;
  onSelectBookmark?: (color: string | null) => void;
  onSelectHighlight?: (color: string | null) => void;
  onShare?: () => void;
  onCopy?: () => void;
  onOpenTafsir?: () => void;
};

const BOOKMARK_COLORS = ["#7BBF94", "#D9B871", "#F08B7E", "#5B7DBE"];
const HIGHLIGHT_COLORS = ["#FFE7C2", "#FFF3C6", "#D7F0E5", "#E7D8F7", "#F6D5D5"];
const BOOKMARK_COLOR_NAMES: Record<string, string> = {
  "#7BBF94": "\u0627\u0644\u0623\u062e\u0636\u0631",
  "#D9B871": "\u0627\u0644\u0623\u0635\u0641\u0631",
  "#F08B7E": "\u0627\u0644\u0623\u062d\u0645\u0631",
  "#5B7DBE": "\u0627\u0644\u0623\u0632\u0631\u0642",
};

export default function ReaderOptionsSheet({
  visible,
  ayahNumber,
  surahName,
  surahNumber,
  bookmarkColor,
  highlightColor,
  onClose,
  onSelectBookmark,
  onSelectHighlight,
  onShare,
  onCopy,
  onOpenTafsir,
}: Props) {
  const translateY = useRef(new Animated.Value(400)).current;
  const [view, setView] = useState<"main" | "fawasil">("main");
  const [fawasilLatest, setFawasilLatest] = useState<Record<string, { sura: number; aya: number; updatedAt?: string }>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : 400,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [translateY, visible]);

  useEffect(() => {
    if (!visible) {
      setView("main");
      quranPlayer.stop();
      quranPlayer.unload();
      setIsPlaying(false);
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      quranPlayer.unload();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (view !== "fawasil" && view !== "main") return;
    const loadFawasil = async () => {
      const marks = await loadMarks();
      const latest: Record<string, { sura: number; aya: number; updatedAt?: string }> = {};
      Object.entries(marks).forEach(([key, mark]) => {
        const color = mark?.bookmarkColor ?? null;
        if (!color) return;
        if (!BOOKMARK_COLORS.includes(color)) return;
        const parts = key.split(":");
        const sura = Number(parts[0]);
        const aya = Number(parts[1]);
        if (!sura || !aya) return;
        const current = latest[color];
        const nextTime = mark?.updatedAt ? new Date(mark.updatedAt).getTime() : 0;
        const currTime = current?.updatedAt ? new Date(current.updatedAt).getTime() : 0;
        if (!current || nextTime >= currTime) {
          latest[color] = { sura, aya, updatedAt: mark?.updatedAt };
        }
      });
      setFawasilLatest(latest);
    };
    loadFawasil();
  }, [visible, view, bookmarkColor]);

  const formatTime = (value?: string) => {
    if (!value) return "";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleTimeString("ar", { hour: "numeric", minute: "2-digit" });
  };

  const buildSubtitle = (sura: number, aya: number, updatedAt?: string) => {
    const surah = quranFiles.find((f) => f.number === sura)?.data?.surah;
    const time = formatTime(updatedAt);
    const surahLabel = surah ?? `\u0633\u0648\u0631\u0629 ${arabicIndic(sura)}`;
    return `${surahLabel}: ${arabicIndic(aya)}${time ? ` \u2022 ${time}` : ""}`;
  };
  const activeBookmark = bookmarkColor ?? BOOKMARK_COLORS[0];
  const activeEntry = activeBookmark ? fawasilLatest[activeBookmark] : undefined;
  const activeTitle = activeBookmark ? BOOKMARK_COLOR_NAMES[activeBookmark] ?? "\u0627\u0644\u0623\u062e\u0636\u0631" : "\u0627\u0644\u0623\u062e\u0636\u0631";
  const activeSubtitle = activeEntry
    ? buildSubtitle(activeEntry.sura, activeEntry.aya, activeEntry.updatedAt)
    : "\u0627\u0644\u0622\u064a\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629";

  const headerTitle = useMemo(() => {
    const number = arabicIndic(ayahNumber);
    return surahName ? `${surahName}: ${number}` : `الآية ${number}`;
  }, [ayahNumber, surahName]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeftGroup}>
            {view === "fawasil" ? (
              <Pressable style={styles.backButton} onPress={() => setView("main")} hitSlop={8}>
                <Feather name="chevron-right" size={18} color="#7A7A7A" />
              </Pressable>
            ) : null}
            <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <Feather name="x" size={18} color="#7A7A7A" />
            </Pressable>
          </View>
          <Text style={styles.title}>{view === "fawasil" ? "\u0627\u0644\u0641\u0648\u0627\u0635\u0644" : headerTitle}</Text>
          {view === "main" ? (
            <Pressable style={styles.editButton} onPress={() => {}} hitSlop={8}>
              <Text style={styles.editText}>{"\u062a\u0639\u062f\u064a\u0644"}</Text>
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {view === "main" ? (
            <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{"الفواصل"}</Text>
            <Pressable style={styles.rowCard} onPress={() => onSelectBookmark?.(activeBookmark ?? null)}>
              <View style={styles.rowRight}>
                {activeEntry ? (
                  <Ionicons name="bookmark" size={18} color={activeBookmark ?? "#7BBF94"} />
                ) : (
                  <Feather name="bookmark" size={18} color={activeBookmark ?? "#7BBF94"} />
                )}
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowTitle}>{activeTitle}</Text>
                  <Text style={styles.rowSubtitle}>{activeSubtitle}</Text>
                </View>
              </View>
            </Pressable>
            <Pressable style={styles.rowCard} onPress={() => setView("fawasil")}>
              <View style={styles.rowRight}>
                <Feather name="list" size={18} color="#6B7280" />
                <Text style={styles.rowTitle}>{"الكل"}</Text>
              </View>
              <Feather name="chevron-left" size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{"التلاوة"}</Text>
            <Pressable
              style={styles.rowCard}
              onPress={async () => {
                if (isLoading) return;
                setIsLoading(true);
                try {
                  if (!surahNumber) return;
                  const playing = await quranPlayer.toggleAyah({
                    surah: surahNumber,
                    ayah: ayahNumber,
                    reciter: "alafasy",
                  });
                  setIsPlaying(playing);
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              <View style={styles.rowRight}>
                <Feather name={isPlaying ? "pause" : "play"} size={18} color="#2F6E52" />
                <Text style={styles.rowTitle}>{"تشغيل"}</Text>
              </View>
            </Pressable>
            <Pressable style={styles.rowCard} onPress={() => {}}>
              <View style={styles.rowRight}>
                <Feather name="play" size={18} color="#2F6E52" />
                <Text style={styles.rowTitle}>{"تشغيل إلى"}</Text>
              </View>
              <Feather name="chevron-left" size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{"التفسير"}</Text>
            <Pressable style={styles.rowCard} onPress={() => {}}>
              <View style={styles.rowRight}>
                <Feather name="book" size={18} color="#6B7280" />
                <Text style={styles.rowTitle}>{"اختيار كتاب..."}</Text>
              </View>
            </Pressable>
            <Pressable style={styles.rowCard} onPress={onOpenTafsir}>
              <View style={styles.rowRight}>
                <Feather name="book-open" size={18} color="#6B7280" />
                <Text style={styles.rowTitle}>{"المكتبة"}</Text>
              </View>
              <Feather name="chevron-left" size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{"المشاركة"}</Text>
            <View style={styles.shareButtonsRow}>
              <Pressable style={styles.shareSquare} onPress={onCopy}>
                <Feather name="copy" size={18} color="#2F6E52" />
                <Text style={styles.shareSquareText}>{"نسخ"}</Text>
              </Pressable>
              <Pressable style={styles.shareSquare} onPress={onShare}>
                <Feather name="share-2" size={18} color="#2F6E52" />
                <Text style={styles.shareSquareText}>{"مشاركة"}</Text>
              </Pressable>
            </View>
            <Pressable style={styles.rowCard} onPress={onShare}>
              <View style={styles.rowRight}>
                <Feather name="share-2" size={18} color="#2F6E52" />
                <Text style={styles.rowTitle}>{"مشاركة"}</Text>
              </View>
              <Feather name="chevron-left" size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{"التمييز"}</Text>
            <View style={styles.colorRow}>
              {HIGHLIGHT_COLORS.map((c) => {
                const active = highlightColor === c;
                return (
                  <Pressable key={c} onPress={() => onSelectHighlight?.(c)} style={styles.colorPress}>
                    <View style={[styles.colorDot, { backgroundColor: c }, active && styles.colorActive]} />
                  </Pressable>
                );
              })}
              <Pressable onPress={() => onSelectHighlight?.(null)} style={styles.colorPress}>
                <View style={[styles.colorDot, styles.noneDot]}>
                  <Feather name="slash" size={14} color="#6B7280" />
                </View>
              </Pressable>
            </View>
          </View>
        
            </>
          ) : (
            <View style={styles.section}>
              <View style={styles.fawasilCard}>
                {BOOKMARK_COLORS.map((c, idx) => {
                  const entry = fawasilLatest[c];
                  const title = BOOKMARK_COLOR_NAMES[c] ?? "";
                  const subtitle = entry ? buildSubtitle(entry.sura, entry.aya, entry.updatedAt) : "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f";
                  return (
                    <Pressable
                      key={c}
                      style={[
                        styles.fawasilRow,
                        idx < BOOKMARK_COLORS.length - 1 ? styles.fawasilRowDivider : null,
                      ]}
                      onPress={() => {
                        onSelectBookmark?.(c);
                        setView("main");
                      }}
                    >
                      <View style={styles.rowRight}>
                        <Ionicons name="bookmark" size={20} color={c} />
                        <View style={styles.rowTextWrap}>
                          <Text style={styles.rowTitle}>{title}</Text>
                          <Text style={styles.rowSubtitle}>{subtitle}</Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
</ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F7F2E9",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    maxHeight: "88%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE7D9",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE7D9",
  },
  title: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: quranTheme.colors.text,
    textAlign: "center",
    flex: 1,
  },
  editButton: {
    minWidth: 44,
    alignItems: "flex-start",
  },
  editText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#2F6E52",
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    gap: 18,
    paddingBottom: 24,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: quranTheme.colors.text,
    textAlign: "right",
  },
  rowCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowRight: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  rowTextWrap: {
    alignItems: "flex-end",
  },
  rowTitle: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: quranTheme.colors.text,
    textAlign: "right",
  },
  rowSubtitle: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
    marginTop: 2,
  },
  fawasilCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 6,
  },
  fawasilRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fawasilRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  colorRow: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  colorPress: {
    padding: 2,
    borderRadius: 999,
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  colorActive: {
    borderWidth: 2,
    borderColor: "#2F6E52",
  },
  shareButtonsRow: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  shareSquare: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  shareSquareText: {
    fontFamily: "CairoBold",
    fontSize: 13,
    color: quranTheme.colors.text,
  },
});
