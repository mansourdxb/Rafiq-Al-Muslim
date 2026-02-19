import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "@/context/ThemeContext";
import { SettingsScreen, SettingsSection, SelectRow } from "./SettingsUI";

export default function AppearanceSettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { themeMode, setThemeMode } = useTheme();

  return (
    <SettingsScreen title="المظهر" onBack={() => navigation.goBack()} insetTop={insets.top} bottomPadding={insets.bottom}>
      <SettingsSection title="وضع العرض">
        <SelectRow label="تلقائي (حسب النظام)" selected={themeMode === "auto"} onPress={() => setThemeMode("auto")} />
        <SelectRow label="الوضع الفاتح" selected={themeMode === "light"} onPress={() => setThemeMode("light")} />
        <SelectRow label="الوضع الداكن" selected={themeMode === "dark"} onPress={() => setThemeMode("dark")} />
      </SettingsSection>
    </SettingsScreen>
  );
}
