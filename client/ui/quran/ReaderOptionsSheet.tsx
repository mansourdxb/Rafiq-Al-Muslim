import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { quranTheme } from "./theme";

type Props = {
  visible: boolean;
  ayahNumber: number;
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

export default function ReaderOptionsSheet({
  visible,
  ayahNumber,
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

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : 400,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [translateY, visible]);

  const headerTitle = useMemo(() => `الآية ${ayahNumber}`, [ayahNumber]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={18} color="#7A7A7A" />
          </Pressable>
          <Text style={styles.title}>{headerTitle}</Text>
          <View style={{ width: 18 }} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>الفواصل</Text>
            <Pressable onPress={() => onSelectBookmark?.(null)}>
              <Feather name="x" size={16} color="#C2C2C2" />
            </Pressable>
          </View>
          <View style={styles.colorRow}>
            {BOOKMARK_COLORS.map((c) => {
              const active = bookmarkColor === c;
              return (
                <Pressable key={c} onPress={() => onSelectBookmark?.(c)} style={styles.colorPress}>
                  <View style={[styles.colorDot, { backgroundColor: c }, active && styles.colorActive]} />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>التمييز</Text>
            <Pressable onPress={() => onSelectHighlight?.(null)}>
              <Feather name="x" size={16} color="#C2C2C2" />
            </Pressable>
          </View>
          <View style={styles.colorRow}>
            {HIGHLIGHT_COLORS.map((c) => {
              const active = highlightColor === c;
              return (
                <Pressable key={c} onPress={() => onSelectHighlight?.(c)} style={styles.colorPress}>
                  <View style={[styles.colorDot, { backgroundColor: c }, active && styles.colorActive]} />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المشاركة</Text>
          <View style={styles.shareRow}>
            <Pressable style={styles.shareBtn} onPress={onShare}>
              <Text style={styles.shareText}>مشاركة</Text>
            </Pressable>
            <Pressable style={styles.shareBtn} onPress={onCopy}>
              <Text style={styles.shareText}>نسخ</Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.tafsirBtn} onPress={onOpenTafsir}>
          <Text style={styles.tafsirText}>عرض التفسير</Text>
        </Pressable>
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
    gap: 14,
  },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: quranTheme.colors.text,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: quranTheme.colors.text,
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
    borderColor: quranTheme.colors.bgDark,
  },
  shareRow: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: "#EFE7D9",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  shareText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: quranTheme.colors.text,
  },
  tafsirBtn: {
    backgroundColor: quranTheme.colors.bgLight,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  tafsirText: {
    fontFamily: "CairoBold",
    fontSize: 15,
    color: quranTheme.colors.textOnDark,
  },
});
