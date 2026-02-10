import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { quranTheme } from "./theme";

type Props = {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
  onPress?: () => void;
  autoFocus?: boolean;
};

export default function QuranSearchBar({
  value,
  onChangeText,
  placeholder = "بحث في القرآن الكريم",
  editable = true,
  onPress,
  autoFocus,
}: Props) {
  const content = (
    <View style={styles.wrap}>
      <Feather name="search" size={20} color="#DDE9E1" style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#CFE0D6"
        style={styles.input}
        textAlign="right"
        writingDirection="rtl"
        editable={editable}
        pointerEvents={editable ? "auto" : "none"}
        autoFocus={autoFocus}
      />
    </View>
  );

  if (onPress && !editable) {
    return (
      <Pressable onPress={onPress} style={styles.pressWrap}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  pressWrap: {
    width: "100%",
  },
  wrap: {
    backgroundColor: quranTheme.colors.searchBg,
    borderRadius: quranTheme.radius.pill,
    paddingHorizontal: quranTheme.spacing.md,
    paddingVertical: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  icon: {
    marginStart: 10,
  },
  input: {
    flex: 1,
    color: quranTheme.colors.textOnDark,
    fontFamily: "Cairo",
    fontSize: 14,
  },
});
