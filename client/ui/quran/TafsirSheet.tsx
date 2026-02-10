import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { quranTheme } from "./theme";

type TafsirEntry = { type?: string; text?: string };
type TabKey = "مختصر" | "الجلالين" | "السعدي";

type Props = {
  visible: boolean;
  onClose: () => void;
  tafsirList: TafsirEntry[];
};

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "مختصر", label: "المختصر" },
  { key: "الجلالين", label: "الجلالين" },
  { key: "السعدي", label: "السعدي" },
];

export default function TafsirSheet({ visible, onClose, tafsirList }: Props) {
  const translateY = useRef(new Animated.Value(500)).current;
  const [active, setActive] = useState<TabKey>("مختصر");

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : 500,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [translateY, visible]);

  const tafsirText = useMemo(() => {
    const key =
      active === "مختصر" ? "مختصر" : active === "الجلالين" ? "الجلالين" : "السعدي";
    const hit =
      tafsirList.find((t) => t.type?.includes(key)) ??
      tafsirList.find((t) => t.type?.toLowerCase().includes("jalal")) ??
      tafsirList.find((t) => t.type?.toLowerCase().includes("saadi")) ??
      tafsirList[0];
    return hit?.text ?? "لا يوجد تفسير متوفر حالياً.";
  }, [active, tafsirList]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={18} color="#7A7A7A" />
          </Pressable>
          <Text style={styles.title}>التفسير</Text>
          <View style={{ width: 18 }} />
        </View>

        <View style={styles.tabs}>
          {TABS.map((t) => {
            const activeTab = t.key === active;
            return (
              <Pressable
                key={t.key}
                style={[styles.tab, activeTab ? styles.tabActive : null]}
                onPress={() => setActive(t.key)}
              >
                <Text style={[styles.tabText, activeTab ? styles.tabTextActive : null]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.body}>{tafsirText}</Text>
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
    gap: 12,
    maxHeight: "70%",
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
  tabs: {
    flexDirection: "row-reverse",
    gap: 8,
  },
  tab: {
    backgroundColor: "#EFE7D9",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tabActive: {
    backgroundColor: quranTheme.colors.bgLight,
  },
  tabText: {
    fontFamily: "Cairo",
    fontSize: 13,
    color: "#555",
  },
  tabTextActive: {
    fontFamily: "CairoBold",
    color: quranTheme.colors.textOnDark,
  },
  content: {
    paddingBottom: 14,
  },
  body: {
    fontFamily: "Cairo",
    fontSize: 15,
    lineHeight: 26,
    color: quranTheme.colors.text,
    textAlign: "right",
  },
});
