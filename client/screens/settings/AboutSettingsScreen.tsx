import React from "react";
import { View, Text, StyleSheet, Linking } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "@/context/ThemeContext";
import { SettingsScreen, SettingsSection, ActionRow } from "./SettingsUI";

export default function AboutSettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();

  return (
    <SettingsScreen title="عن التطبيق" onBack={() => navigation.goBack()} insetTop={insets.top} bottomPadding={insets.bottom}>
      <View style={s.banner}>
        <View style={[s.bannerIcon, { backgroundColor: colors.greenLight }]}>
          <MaterialCommunityIcons name="mosque" size={40} color={colors.green} />
        </View>
        <Text style={[s.appName, { color: colors.text }]}>رفيق المسلم</Text>
        <Text style={[s.version, { color: colors.green }]}>الإصدار 1.0.0</Text>
        <Text style={[s.desc, { color: colors.textSecondary }]}>تطبيق شامل يجمع القرآن الكريم والحديث النبوي والأذكار ومواقيت الصلاة في مكان واحد</Text>
      </View>
      <SettingsSection title="روابط">
        <ActionRow icon="globe-outline" label="الموقع الإلكتروني" onPress={() => Linking.openURL("https://rafiqapp.me")} />
        <ActionRow icon="logo-github" label="المصدر على GitHub" onPress={() => Linking.openURL("https://github.com/mansourdxb/Rafiq-Al-Muslim")} />
        <ActionRow icon="document-text-outline" label="سياسة الخصوصية" onPress={() => Linking.openURL("https://rafiqapp.me/privacy")} />
      </SettingsSection>
      <SettingsSection title="مصادر البيانات">
        <ActionRow icon="book-outline" label="بيانات الحديث" subtitle="sunnah.com" onPress={() => Linking.openURL("https://sunnah.com")} />
        <ActionRow icon="musical-notes-outline" label="تلاوات القرآن" subtitle="everyayah.com" onPress={() => Linking.openURL("https://everyayah.com")} />
        <ActionRow icon="moon-outline" label="مواقيت الصلاة" subtitle="Adhan.js" onPress={() => Linking.openURL("https://github.com/batoulapps/adhan-js")} />
      </SettingsSection>

    </SettingsScreen>
  );
}

const s = StyleSheet.create({
  banner: { alignItems: "center", paddingVertical: 30, paddingHorizontal: 30, gap: 6 },
  bannerIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  appName: { fontFamily: "CairoBold", fontSize: 26 },
  version: { fontFamily: "Cairo", fontSize: 14 },
  desc: { fontFamily: "Cairo", fontSize: 13, textAlign: "center", lineHeight: 22, marginTop: 4 },
  footer: { alignItems: "center", paddingVertical: 30 },
  footerText: { fontFamily: "Cairo", fontSize: 13 },
});
