import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { quranTheme } from "./theme";
const ORNAMENT_IMAGE = require("../../../assets/images/quran icon.jpg");

type Props = {
  surahName: string;
  ayahText: string;
  progress?: number; // 0..1
};

export default function ContinueReadingCard({
  surahName,
  ayahText,
  progress = 0.6,
}: Props) {
  const safeProgress = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.card}>
      <View style={styles.ornamentWrap}>
        <Image source={ORNAMENT_IMAGE} style={styles.ornament} resizeMode="cover" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>استمرار القراءة</Text>
        <Text style={styles.sub}>{surahName}</Text>
        <Text style={styles.subSecondary}>{ayahText}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${safeProgress * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: quranTheme.colors.card,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    ...quranTheme.shadow.soft,
  },
  ornamentWrap: {
    width: 98,
    height: 98,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: quranTheme.colors.cardTint,
    alignItems: "center",
    justifyContent: "center",
  },
  ornament: {
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    alignItems: "flex-end",
  },
  title: {
    fontFamily: "CairoBold",
    fontSize: 18,
    color: quranTheme.colors.text,
  },
  sub: {
    marginTop: 4,
    fontFamily: "Cairo",
    fontSize: 14,
    color: quranTheme.colors.textMuted,
  },
  subSecondary: {
    marginTop: 2,
    fontFamily: "Cairo",
    fontSize: 14,
    color: quranTheme.colors.textMuted,
  },
  progressTrack: {
    marginTop: 10,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#CFDED2",
    width: "100%",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: quranTheme.colors.gold,
  },
});
