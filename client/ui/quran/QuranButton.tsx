import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { quranTheme } from "./theme";

type Props = {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
};

export default function QuranButton({ title, onPress, style }: Props) {
  return (
    <Pressable style={[styles.button, style]} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: quranTheme.colors.bgLight,
    borderRadius: quranTheme.radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: quranTheme.colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontFamily: "CairoBold",
    fontSize: 15,
    color: quranTheme.colors.textOnDark,
  },
});
