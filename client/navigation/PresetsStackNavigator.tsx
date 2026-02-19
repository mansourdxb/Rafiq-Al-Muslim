import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PresetsScreen from "@/screens/azkar/PresetsScreen";
import CounterScreen from "@/screens/azkar/CounterScreen";
import AddZikrScreen from "@/screens/azkar/AddZikrScreen";
import MainZikrScreen from "@/screens/azkar/MainZikrScreen";
import CalendarScreen from "@/screens/azkar/CalendarScreen";
import StatsScreen from "@/screens/azkar/StatsScreen";
import HisnAlMuslimScreen from "@/screens/azkar/HisnAlMuslimScreen";
import HisnCategoryScreen from "@/screens/azkar/HisnCategoryScreen";

export type PresetsStackParamList = {
  MainZikr: undefined;
  Presets: undefined;
  Counter: undefined;
  AddZikr: undefined;
  Calendar: undefined;
  Stats: undefined;
  HisnAlMuslim: undefined;
  HisnCategory: { categoryId?: number; categoryTitle?: string };
};

const Stack = createNativeStackNavigator<PresetsStackParamList>();

export default function PresetsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="MainZikr">
      <Stack.Screen name="MainZikr" component={MainZikrScreen} />
      <Stack.Screen name="Presets" component={PresetsScreen} />
      <Stack.Screen name="Counter" component={CounterScreen} />
      <Stack.Screen name="AddZikr" component={AddZikrScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="HisnAlMuslim" component={HisnAlMuslimScreen} />
      <Stack.Screen name="HisnCategory" component={HisnCategoryScreen} />
    </Stack.Navigator>
  );
}

