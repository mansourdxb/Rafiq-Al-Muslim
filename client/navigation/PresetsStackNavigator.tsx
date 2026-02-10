import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PresetsScreen from "@/screens/PresetsScreen";
import CounterScreen from "@/screens/CounterScreen";
import AddZikrScreen from "@/screens/AddZikrScreen";
import MainZikrScreen from "@/screens/azkar/MainZikrScreen";
import CalendarScreen from "@/screens/CalendarScreen";
import StatsScreen from "@/screens/StatsScreen";
import HisnAlMuslimScreen from "@/screens/athkar/HisnAlMuslimScreen";
import HisnCategoryScreen from "@/screens/athkar/HisnCategoryScreen";
import AiChatTestScreen from "@/src/screens/ai/AiChatTestScreen";
import AiModelSetupScreen from "@/src/screens/ai/AiModelSetupScreen";

export type PresetsStackParamList = {
  MainZikr: undefined;
  Presets: undefined;
  Counter: undefined;
  AddZikr: undefined;
  Calendar: undefined;
  Stats: undefined;
  HisnAlMuslim: undefined;
  HisnCategory: { categoryId?: number; categoryTitle?: string };
  AiChatTest: undefined;
  AiModelSetup: undefined;
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
      <Stack.Screen name="AiChatTest" component={AiChatTestScreen} />
      <Stack.Screen name="AiModelSetup" component={AiModelSetupScreen} />
    </Stack.Navigator>
  );
}
