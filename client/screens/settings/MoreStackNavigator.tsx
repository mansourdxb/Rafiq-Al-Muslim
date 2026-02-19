import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SettingsHubScreen from "@/screens/settings/SettingsHubScreen";
import AppearanceSettingsScreen from "@/screens/settings/AppearanceSettingsScreen";
import GeneralSettingsScreen from "@/screens/settings/GeneralSettingsScreen";
import QuranReciterSettingsScreen from "@/screens/settings/QuranReciterSettingsScreen";
import QuranFontSettingsScreen from "@/screens/settings/QuranFontSettingsScreen";
import AthkarNotifSettingsScreen from "@/screens/settings/AthkarNotifSettingsScreen";
import HadithDownloadsSettingsScreen from "@/screens/settings/HadithDownloadsSettingsScreen";
import AboutSettingsScreen from "@/screens/settings/AboutSettingsScreen";

export type MoreStackParamList = {
  SettingsHub: undefined;
  AppearanceSettings: undefined;
  GeneralSettings: undefined;
  QuranReciterSettings: undefined;
  QuranFontSettings: undefined;
  AthkarNotifSettings: undefined;
  HadithDownloadsSettings: undefined;
  AboutSettings: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

export default function MoreStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHub" component={SettingsHubScreen} />
      <Stack.Screen name="AppearanceSettings" component={AppearanceSettingsScreen} />
      <Stack.Screen name="GeneralSettings" component={GeneralSettingsScreen} />
      <Stack.Screen name="QuranReciterSettings" component={QuranReciterSettingsScreen} />
      <Stack.Screen name="QuranFontSettings" component={QuranFontSettingsScreen} />
      <Stack.Screen name="AthkarNotifSettings" component={AthkarNotifSettingsScreen} />
      <Stack.Screen name="HadithDownloadsSettings" component={HadithDownloadsSettingsScreen} />
      <Stack.Screen name="AboutSettings" component={AboutSettingsScreen} />
    </Stack.Navigator>
  );
}
