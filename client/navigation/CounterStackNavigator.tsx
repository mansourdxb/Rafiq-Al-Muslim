import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import CounterScreen from "@/screens/CounterScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";

export type CounterStackParamList = {
  Counter: undefined;
};

const Stack = createNativeStackNavigator<CounterStackParamList>();

export default function CounterStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();
  const { undo, currentPreset } = useApp();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Counter"
        component={CounterScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Tasbih" />,
          headerRight: () => (
            <Pressable
              onPress={undo}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              disabled={!currentPreset || currentPreset.count === 0}
            >
              <Feather
                name="rotate-ccw"
                size={20}
                color={
                  !currentPreset || currentPreset.count === 0
                    ? theme.textSecondary
                    : theme.text
                }
              />
            </Pressable>
          ),
        }}
      />
    </Stack.Navigator>
  );
}
