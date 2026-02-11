import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CounterScreen from "@/screens/azkar/CounterScreen";

const Stack = createNativeStackNavigator();

export default function CounterStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CounterScreen" component={CounterScreen} />
    </Stack.Navigator>
  );
}

