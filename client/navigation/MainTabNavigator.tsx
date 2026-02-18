import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import PrayerStackNavigator from "@/navigation/PrayerStackNavigator";
import PresetsStackNavigator from "@/navigation/PresetsStackNavigator";
import QuranTabNavigator from "@/navigation/QuranTabNavigator";
import HadithStackNavigator from "@/navigation/HadithStackNavigator";
import MainZikrScreen from "@/screens/azkar/MainZikrScreen";
import StitchTabBar from "@/components/navigation/StitchTabBar";

export type MainTabParamList = {
  PrayerTab: undefined;
  QuranTab: undefined;
  HadithTab: undefined;
  AthkarTab: undefined;
  MoreTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="PrayerTab"
      backBehavior="none"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <StitchTabBar {...props} />}
    >
      <Tab.Screen name="PrayerTab" component={PrayerStackNavigator} />
      <Tab.Screen name="QuranTab" component={QuranTabNavigator} />
      <Tab.Screen name="HadithTab" component={HadithStackNavigator} />
      <Tab.Screen name="AthkarTab" component={PresetsStackNavigator} />
      <Tab.Screen name="MoreTab" component={MainZikrScreen} />
    </Tab.Navigator>
  );
}

