import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import QuranSurahListScreen from "@/screens/quran/QuranSurahListScreen";

export type QuranTabParamList = {
  QuranHome: undefined;
};

const Stack = createNativeStackNavigator<QuranTabParamList>();

export default function QuranTabNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="QuranHome" component={QuranSurahListScreen} />
    </Stack.Navigator>
  );
}
