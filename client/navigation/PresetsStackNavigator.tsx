import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PresetsScreen from "@/screens/PresetsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type PresetsStackParamList = {
  PresetsList: undefined;
};

const Stack = createNativeStackNavigator<PresetsStackParamList>();

export default function PresetsStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="PresetsList"
        component={PresetsScreen}
        options={{
          headerTitle: "Presets",
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
