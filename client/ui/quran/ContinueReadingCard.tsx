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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  ornamentWrap: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E8E5DD",
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
    fontSize: 15,
    color: "#1A1A1A",
  },
  sub: {
    marginTop: 2,
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#7A7A7A",
  },
  subSecondary: {
    marginTop: 1,
    fontFamily: "Cairo",
    fontSize: 12,
    color: "#7A7A7A",
  },
  progressTrack: {
    marginTop: 6,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E8E5DD",
    width: "100%",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#D4A574",
  },
});
