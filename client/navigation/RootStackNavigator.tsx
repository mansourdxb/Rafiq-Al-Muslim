import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform } from "react-native";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import SalatukTabNavigator from "@/navigation/SalatukTabNavigator";
import AddPresetScreen from "@/screens/AddPresetScreen";
import AboutScreen from "@/screens/AboutScreen";
import QuranReaderScreen from "@/screens/quran/QuranReaderScreen";
import QuranSearchScreen from "@/screens/quran/QuranSearchScreen";
import SettingsPlaceholderScreen from "@/screens/settings/SettingsPlaceholderScreen";
import PrayerSettingsScreen from "@/screens/settings/PrayerSettingsScreen";
import SalatukAthanSettingsScreen from "@/screens/salatuk/SalatukAthanSettingsScreen";
import AthanSoundPickerScreen from "@/screens/salatuk/AthanSoundPickerScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  Salatuk: undefined;
  SalatukAthanSettings: undefined;
  AthanSoundPicker: { prayer: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha" };
  AddPreset: undefined;
  About: undefined;
  FontSettings: { title?: string };
  ThemeSettings: { title?: string };
  PrayerSettings: { title?: string };
  FortyHadith: { title?: string };
  TafsirSettings: { title?: string };
  FawaselSettings: { title?: string };
  KhatmaSettings: { title?: string };
  HighlightsSettings: { title?: string };
  QuranReader: {
    sura: number;
    aya?: number;
    page?: number;
    source?: "manual" | "resume" | "index" | "search" | "juz";
    navToken?: number;
    openIndex?: boolean;
  };
  QuranSearch: { initialQuery?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Salatuk" component={SalatukTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="SalatukAthanSettings"
        component={SalatukAthanSettingsScreen}
        options={{
          headerShown: false,
          presentation: Platform.OS === "ios" ? "fullScreenModal" : "modal",
        }}
      />
      <Stack.Screen
        name="AthanSoundPicker"
        component={AthanSoundPickerScreen}
        options={{
          headerShown: false,
          presentation: Platform.OS === "ios" ? "fullScreenModal" : "modal",
        }}
      />
      <Stack.Screen
        name="AddPreset"
        component={AddPresetScreen}
        options={{
          presentation: "modal",
          headerTitle: "New Preset",
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          headerTitle: "About",
        }}
      />
      <Stack.Screen
        name="FontSettings"
        component={SettingsPlaceholderScreen}
        options={{ headerShown: false }}
        initialParams={{ title: "\u0627\u0644\u062e\u0637\u0648\u0637" }}
      />
      <Stack.Screen
        name="ThemeSettings"
        component={SettingsPlaceholderScreen}
        options={{ headerShown: false }}
        initialParams={{ title: "\u0627\u0644\u062b\u064a\u0645" }}
      />
      <Stack.Screen
        name="PrayerSettings"
        component={PrayerSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FortyHadith"
        component={SettingsPlaceholderScreen}
        options={{ headerShown: false }}
        initialParams={{ title: "\u0627\u0644\u0623\u0631\u0628\u0639\u0648\u0646" }}
      />
      <Stack.Screen
        name="TafsirSettings"
        component={SettingsPlaceholderScreen}
        options={{ headerShown: false }}
        initialParams={{ title: "\u0627\u0644\u062a\u0641\u0633\u064a\u0631" }}
      />
      <Stack.Screen
        name="FawaselSettings"
        component={SettingsPlaceholderScreen}
        options={{ headerShown: false }}
        initialParams={{ title: "\u0627\u0644\u0641\u0648\u0627\u0635\u0644" }}
      />
      <Stack.Screen
        name="KhatmaSettings"
        component={SettingsPlaceholderScreen}
        options={{ headerShown: false }}
        initialParams={{ title: "\u0627\u0644\u062e\u062a\u0645\u0629" }}
      />
      <Stack.Screen
        name="HighlightsSettings"
        component={SettingsPlaceholderScreen}
        options={{ headerShown: false }}
        initialParams={{ title: "\u0627\u0644\u062a\u0645\u064a\u064a\u0632\u0627\u062a" }}
      />
      <Stack.Screen
        name="QuranReader"
        component={QuranReaderScreen}
        options={{
          headerShown: false,
          presentation: Platform.OS === "ios" ? "fullScreenModal" : "card",
        }}
      />
      <Stack.Screen
        name="QuranSearch"
        component={QuranSearchScreen}
        options={{
          headerShown: false,
          presentation: Platform.OS === "ios" ? "fullScreenModal" : "card",
        }}
      />
    </Stack.Navigator>
  );
}
