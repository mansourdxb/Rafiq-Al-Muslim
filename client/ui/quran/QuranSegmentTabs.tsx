import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { quranTheme } from "./theme";

type TabKey = "surah" | "juz" | "quarters";
type Tab = { key: TabKey; label: string };

const TABS: Tab[] = [
  { key: "surah", label: "\u0627\u0644\u0633\u0648\u0631" },
  { key: "juz", label: "\u0627\u0644\u0623\u062c\u0632\u0627\u0621" },
];

type Props = {
  value: TabKey;
  onChange: (key: TabKey) => void;
};

export default function QuranSegmentTabs({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {TABS.map((tab) => {
        const active = value === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, active ? styles.tabActive : null]}
            onPress={() => onChange(tab.key)}
          >
            <Text style={[styles.text, active ? styles.textActive : null]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row-reverse",
    backgroundColor: "#E8E5DD",
    borderRadius: quranTheme.radius.pill,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: quranTheme.radius.pill,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
  },
  text: {
    fontFamily: "Cairo",
    fontSize: 14,
    color: "#7A7A7A",
  },
  textActive: {
    fontFamily: "CairoBold",
    color: "#1A1A1A",
  },
});
