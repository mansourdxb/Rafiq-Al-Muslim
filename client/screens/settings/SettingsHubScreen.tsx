import React from "react";
import {
  View, Text, StyleSheet, ScrollView, useWindowDimensions, Linking, Share, Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "@/context/ThemeContext";
import { NavRow, ActionRow, SettingsSection } from "./SettingsUI";

export default function SettingsHubScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const handleShareApp = async () => {
    await Share.share({ message: "تطبيق رفيق المسلم - القرآن والحديث والأذكار\nhttps://rafiqapp.me" });
  };
  const handleRateApp = () => {
    const url = Platform.select({ ios: "https://apps.apple.com/app/idXXXXXXXXX", android: "https://play.google.com/store/apps/details?id=com.rafiqalmuslim" });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 8, backgroundColor: colors.headerBackground }]}>
        <Text style={[s.headerTitle, { color: colors.headerText }]}>المزيد</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 90, width: Math.min(width, 430), alignSelf: "center" }} showsVerticalScrollIndicator={false}>
        <View style={s.banner}>
          <View style={[s.bannerIcon, { backgroundColor: colors.greenLight }]}>
            <MaterialCommunityIcons name="mosque" size={32} color={colors.green} />
          </View>
          <Text style={[s.bannerTitle, { color: colors.text }]}>رفيق المسلم</Text>
          <Text style={[s.bannerSub, { color: colors.textSecondary }]}>القرآن • الحديث • الأذكار • الصلاة</Text>
        </View>
        <SettingsSection title="المظهر والعرض">
          <NavRow icon="color-palette-outline" label="المظهر" subtitle="الوضع الفاتح والداكن" onPress={() => navigation.navigate("AppearanceSettings")} />
          <NavRow icon="settings-outline" label="إعدادات عامة" subtitle="الشاشة والاهتزاز والتخزين" onPress={() => navigation.navigate("GeneralSettings")} />
        </SettingsSection>
        <SettingsSection title="القرآن الكريم">
          <NavRow icon="mic-outline" label="القارئ" subtitle="اختيار القارئ المفضل" onPress={() => navigation.navigate("QuranReciterSettings")} />
          <NavRow icon="text-outline" label="خط المصحف" subtitle="حجم ونوع الخط" onPress={() => navigation.navigate("QuranFontSettings")} />
        </SettingsSection>
        <SettingsSection title="الحديث الشريف">
          <NavRow icon="cloud-download-outline" label="إدارة الكتب" subtitle="تحميل وحذف كتب الحديث" onPress={() => navigation.navigate("HadithDownloadsSettings")} />
        </SettingsSection>
        <SettingsSection title="الأذكار والتسبيح">
          <NavRow icon="notifications-outline" label="التنبيهات" subtitle="أذكار الصباح والمساء" onPress={() => navigation.navigate("AthkarNotifSettings")} />
        </SettingsSection>
        <SettingsSection title="عام">
          <ActionRow icon="share-social-outline" label="شارك التطبيق" subtitle="انشر الخير مع أصدقائك" onPress={handleShareApp} />
          <ActionRow icon="star-outline" label="قيّم التطبيق" subtitle="ادعمنا بتقييمك" onPress={handleRateApp} />
          <NavRow icon="information-circle-outline" label="عن التطبيق" subtitle="الإصدار والمعلومات" onPress={() => navigation.navigate("AboutSettings")} />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 18, paddingHorizontal: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26, alignItems: "center" },
  headerTitle: { fontFamily: "CairoBold", fontSize: 22 },
  banner: { alignItems: "center", paddingVertical: 24, gap: 6 },
  bannerIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  bannerTitle: { fontFamily: "CairoBold", fontSize: 24 },
  bannerSub: { fontFamily: "Cairo", fontSize: 13 },
});
