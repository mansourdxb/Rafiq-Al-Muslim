import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SalatukPrayerTimesScreen from "@/screens/qibla/salatuk/SalatukPrayerTimesScreen";
import KaabaDirection from "@/screens/qibla/KaabaDirection";
import SalatukCitiesScreen from "@/screens/qibla/salatuk/SalatukCitiesScreen";
import PrayerSettingsScreen from "@/screens/qibla/PrayerSettingsScreen";

export type PrayerStackParamList = {
  PrayerTimes: undefined;
  QiblaDirection: undefined;
  WorldCities: undefined;
  PrayerSettings: undefined;
};

const Stack = createNativeStackNavigator<PrayerStackParamList>();

export default function PrayerStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="PrayerTimes">
      <Stack.Screen name="PrayerTimes" component={SalatukPrayerTimesScreen} />
      <Stack.Screen name="QiblaDirection" component={KaabaDirection} />
      <Stack.Screen name="WorldCities" component={SalatukCitiesScreen} />
      <Stack.Screen name="PrayerSettings" component={PrayerSettingsScreen} />
    </Stack.Navigator>
  );
}
