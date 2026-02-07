import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ScrollView,
} from "react-native";

type SurahItem = { number: number; name: string };
type JuzItem = { index: number; sura: number; aya: number };
type BookmarkItem = {
  key: string;
  sura: number;
  ayah: number;
  surahName: string;
  pageNo: number;
  label?: string;
  color?: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  surahs: SurahItem[];
  juzList: JuzItem[];
  bookmarks: BookmarkItem[];
  onSelectSurah: (sura: number) => void;
  onSelectJuz: (sura: number, aya: number) => void;
  onSelectBookmark: (sura: number, aya: number) => void;
};

const TABS = [
  { key: "surah", label: "السور" },
  { key: "juz", label: "الأجزاء" },
  { key: "marks", label: "العلامات" },
] as const;

function arabicIndic(value: number) {
  const map = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
  return String(value)
    .split("")
    .map((c) => map[Number(c)] ?? c)
    .join("");
}

export default function QuranIndexSheet({
  visible,
  onClose,
  surahs,
  juzList,
  bookmarks,
  onSelectSurah,
  onSelectJuz,
  onSelectBookmark,
}: Props) {
  const [active, setActive] = useState<(typeof TABS)[number]["key"]>("surah");
  const listEmpty = useMemo(() => bookmarks.length === 0, [bookmarks.length]);

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.tabsRow}>
            {TABS.map((tab) => {
              const isActive = tab.key === active;
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tabButton, isActive ? styles.tabActive : null]}
                  onPress={() => setActive(tab.key)}
                >
                  <Text style={[styles.tabText, isActive ? styles.tabTextActive : null]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {active === "surah" ? (
            <FlatList
              data={surahs}
              keyExtractor={(item) => String(item.number)}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.row}
                  onPress={() => {
                    onSelectSurah(item.number);
                    onClose();
                  }}
                >
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowMeta}>{arabicIndic(item.number)}</Text>
                </Pressable>
              )}
            />
          ) : null}

          {active === "juz" ? (
            <FlatList
              data={juzList}
              keyExtractor={(item) => String(item.index)}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.row}
                  onPress={() => {
                    onSelectJuz(item.sura, item.aya);
                    onClose();
                  }}
                >
                  <Text style={styles.rowTitle}>{`الجزء ${arabicIndic(item.index)}`}</Text>
                  <Text style={styles.rowMeta}>{`سورة ${arabicIndic(item.sura)}`}</Text>
                </Pressable>
              )}
            />
          ) : null}

          {active === "marks" ? (
            <ScrollView contentContainerStyle={styles.list}>
              {listEmpty ? (
                <Text style={styles.emptyText}>لا توجد علامات محفوظة بعد</Text>
              ) : (
                bookmarks.map((item) => (
                  <Pressable
                    key={item.key}
                    style={styles.row}
                    onPress={() => {
                      onSelectBookmark(item.sura, item.ayah);
                      onClose();
                    }}
                  >
                    <View style={styles.bookmarkText}>
                      <Text style={styles.rowTitle}>{item.surahName}</Text>
                      {item.label ? <Text style={styles.rowSub}>{item.label}</Text> : null}
                    </View>
                    <View style={styles.bookmarkMeta}>
                      {item.color ? <Text style={[styles.dot, { color: item.color }]}>●</Text> : null}
                      <Text style={styles.rowMeta}>{`آية ${arabicIndic(item.ayah)}`}</Text>
                      <Text style={styles.rowMeta}>{`صفحة ${item.pageNo}`}</Text>
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
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
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "82%",
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#E8E1D5",
  },
  tabText: {
    fontFamily: "CairoBold",
    fontSize: 14,
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#6E5A46",
  },
  list: {
    paddingBottom: 12,
    gap: 8,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowTitle: {
    fontFamily: "CairoBold",
    fontSize: 16,
    color: "#1F2937",
    textAlign: "right",
  },
  rowSub: {
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
    marginTop: 4,
  },
  rowMeta: {
    fontFamily: "CairoBold",
    fontSize: 12,
    color: "#6B7280",
    textAlign: "left",
  },
  emptyText: {
    fontFamily: "Cairo",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 20,
  },
  bookmarkText: {
    flex: 1,
    alignItems: "flex-end",
  },
  bookmarkMeta: {
    alignItems: "flex-start",
    gap: 2,
  },
  dot: {
    fontSize: 12,
  },
});
