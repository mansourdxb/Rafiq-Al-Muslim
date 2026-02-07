import React, { useMemo, useState } from "react";
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
};

const BOOKMARK_COLORS = ["#D63C3C", "#E0B52C", "#3AA76D", "#2C7BE5"];
const HIGHLIGHT_COLORS = ["#9B6BFF", "#57B4FF", "#46C79B", "#F0C75E", "#F59D5F"];

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
}: Props) {
  const [showTafsir, setShowTafsir] = useState(false);
  const headerRight = useMemo(() => `الآية ${arabicIndic(ayahNumber)}`, [ayahNumber]);

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
              <Text style={styles.headerLeft}>{surahName}</Text>
              <Text style={styles.headerRight}>{headerRight}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
              <Text style={styles.sectionTitle}>الفواصل</Text>
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
                  <Text style={styles.noneText}>×</Text>
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>التمييز</Text>
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
                  <Text style={styles.noneText}>×</Text>
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>المشاركة</Text>
              <View style={styles.actionRow}>
                <Pressable style={styles.actionButton} onPress={onCopy}>
                  <Text style={styles.actionText}>نسخ</Text>
                </Pressable>
                <Pressable style={styles.actionButton} onPress={onShare}>
                  <Text style={styles.actionText}>مشاركة</Text>
                </Pressable>
              </View>

              {tafsirList.length > 0 ? (
                <Pressable style={styles.tafsirButton} onPress={() => setShowTafsir(true)}>
                  <Text style={styles.tafsirText}>عرض التفسير</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showTafsir} animationType="slide" onRequestClose={() => setShowTafsir(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowTafsir(false)} />
          <View style={styles.tafsirSheet}>
            <View style={styles.headerRow}>
              <Text style={styles.headerLeft}>التفسير</Text>
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
    backgroundColor: "#FFFFFF",
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
  headerLeft: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#1F2937",
    textAlign: "left",
  },
  headerRight: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#1F2937",
    textAlign: "right",
  },
  content: {
    paddingBottom: 12,
  },
  sectionTitle: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    textAlign: "right",
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 16,
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
    borderColor: "#111827",
  },
  noneDot: {
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  noneText: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#6B7280",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  actionText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#1F2937",
  },
  tafsirButton: {
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
  },
  tafsirText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#4338CA",
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
