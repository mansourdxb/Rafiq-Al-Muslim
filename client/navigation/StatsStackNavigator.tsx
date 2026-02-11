import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StatsScreen from "@/screens/azkar/StatsScreen";

export type StatsStackParamList = {
  Stats: undefined;
};

const Stack = createNativeStackNavigator<StatsStackParamList>();

export default function StatsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Stats" component={StatsScreen} />
    </Stack.Navigator>
  );
}
