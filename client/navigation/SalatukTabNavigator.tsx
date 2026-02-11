import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import KaabaDirection from "@/screens/qibla/KaabaDirection";
import PrayerSettingsScreen from "@/screens/qibla/PrayerSettingsScreen";
import SalatukCitiesScreen from "@/screens/qibla/salatuk/SalatukCitiesScreen";
import SalatukPrayerTimesScreen from "@/screens/qibla/salatuk/SalatukPrayerTimesScreen";

export type SalatukTabParamList = {
  SalatukHome: undefined;
  SalatukCities: undefined;
  SalatukSettings: undefined;
  SalatukPrayerTimes: undefined;
  PrayerTimes: undefined;
};

const Stack = createNativeStackNavigator<SalatukTabParamList>();

export default function SalatukTabNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="PrayerTimes">
      <Stack.Screen name="PrayerTimes" component={SalatukPrayerTimesScreen} />
      <Stack.Screen name="SalatukPrayerTimes" component={SalatukPrayerTimesScreen} />
      <Stack.Screen name="SalatukHome" component={KaabaDirection} />
      <Stack.Screen name="SalatukCities" component={SalatukCitiesScreen} />
      <Stack.Screen name="SalatukSettings" component={PrayerSettingsScreen} />
    </Stack.Navigator>
  );
}
