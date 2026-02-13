import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Share,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { loadMarks } from "@/src/lib/quran/ayahMarks";
import { quranFiles } from "@/lib/quran/quranFiles";

type TafsirEntry = { type?: string; text?: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  pageNo: number;
  juzNo: number;
  ayahText: string;
  tafsirList?: TafsirEntry[];
  bookmarkColor?: string | null;
  highlightColor?: string | null;
  onSelectBookmark?: (color: string | null) => void;
  onSelectHighlight?: (color: string | null) => void;
  onJumpToAyah?: (sura: number, ayah: number) => void;
};

const BOOKMARK_COLORS = ["#7BBF94", "#D9B871", "#F08B7E", "#5B7DBE"];
const HIGHLIGHT_COLORS = ["#9B6BFF", "#57B4FF", "#46C79B", "#F0C75E", "#F59D5F"];
const BOOKMARK_COLOR_NAMES: Record<string, string> = {
  "#7BBF94": "\u0627\u0644\u0623\u062e\u0636\u0631",
  "#D9B871": "\u0627\u0644\u0623\u0635\u0641\u0631",
  "#F08B7E": "\u0627\u0644\u0623\u062d\u0645\u0631",
  "#5B7DBE": "\u0627\u0644\u0623\u0632\u0631\u0642",
};

function arabicIndic(value: number) {
  const map = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
  return String(value)
    .split("")
    .map((c) => map[Number(c)] ?? c)
    .join("");
}

export default function AyahActionSheet({
  visible,
  onClose,
  surahName,
  ayahNumber,
  ayahText,
  tafsirList = [],
  bookmarkColor,
  highlightColor,
  onSelectBookmark,
  onSelectHighlight,
  onJumpToAyah,
}: Props) {
  const [showTafsir, setShowTafsir] = useState(false);
  const [view, setView] = useState<"main" | "fawasil">("main");
  const [fawasilLatest, setFawasilLatest] = useState<Record<string, { sura: number; aya: number; updatedAt?: string }>>({});

  useEffect(() => {
    if (!visible) {
      setView("main");
      return;
    }
    const loadFawasil = async () => {
      const marks = await loadMarks();
      const latest: Record<string, { sura: number; aya: number; updatedAt?: string }> = {};
      Object.entries(marks).forEach(([key, mark]) => {
        const color = mark?.bookmarkColor ?? null;
        if (!color) return;
        if (!BOOKMARK_COLORS.includes(color)) return;
        const [suraStr, ayaStr] = key.split(":");
        const sura = Number(suraStr);
        const aya = Number(ayaStr);
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
  }, [visible]);

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
  const GREEN_BOOKMARK = BOOKMARK_COLORS[0];
  const greenEntry = GREEN_BOOKMARK ? fawasilLatest[GREEN_BOOKMARK] : undefined;
  const isCurrentGreen = greenEntry && greenEntry.sura === surahNumber && greenEntry.aya === ayahNumber;
  const greenSubtitle = greenEntry
    ? isCurrentGreen
      ? "\u0627\u0644\u0622\u064a\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629"
      : buildSubtitle(greenEntry.sura, greenEntry.aya, greenEntry.updatedAt)
    : "\u0627\u0644\u0622\u064a\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629";

  const onCopy = async () => {
    if (!ayahText) return;
    await Clipboard.setStringAsync(ayahText);
  };

  const onShare = async () => {
    if (!ayahText) return;
    await Share.share({ message: ayahText });
  };

  return (
    <>
      <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={styles.sheet}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeftGroup}>
                {view === "fawasil" ? (
                  <Pressable style={styles.backButton} onPress={() => setView("main")}>
                    <Ionicons name="chevron-forward" size={18} color="#6B7280" />
                  </Pressable>
                ) : null}
                <Pressable style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={18} color="#6B7280" />
                </Pressable>
              </View>
              <Text style={styles.headerTitle}>
                {view === "fawasil" ? "\u0627\u0644\u0641\u0648\u0627\u0635\u0644" : `${surahName}: ${arabicIndic(ayahNumber)}`}
              </Text>
              {view === "fawasil" ? (
                <Text style={styles.headerRightText}>
                  {`${surahName}: ${arabicIndic(ayahNumber)}`}
                </Text>
              ) : (
                <Pressable style={styles.editButton} onPress={() => {}}>
                  <Text style={styles.editText}>{"\u062a\u0639\u062f\u064a\u0644"}</Text>
                </Pressable>
              )}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
              {view === "main" ? (
                <>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{"\u0627\u0644\u0641\u0648\u0627\u0635\u0644"}</Text>
                    <Pressable
                      style={styles.rowCard}
                      onPress={() => onSelectBookmark?.(GREEN_BOOKMARK ?? null)}
                    >
                      <View style={styles.rowRight}>
                        <Ionicons name="bookmark" size={20} color={GREEN_BOOKMARK ?? "#7BBF94"} />
                        <View style={styles.rowTextWrap}>
                          <Text style={styles.rowTitle}>{"\u0627\u0644\u0623\u062e\u0636\u0631"}</Text>
                          <Text style={styles.rowSubtitle}>{greenSubtitle}</Text>
                        </View>
                      </View>
                    </Pressable>
                    <Pressable style={styles.rowCard} onPress={() => setView("fawasil")}> 
                      <View style={styles.rowRight}>
                        <Ionicons name="list" size={20} color="#6B7280" />
                        <Text style={styles.rowTitle}>{"\u0627\u0644\u0643\u0644"}</Text>
                      </View>
                      <Ionicons name="chevron-back" size={18} color="#9CA3AF" />
                    </Pressable>
                    <View style={styles.colorRow}>
                      {BOOKMARK_COLORS.map((color) => (
                        <Pressable
                          key={color}
                          style={[
                            styles.colorDot,
                            { backgroundColor: color },
                            bookmarkColor === color ? styles.colorSelected : null,
                          ]}
                          onPress={() => onSelectBookmark?.(color)}
                        />
                      ))}
                      <Pressable
                        style={[styles.colorDot, styles.noneDot]}
                        onPress={() => onSelectBookmark?.(null)}
                      >
                        <Ionicons name="ban" size={16} color="#6B7280" />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{"\u0627\u0644\u062a\u0644\u0627\u0648\u0629"}</Text>
                    <Pressable style={styles.rowCard} onPress={() => {}}>
                      <View style={styles.rowRight}>
                        <Ionicons name="play" size={20} color="#2F6E52" />
                        <Text style={styles.rowTitle}>{"\u062a\u0634\u063a\u064a\u0644"}</Text>
                      </View>
                    </Pressable>
                    <Pressable style={styles.rowCard} onPress={() => {}}>
                      <View style={styles.rowRight}>
                        <Ionicons name="play" size={20} color="#2F6E52" />
                        <Text style={styles.rowTitle}>{"\u062a\u0634\u063a\u064a\u0644 \u0625\u0644\u0649"}</Text>
                      </View>
                      <Ionicons name="chevron-back" size={18} color="#9CA3AF" />
                    </Pressable>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{"\u0627\u0644\u062a\u0641\u0633\u064a\u0631"}</Text>
                    <Pressable style={styles.rowCard} onPress={() => {}}>
                      <View style={styles.rowRight}>
                        <Ionicons name="book" size={20} color="#6B7280" />
                        <Text style={styles.rowTitle}>{"\u0627\u062e\u062a\u064a\u0627\u0631 \u0643\u062a\u0627\u0628..."}</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      style={styles.rowCard}
                      onPress={() => {
                        if (tafsirList.length > 0) setShowTafsir(true);
                      }}
                    >
                      <View style={styles.rowRight}>
                        <Ionicons name="library" size={20} color="#6B7280" />
                        <Text style={styles.rowTitle}>{"\u0627\u0644\u0645\u0643\u062a\u0628\u0629"}</Text>
                      </View>
                      <Ionicons name="chevron-back" size={18} color="#9CA3AF" />
                    </Pressable>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{"\u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629"}</Text>
                    <View style={styles.shareButtonsRow}>
                      <Pressable style={styles.shareSquare} onPress={onCopy}>
                        <Ionicons name="copy" size={20} color="#2F6E52" />
                        <Text style={styles.shareSquareText}>{"\u0646\u0633\u062e"}</Text>
                      </Pressable>
                      <Pressable style={styles.shareSquare} onPress={onShare}>
                        <Ionicons name="share-social" size={20} color="#2F6E52" />
                        <Text style={styles.shareSquareText}>{"\u0645\u0634\u0627\u0631\u0643\u0629"}</Text>
                      </Pressable>
                    </View>
                    <Pressable style={styles.rowCard} onPress={onShare}>
                      <View style={styles.rowRight}>
                        <Ionicons name="share-social" size={20} color="#2F6E52" />
                        <Text style={styles.rowTitle}>{"\u0645\u0634\u0627\u0631\u0643\u0629"}</Text>
                      </View>
                      <Ionicons name="chevron-back" size={18} color="#9CA3AF" />
                    </Pressable>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{"\u0627\u0644\u062a\u0645\u064a\u064a\u0632"}</Text>
                    <View style={styles.colorRow}>
                      {HIGHLIGHT_COLORS.map((color) => (
                        <Pressable
                          key={color}
                          style={[
                            styles.colorDot,
                            { backgroundColor: color },
                            highlightColor === color ? styles.colorSelected : null,
                          ]}
                          onPress={() => onSelectHighlight?.(color)}
                        />
                      ))}
                      <Pressable
                        style={[styles.colorDot, styles.noneDot]}
                        onPress={() => onSelectHighlight?.(null)}
                      >
                        <Ionicons name="ban" size={16} color="#6B7280" />
                      </Pressable>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.section}>
                  <View style={styles.fawasilCard}>
                    {BOOKMARK_COLORS.map((color, idx) => {
                      const entry = fawasilLatest[color];
                      const title = BOOKMARK_COLOR_NAMES[color] ?? "";
                      const subtitle = entry
                        ? buildSubtitle(entry.sura, entry.aya, entry.updatedAt)
                        : "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f";
                      return (
                        <Pressable
                          key={color}
                          style={[
                            styles.fawasilRow,
                            idx < BOOKMARK_COLORS.length - 1 ? styles.fawasilRowDivider : null,
                            !entry && styles.rowDisabled,
                          ]}
                          onPress={() => {
                            if (!entry) return;
                            onJumpToAyah?.(entry.sura, entry.aya);
                            onClose();
                          }}
                        >
                          <View style={styles.rowRight}>
                            <Ionicons name="bookmark" size={20} color={color} />
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
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showTafsir} animationType="slide" onRequestClose={() => setShowTafsir(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowTafsir(false)} />
          <View style={styles.tafsirSheet}>
            <View style={styles.headerRow}>
              <Text style={styles.headerLeft}>\u0627\u0644\u062a\u0641\u0633\u064a\u0631</Text>
              <Pressable onPress={() => setShowTafsir(false)}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.tafsirContent}>
              {tafsirList.map((entry, idx) => (
                <View key={`${entry.type ?? "tafsir"}-${idx}`} style={styles.tafsirBlock}>
                  <Text style={styles.tafsirType}>{entry.type ?? ""}</Text>
                  <Text style={styles.tafsirBody}>{entry.text ?? ""}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: "#F5F1E8",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "78%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    backgroundColor: "#E7E2D8",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7E2D8",
  },
  headerTitle: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#1F2937",
    textAlign: "center",
    flex: 1,
  },
  headerRightText: {
    minWidth: 44,
    fontFamily: "CairoBold",
    fontSize: 12,
    color: "#2F6E52",
    textAlign: "right",
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
  content: {
    paddingBottom: 12,
    gap: 18,
  },
  sectionTitle: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#374151",
    marginBottom: 10,
    textAlign: "right",
  },
  section: {
    gap: 10,
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
    color: "#1F2937",
    textAlign: "right",
  },
  rowSubtitle: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
    marginTop: 2,
  },
  rowDisabled: {
    opacity: 0.5,
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
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSelected: {
    borderColor: "#2F6E52",
  },
  noneDot: {
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
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
    color: "#1F2937",
  },

  tafsirSheet: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "78%",
  },
  closeText: {
    fontFamily: "CairoBold",
    fontSize: 20,
    color: "#6B7280",
  },
  tafsirContent: {
    paddingBottom: 12,
  },
  tafsirBlock: {
    marginBottom: 16,
  },
  tafsirType: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 6,
    textAlign: "right",
  },
  tafsirBody: {
    fontFamily: "Cairo",
    fontSize: 13,
    color: "#4B5563",
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 20,
  },
});
