import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { useTheme } from "@react-navigation/native";
import type { NavigatorScreenParams } from "@react-navigation/native";

import RootStackNavigator, {
  type RootStackParamList,
} from "@/navigation/RootStackNavigator";
import AppDrawerContent from "@/components/navigation/AppDrawerContent";

export type AppDrawerParamList = {
  RootStack: NavigatorScreenParams<RootStackParamList>;
};

const Drawer = createDrawerNavigator<AppDrawerParamList>();

export default function AppDrawerNavigator() {
  const theme = useTheme?.();
  const background = theme?.colors?.background ?? "#F3F5F8";

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerPosition: "right",
        drawerType: "front",
        overlayColor: "rgba(0,0,0,0.35)",
        sceneStyle: { backgroundColor: background },
        drawerStyle: { backgroundColor: background, width: 280 },
      }}
      drawerContent={(props) => <AppDrawerContent {...props} />}
    >
      <Drawer.Screen name="RootStack" component={RootStackNavigator} />
    </Drawer.Navigator>
  );
}
