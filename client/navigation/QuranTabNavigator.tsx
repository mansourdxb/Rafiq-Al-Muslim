import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import QuranReaderScreen from "@/screens/quran/QuranReaderScreen";
import QuranSurahListScreen from "@/screens/quran/QuranSurahListScreen";

export type QuranTabParamList = {
  QuranHome: undefined;
  QuranSurahList: undefined;
};

const Stack = createNativeStackNavigator<QuranTabParamList>();

export default function QuranTabNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="QuranHome" component={QuranReaderScreen} />
      <Stack.Screen name="QuranSurahList" component={QuranSurahListScreen} />
    </Stack.Navigator>
  );
}
