import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { quranTheme } from "./theme";

const SURAH_EMBLEM_IMAGE = require("../../../assets/images/quran icon2.png");

type Props = {
  number: number;
  name: string;
  typeLabel: "مكية" | "مدنية";
  onPress?: () => void;
};

export default function SurahRow({ number, name, typeLabel, onPress }: Props) {
  const content = (
    <View style={styles.row}>
      {/* RIGHT column: number + emblem inline */}
      <View style={styles.rightCol}>
        <View style={styles.rightTopRow}>
          <Text style={styles.surahNumber}>{`${number}.`}</Text>
          <Image source={SURAH_EMBLEM_IMAGE} style={styles.surahEmblem} />
        </View>
      </View>

      {/* MIDDLE column: surah name + optional sub label */}
      <View style={styles.centerCol}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {typeLabel}
        </Text>
      </View>

      {/* LEFT column: label + moon */}
      <View style={styles.leftCol}>
        <Text style={styles.typeText}>{typeLabel}</Text>
        <Feather name="moon" size={14} color={quranTheme.colors.goldSoft} style={styles.moon} />
      </View>
    </View>
  );
  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: quranTheme.colors.row,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  rightCol: {
    width: 96,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  rightTopRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  surahNumber: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: "#E8F1EA",
  },
  surahEmblem: {
    width: 34,
    height: 34,
    resizeMode: "contain",
    opacity: 0.9,
  },
  centerCol: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingEnd: 10,
  },
  name: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: quranTheme.colors.textOnDark,
    textAlign: "right",
  },
  sub: {
    marginTop: 4,
    fontFamily: "Cairo",
    fontSize: 13,
    color: quranTheme.colors.textOnDark,
    opacity: 0.8,
    textAlign: "right",
  },
  leftCol: {
    minWidth: 70,
    alignItems: "flex-start",
    justifyContent: "center",
    flexDirection: "row",
  },
  typeText: {
    fontFamily: "Cairo",
    fontSize: 14,
    color: quranTheme.colors.textOnDark,
    opacity: 0.85,
  },
  moon: {
    marginStart: 6,
  },
});
