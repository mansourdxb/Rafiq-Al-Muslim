import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SalatukPrayerTimesScreen from "@/screens/qibla/salatuk/SalatukPrayerTimesScreen";
import KaabaDirection from "@/screens/qibla/KaabaDirection";
import SalatukCitiesScreen from "@/screens/qibla/salatuk/SalatukCitiesScreen";
import PrayerSettingsScreen from "@/screens/qibla/PrayerSettingsScreen";
import NearbyMasjidsScreen from "@/screens/qibla/NearbyMasjidsScreen";

export type PrayerStackParamList = {
  PrayerTimes: undefined;
  QiblaDirection: undefined;
  WorldCities: undefined;
  PrayerSettings: undefined;
  NearbyMasjids: undefined;
};

const Stack = createNativeStackNavigator<PrayerStackParamList>();

export default function PrayerStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="PrayerTimes">
      <Stack.Screen name="PrayerTimes" component={SalatukPrayerTimesScreen} />
      <Stack.Screen name="QiblaDirection" component={KaabaDirection} />
      <Stack.Screen name="WorldCities" component={SalatukCitiesScreen} />
      <Stack.Screen name="PrayerSettings" component={PrayerSettingsScreen} />
      <Stack.Screen name="NearbyMasjids" component={NearbyMasjidsScreen} />
    </Stack.Navigator>
  );
}
