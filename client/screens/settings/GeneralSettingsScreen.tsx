import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useApp } from "@/context/AppContext";
import { clearAllBooks, getHadithCacheSize, formatBytes } from "@/utils/hadithBookCache";
import { SettingsScreen, SettingsSection, ToggleRow, ActionRow } from "./SettingsUI";

export default function GeneralSettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { settings, updateSettings } = useApp();
  const [cacheLabel, setCacheLabel] = useState("...");

  useEffect(() => {
    getHadithCacheSize().then((bytes) => setCacheLabel(bytes > 0 ? formatBytes(bytes) : "فارغ"));
  }, []);

  const handleClearHadithCache = () => {
    Alert.alert("مسح كتب الحديث", "سيتم حذف جميع كتب الحديث المحملة", [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: async () => { await clearAllBooks(); setCacheLabel("فارغ"); } },
    ]);
  };

  const handleClearAudioCache = () => {
    Alert.alert("مسح التلاوات", "سيتم حذف جميع التلاوات المحفوظة", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف", style: "destructive",
        onPress: async () => {
          try {
            const FileSystem = require("expo-file-system/legacy");
            const audioDir = `${FileSystem.cacheDirectory}quran-audio/`;
            const info = await FileSystem.getInfoAsync(audioDir);
            if (info.exists) await FileSystem.deleteAsync(audioDir, { idempotent: true });
            Alert.alert("", "تم حذف التلاوات");
          } catch { Alert.alert("خطأ", "حدث خطأ أثناء الحذف"); }
        },
      },
    ]);
  };

  const handleResetAll = () => {
    Alert.alert("إعادة تعيين", "سيتم حذف جميع البيانات. لا يمكن التراجع.", [
      { text: "إلغاء", style: "cancel" },
      { text: "إعادة تعيين", style: "destructive", onPress: async () => { await AsyncStorage.clear(); await clearAllBooks(); Alert.alert("", "أعد تشغيل التطبيق"); } },
    ]);
  };

  return (
    <SettingsScreen title="إعدادات عامة" onBack={() => navigation.goBack()} insetTop={insets.top} bottomPadding={insets.bottom}>
      <SettingsSection title="التفاعل">
        <ToggleRow icon="phone-portrait-outline" label="الاهتزاز" subtitle="اهتزاز عند الضغط في العداد" value={settings.hapticEnabled} onValueChange={(v) => updateSettings({ hapticEnabled: v })} />
        <ToggleRow icon="sunny-outline" label="إبقاء الشاشة مضاءة" subtitle="منع إطفاء الشاشة أثناء التسبيح" value={settings.keepScreenOn} onValueChange={(v) => updateSettings({ keepScreenOn: v })} />
      </SettingsSection>
      <SettingsSection title="التخزين">
        <ActionRow icon="book-outline" label="مسح كتب الحديث" subtitle={`الحجم: ${cacheLabel}`} color="#C0392B" onPress={handleClearHadithCache} />
        <ActionRow icon="musical-notes-outline" label="مسح التلاوات المحملة" color="#C0392B" onPress={handleClearAudioCache} />
      </SettingsSection>
      <SettingsSection title="خطير">
        <ActionRow icon="refresh-outline" label="إعادة تعيين التطبيق" subtitle="حذف جميع البيانات" color="#C0392B" onPress={handleResetAll} />
      </SettingsSection>
    </SettingsScreen>
  );
}
