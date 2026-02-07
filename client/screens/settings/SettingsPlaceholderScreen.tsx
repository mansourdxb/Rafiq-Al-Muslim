import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

export default function SettingsPlaceholderScreen({ route }: { route?: any }) {
  const insets = useSafeAreaInsets();
  const { isDarkMode, colors } = useTheme();

  const title = route?.params?.title ?? "\u0642\u0631\u064a\u0628\u0627\u064b";
  const background = colors.background;
  const primaryText = isDarkMode ? "#FFFFFF" : "#111418";
  const secondaryText = isDarkMode ? "rgba(255,255,255,0.65)" : "rgba(17,20,24,0.55)";

  return (
    <View style={[styles.root, { backgroundColor: background, paddingTop: insets.top + 32 }]}>
      <Text style={[styles.title, { color: primaryText }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: secondaryText }]}>{`\u0642\u0631\u064a\u0628\u0627\u064b`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
